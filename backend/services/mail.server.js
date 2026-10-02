const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");
const nodemailer = require("nodemailer");

const detectText = require("./detector");

const { quarantineMail } = require("./quarantine");

const decideMailDelivery = require("./mail.gateway");

const createSecurityNotification = require("./notification");

// ==========================================
// GMAIL SMTP TRANSPORTER
// ==========================================

const deliveryTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ==========================================
// CYBERGUARD SMTP SERVER
// ==========================================

const server = new SMTPServer({
  // Authentication is disabled for our
  // local development/testing server.
  authOptional: true,

  // ------------------------------------------
  // RECEIVE EMAIL
  // ------------------------------------------

  onData(stream, session, callback) {
    simpleParser(stream)
      .then(async (mail) => {
        // ======================================
        // EXTRACT EMAIL INFORMATION
        // ======================================

        const sender = mail.from?.text || "";

        const recipient = mail.to?.text || "";

        const subject = mail.subject || "";

        const body = mail.text || "";

        console.log("\n");
        console.log("=================================");
        console.log("📩 CYBERGUARD INCOMING EMAIL");
        console.log("=================================");

        console.log("From:", sender);
        console.log("To:", recipient);
        console.log("Subject:", subject);

        // ======================================
        // ANALYZE SUBJECT
        // ======================================

        const subjectResult = detectText(subject);

        // ======================================
        // ANALYZE EMAIL BODY
        // ======================================

        const bodyResult = detectText(body);

        // ======================================
        // CALCULATE RISK
        // ======================================

        let score = subjectResult.score + bodyResult.score;

        score = Math.min(score, 100);

        // ======================================
        // COLLECT REASONS
        // ======================================

        const reasons = [...subjectResult.reasons, ...bodyResult.reasons];

        // ======================================
        // COLLECT URLS
        // ======================================

        const urls = [
          ...new Set([
            ...(subjectResult.urls || []),
            ...(bodyResult.urls || []),
          ]),
        ];

        const analysis = {
          score,
          reasons,
          urls,
        };

        // ======================================
        // DELIVERY DECISION
        // ======================================

        const delivery = decideMailDelivery(score);

        console.log("---------------------------------");
        console.log("Risk Score:", score);
        console.log("Action:", delivery.action);
        console.log("---------------------------------");

        // ======================================
        // BLOCK / QUARANTINE
        // ======================================

        if (delivery.action === "BLOCK") {
          const quarantined =await quarantineMail(
            {
              sender,
              recipient,
              subject,
              body,
            },
            analysis,
          );

          console.log("🚨 EMAIL BLOCKED");
          console.log("Quarantine ID:", quarantined.id);

          // User-facing notification.
          // Do NOT expose detailed detection
          // information to the recipient.

          try {
            await createSecurityNotification(
              {
                sender,
                recipient,
                subject,
              },
              analysis,
            );

            console.log("🔔 Security alert sent to:", recipient);
          } catch (error) {
            console.error("❌ Security alert failed:");

            console.error(error.message);
          }

          console.log("📦 Email stored in quarantine");

          callback();
          return;
        }

        // ======================================
        // SAFE EMAIL → FORWARD
        // ======================================

        console.log("✅ EMAIL APPROVED FOR DELIVERY");

        try {
          await deliveryTransporter.sendMail({
            from: process.env.SMTP_USER,

            to: recipient,

            subject: subject,

            text: body,
          });

          console.log("📨 Email forwarded successfully");

          console.log("📬 Delivered to:", recipient);

          callback();
        } catch (error) {
          console.error("❌ Email forwarding failed:");

          console.error(error.message);

          callback(error);
        }
      })

      .catch((error) => {
        console.error("❌ Email processing error:");

        console.error(error.message);

        callback(error);
      });
  },
});

// ==========================================
// START SMTP SERVER
// ==========================================

server.listen(2525, () => {
  console.log("");
  console.log("=================================");
  console.log("🛡️ CYBERGUARD MAIL GATEWAY");
  console.log("=================================");
  console.log("SMTP Server: localhost:2525");
  console.log("Status: ONLINE");
  console.log("=================================");
  console.log("");
});
