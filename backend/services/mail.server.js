const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");
const nodemailer = require("nodemailer");

const detectText = require("./detection/detector");

const { quarantineMail } = require("./quarantine");

const decideMailDelivery = require("./mail.gateway");

const {
  sendSecurityNotification,
} = require("./notification");


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

  // Local development/testing server
  authOptional: true,


  // ========================================
  // RECEIVE EMAIL
  // ========================================

  onData(stream, session, callback) {

    simpleParser(stream)

      .then(async (mail) => {

        // ==================================
        // EXTRACT EMAIL INFORMATION
        // ==================================

        const sender =
          mail.from?.text || "";

        const recipient =
          mail.to?.text || "";

        const subject =
          mail.subject || "";

        const body =
          mail.text || "";


        console.log("\n");
        console.log("=================================");
        console.log("?? CYBERGUARD INCOMING EMAIL");
        console.log("=================================");

        console.log("From:", sender);
        console.log("To:", recipient);
        console.log("Subject:", subject);


        // ==================================
        // COMBINE EMAIL FOR DETECTION
        // ==================================

        const combinedText = `
From: ${sender}

Subject: ${subject}

${body}
`;


        // ==================================
        // RUN MODULAR DETECTION
        // ==================================

        const analysis =
          await detectText(combinedText);


        // ==================================
        // DELIVERY DECISION
        // ==================================

        const delivery =
          decideMailDelivery(
            analysis.score
          );


        console.log("---------------------------------");
        console.log(
          "Risk Score:",
          analysis.score
        );

        console.log(
          "Severity:",
          analysis.severity
        );

        console.log(
          "Status:",
          analysis.status
        );

        console.log(
          "ML:",
          analysis.ml?.label || "N/A"
        );

        console.log(
          "Action:",
          delivery.action
        );

        console.log("---------------------------------");


        // ==================================
        // BLOCK / QUARANTINE
        // ==================================

        if (delivery.action === "BLOCK") {

          let quarantined;

          try {

            quarantined =
              await quarantineMail(
                {
                  messageId:
                    mail.messageId ||
                    `smtp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,

                  sender,

                  recipient,

                  subject,

                  body,
                },

                analysis
              );


            console.log(
              "?? EMAIL BLOCKED"
            );

            console.log(
              "Quarantine ID:",
              quarantined.quarantineId
            );


          } catch (error) {

            console.error(
              "? Failed to quarantine email:"
            );

            console.error(
              error.message
            );

            return callback(
              new Error(
                "Email quarantine failed"
              )
            );
          }


          // =================================
          // SECURITY NOTIFICATION
          // =================================

          try {

            await sendSecurityNotification(
              {
                sender,
                recipient,
                subject,
              },

              analysis
            );


            console.log(
              "?? Security alert sent."
            );


          } catch (error) {

            console.error(
              "? Security notification failed:"
            );

            console.error(
              error.message
            );
          }


          // =================================
          // DO NOT DELIVER BLOCKED EMAIL
          // =================================

          return callback(
            new Error(
              "Email blocked by CyberGuard"
            )
          );
        }


        // ==================================
        // ALLOW EMAIL
        // ==================================

        if (delivery.action === "ALLOW") {

          console.log(
            "? EMAIL ALLOWED"
          );


          try {

            await deliveryTransporter.sendMail({
              from: sender,
              to: recipient,
              subject,
              text: body,
            });


            console.log(
              "?? Email delivered successfully."
            );


          } catch (error) {

            console.error(
              "? Email delivery failed:"
            );

            console.error(
              error.message
            );

            return callback(error);
          }


          return callback();
        }


        // ==================================
        // WARN / OTHER ACTION
        // ==================================

        console.log(
          "?? Email passed with warning."
        );


        try {

          await deliveryTransporter.sendMail({
            from: sender,
            to: recipient,
            subject,
            text: body,
          });


          console.log(
            "?? Email delivered with warning."
          );


          return callback();


        } catch (error) {

          console.error(
            "? Email delivery failed:"
          );

          console.error(
            error.message
          );

          return callback(error);
        }

      })

      .catch((error) => {

        console.error(
          "? Email parsing failed:"
        );

        console.error(
          error.message
        );

        callback(error);
      });
  },
});


// ==========================================
// START SMTP SERVER
// ==========================================

server.listen(
  2525,
  "localhost",
  () => {

    console.log("");
    console.log("=================================");
    console.log("??? CYBERGUARD MAIL GATEWAY");
    console.log("=================================");
    console.log("SMTP Server: localhost:2525");
    console.log("Status: ONLINE");
    console.log("=================================");
    console.log("");
  }
);


module.exports = server;


