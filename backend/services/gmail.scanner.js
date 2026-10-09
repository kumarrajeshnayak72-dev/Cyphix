const {
  getGmailClient,
  getRecentEmails,
  getOrCreateQuarantineLabel,
  checkGmailMessageLabels,
} = require("./gmail.service");

const detectText = require("./detection/detector");
const { quarantineMail } = require("./quarantine");
const Quarantine = require("../models/Quarantine");
const RestoredMessage = require("../models/RestoredMessage");

const {
  sendSecurityNotification,
  createDashboardNotification,
} = require("./notification");

async function scanAndQuarantineGmail() {
  try {
    const { gmail } = await getGmailClient();

    const quarantineLabelId =
      await getOrCreateQuarantineLabel();

    console.log(
      `??? CyberGuard Quarantine Label ID: ${quarantineLabelId}`
    );

    const emails = await getRecentEmails(10);
    const results = [];

    console.log(
      `?? Checking ${emails.length} recent email(s)...`
    );

    for (const email of emails) {
      const sender = email.sender || "";
      const subject = email.subject || "";
      const body = email.body || "";

      const isCyberGuardNotification =
        (
          process.env.SMTP_USER &&
          sender
            .toLowerCase()
            .includes(
              process.env.SMTP_USER.toLowerCase()
            )
        ) ||
        subject
          .toLowerCase()
          .includes(
            "cyberguard security alert"
          );

      if (isCyberGuardNotification) {
        console.log(
          `?? Skipping CyberGuard notification: ${subject}`
        );
        continue;
      }

      // =========================================
      // CHECK PREVIOUSLY RESTORED EMAIL
      // =========================================

      const restoredMessage =
        await RestoredMessage.findOne({
          messageId: email.id,
        });

      if (restoredMessage) {
        console.log("");
        console.log(
          `?? Skipping previously restored email: ${subject}`
        );
        console.log(
          `?? Restored Gmail Message ID: ${email.id}`
        );

        results.push({
          ...email,
          analysis: {
            status: "safe",
            severity: "low",
            score: 0,
            reasons: [
              "Email was previously restored by the user",
            ],
            urls: [],
            action: "allow",
            ml: {
              label: "SKIPPED",
              confidence: 0,
            },
          },
          action: "RESTORED_SKIPPED",
        });

        continue;
      }

      // =========================================
      // COMBINE EMAIL CONTENT
      // =========================================

      const combinedText = `
From: ${sender}

Subject: ${subject}

${body}
`;

      // =========================================
      // RUN DETECTION
      // =========================================

      const analysis = await detectText(combinedText, {
        sender,
        subject,
      });

      let action = "NONE";

      console.log("");
      console.log(`?? Email: ${subject}`);
      console.log(
        `?? Risk Score: ${analysis.score}%`
      );
      console.log(
        `??? Status: ${analysis.status}`
      );
      console.log(
        `?? ML: ${analysis.ml?.label || "N/A"}`
      );

      // =========================================
      // QUARANTINE MALICIOUS EMAILS
      // =========================================

      if (analysis.score >= 70) {
        console.log(
          "?? HIGH-RISK EMAIL DETECTED"
        );

        // =======================================
        // CHECK EXISTING QUARANTINE
        // =======================================

        const existingQuarantine =
          await Quarantine.findOne({
            messageId: email.id,
          });

        if (existingQuarantine) {
          console.log(
            `?? Email already exists in quarantine: ${email.id}`
          );

          try {
            await gmail.users.messages.modify({
              userId: "me",
              id: email.id,
              requestBody: {
                removeLabelIds: [
                  "INBOX",
                  "SPAM",
                ],
                addLabelIds: [
                  quarantineLabelId,
                ],
              },
            });

            await checkGmailMessageLabels(
              email.id
            );

            console.log(
              `? Existing email confirmed in CyberGuard/Quarantine: ${subject}`
            );

            action = "QUARANTINED";
          } catch (error) {
            console.error(
              "? Failed to restore Gmail quarantine state:"
            );

            console.error(
              error.response?.data ||
              error.message
            );

            action =
              "QUARANTINE_LABEL_FAILED";
          }

          results.push({
            ...email,
            analysis,
            action,
          });

          continue;
        }

        // =======================================
        // CREATE MONGODB QUARANTINE RECORD
        // =======================================

        let quarantine;

        try {
          quarantine =
            await quarantineMail(
              {
                messageId: email.id,
                sender,
                recipient:
                  email.recipient || "",
                subject,
                body,
              },
              analysis
            );

          console.log(
            `??? MongoDB quarantine record created: ${quarantine.quarantineId}`
          );
        } catch (error) {
          console.error(
            "? Failed to create MongoDB quarantine record:"
          );

          console.error(error.message);

          results.push({
            ...email,
            analysis,
            action:
              "QUARANTINE_DATABASE_FAILED",
          });

          continue;
        }

        // =======================================
        // MOVE EMAIL TO GMAIL QUARANTINE
        // =======================================

        let gmailQuarantineSuccessful =
          false;

        try {
          console.log("");
          console.log(
            "?? ATTEMPTING GMAIL QUARANTINE"
          );

          console.log(
            `?? Message ID: ${email.id}`
          );

          console.log(
            `?? Label ID: ${quarantineLabelId}`
          );

          const modifyResult =
            await gmail.users.messages.modify({
              userId: "me",
              id: email.id,
              requestBody: {
                removeLabelIds: [
                  "INBOX",
                  "SPAM",
                ],
                addLabelIds: [
                  quarantineLabelId,
                ],
              },
            });

          await checkGmailMessageLabels(
            email.id
          );

          console.log(
            "? GMAIL QUARANTINE SUCCESSFUL"
          );

          console.log(
            `?? Email moved to CyberGuard/Quarantine: ${subject}`
          );

          console.log(
            "?? Gmail response:",
            modifyResult.data
          );

          gmailQuarantineSuccessful =
            true;

          action = "QUARANTINED";
        } catch (error) {
          console.error("");
          console.error(
            "? GMAIL QUARANTINE FAILED"
          );

          console.error(
            `Subject: ${subject}`
          );

          console.error(
            `Message ID: ${email.id}`
          );

          console.error(
            `Label ID: ${quarantineLabelId}`
          );

          console.error(
            "Gmail API Error:"
          );

          console.error(
            error.response?.data ||
            error.message
          );

          console.error("");

          action =
            "QUARANTINE_LABEL_FAILED";
        }

        // =======================================
        // SEND ALERTS ONLY AFTER GMAIL SUCCESS
        // =======================================

        if (gmailQuarantineSuccessful) {
          console.log(
            "?? Gmail quarantine confirmed."
          );

          console.log(
            "?? Sending CyberGuard security alerts..."
          );

          // EMAIL SECURITY ALERT
          try {
            await sendSecurityNotification(
              {
                sender,
                recipient:
                  email.recipient || "",
                subject,
              },
              analysis
            );

            console.log(
              `?? Security notification sent: ${subject}`
            );
          } catch (error) {
            console.error(
              "? Security notification failed:"
            );

            console.error(
              error.message
            );
          }

          // DASHBOARD NOTIFICATION
          try {
            await createDashboardNotification(
              quarantine,
              analysis
            );

            console.log(
              `?? Dashboard notification created: ${subject}`
            );
          } catch (error) {
            console.error(
              "? Dashboard notification failed:"
            );

            console.error(
              error.message
            );
          }
        } else {
          console.log(
            "?? Gmail quarantine failed."
          );

          console.log(
            "?? Security alerts NOT sent."
          );
        }
      }

      // =========================================
      // SAVE SCAN RESULT
      // =========================================

      results.push({
        ...email,
        analysis,
        action,
      });
    }

    return results;
  } catch (error) {
    console.error(
      "? Gmail scanning failed:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    throw error;
  }
}

module.exports = {
  scanAndQuarantineGmail,
};
