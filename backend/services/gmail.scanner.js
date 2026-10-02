const {
  getGmailClient,
  getRecentEmails,
  getOrCreateQuarantineLabel,
  checkGmailMessageLabels,
} = require("./gmail.service");

const detectText = require("./detector");

const { quarantineMail } = require("./quarantine");

const Quarantine = require("../models/Quarantine");

const {
  sendSecurityNotification,
  createDashboardNotification,
} = require("./notification");

async function scanAndQuarantineGmail() {
  try {
    // =============================================
    // GET GMAIL CLIENT
    // =============================================

    const { gmail } = await getGmailClient();

    // =============================================
    // GET / CREATE CYBERGUARD QUARANTINE LABEL
    // =============================================

    const quarantineLabelId = await getOrCreateQuarantineLabel();

    console.log(`🏷️ CyberGuard Quarantine Label ID: ${quarantineLabelId}`);

    // =============================================
    // GET RECENT INBOX EMAILS
    // =============================================

    const emails = await getRecentEmails(10);

    const results = [];

    console.log(`📨 Checking ${emails.length} recent email(s)...`);

    // =============================================
    // PROCESS EACH EMAIL
    // =============================================

    for (const email of emails) {
      const sender = email.sender || "";

      const subject = email.subject || "";

      const body = email.body || "";

      // ===========================================
      // IGNORE CYBERGUARD'S OWN EMAIL ALERTS
      // ===========================================

      const isCyberGuardNotification =
        (process.env.SMTP_USER &&
          sender.toLowerCase().includes(process.env.SMTP_USER.toLowerCase())) ||
        subject.toLowerCase().includes("cyberguard security alert");

      if (isCyberGuardNotification) {
        console.log(`⏭️ Skipping CyberGuard notification: ${subject}`);

        continue;
      }

      // ===========================================
      // DETECT EMAIL
      // ===========================================

      const combinedText = `
From: ${sender}

Subject: ${subject}

${body}
`;

      const analysis = detectText(combinedText);

      let action = "NONE";

      console.log("");
      console.log(`🔍 Email: ${subject}`);

      console.log(`📊 Risk Score: ${analysis.score}%`);

      console.log(`🛡️ Status: ${analysis.status}`);

      // ===========================================
      // ONLY QUARANTINE MALICIOUS EMAILS
      // SCORE >= 70
      // ===========================================

      if (analysis.score >= 70) {
        console.log("🚨 HIGH-RISK EMAIL DETECTED");

        // =========================================
        // CHECK FOR EXISTING QUARANTINE
        // =========================================

        const existingQuarantine = await Quarantine.findOne({
          messageId: email.id,
        });

        // =========================================
        // ALREADY QUARANTINED
        // =========================================

        if (existingQuarantine) {
          console.log(`⏭️ Email already exists in quarantine: ${email.id}`);

          // ---------------------------------------
          // Make sure Gmail has the correct label
          // ---------------------------------------

          try {
            await gmail.users.messages.modify({
              userId: "me",
              id: email.id,
              requestBody: {
                removeLabelIds: ["INBOX", "SPAM"],
                addLabelIds: [quarantineLabelId],
              },
            });

            await checkGmailMessageLabels(email.id);

            console.log(
              `✅ Existing email confirmed in CyberGuard/Quarantine: ${subject}`,
            );

            action = "QUARANTINED";
          } catch (error) {
            console.error("❌ Failed to restore Gmail quarantine state:");

            console.error(error.response?.data || error.message);

            action = "QUARANTINE_LABEL_FAILED";
          }

          results.push({
            ...email,
            analysis,
            action,
          });

          continue;
        }

        // =========================================
        // CREATE MONGODB QUARANTINE RECORD
        // =========================================

        let quarantine;

        try {
          quarantine = await quarantineMail(
            {
              messageId: email.id,
              sender: sender,
              recipient: email.recipient || "",
              subject: subject,
              body: body,
            },
            analysis,
          );

          console.log(
            `🛡️ MongoDB quarantine record created: ${quarantine.quarantineId}`,
          );
        } catch (error) {
          console.error("❌ Failed to create MongoDB quarantine record:");

          console.error(error.message);

          results.push({
            ...email,
            analysis,
            action: "QUARANTINE_DATABASE_FAILED",
          });

          continue;
        }

        // =========================================
        // MOVE EMAIL TO GMAIL QUARANTINE
        // =========================================

        let gmailQuarantineSuccessful = false;

        try {
          console.log("");
          console.log("🚨 ATTEMPTING GMAIL QUARANTINE");

          console.log(`📌 Message ID: ${email.id}`);

          console.log(`📌 Label ID: ${quarantineLabelId}`);

          const modifyResult = await gmail.users.messages.modify({
            userId: "me",

            id: email.id,

            requestBody: {
              // Remove from Inbox
              removeLabelIds: ["INBOX"],

              // Add CyberGuard/Quarantine
              addLabelIds: [quarantineLabelId],
            },
          });

          console.log("✅ GMAIL QUARANTINE SUCCESSFUL");

          console.log(`📁 Email moved to CyberGuard/Quarantine: ${subject}`);

          console.log("📨 Gmail response:", modifyResult.data);

          gmailQuarantineSuccessful = true;

          action = "QUARANTINED";
        } catch (error) {
          console.error("");
          console.error("❌ GMAIL QUARANTINE FAILED");

          console.error(`Subject: ${subject}`);

          console.error(`Message ID: ${email.id}`);

          console.error(`Label ID: ${quarantineLabelId}`);

          console.error("Gmail API Error:");

          console.error(error.response?.data || error.message);

          console.error("");

          action = "QUARANTINE_LABEL_FAILED";
        }

        // =========================================
        // SEND ALERTS ONLY AFTER SUCCESSFUL
        // GMAIL QUARANTINE
        // =========================================

        if (gmailQuarantineSuccessful) {
          console.log("🔐 Gmail quarantine confirmed.");

          console.log("📢 Sending CyberGuard security alerts...");

          // ---------------------------------------
          // EMAIL SECURITY ALERT
          // ---------------------------------------

          try {
            await sendSecurityNotification(
              {
                sender: sender,

                recipient: email.recipient || "",

                subject: subject,
              },

              analysis,
            );

            console.log(`📧 Security notification sent: ${subject}`);
          } catch (error) {
            console.error("❌ Security notification failed:");

            console.error(error.message);
          }

          // ---------------------------------------
          // DASHBOARD NOTIFICATION
          // ---------------------------------------

          try {
            await createDashboardNotification(quarantine, analysis);

            console.log(`🔔 Dashboard notification created: ${subject}`);
          } catch (error) {
            console.error("❌ Dashboard notification failed:");

            console.error(error.message);
          }
        } else {
          // ---------------------------------------
          // DO NOT SEND ALERTS IF GMAIL
          // QUARANTINE FAILED
          // ---------------------------------------

          console.log("⚠️ Gmail quarantine failed.");

          console.log("🚫 Security alerts NOT sent.");
        }
      }

      // ===========================================
      // SAVE SCAN RESULT
      // ===========================================

      results.push({
        ...email,
        analysis,
        action,
      });
    }

    return results;
  } catch (error) {
    console.error("❌ Gmail scanning failed:");

    console.error(error.response?.data || error.message);

    throw error;
  }
}

module.exports = {
  scanAndQuarantineGmail,
};
