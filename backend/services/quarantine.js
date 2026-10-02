const Quarantine = require("../models/Quarantine");
const { deleteGmailMessage } = require("./gmail.service");

async function quarantineMail(mail, analysis) {
  const existing = await Quarantine.findOne({
    messageId: mail.messageId,
  });

  if (existing) {
    console.log(`⏭️ Already quarantined: ${mail.messageId}`);

    return existing;
  }

  const quarantineId = `CG-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;

  try {
    const item = await Quarantine.create({
      messageId: mail.messageId,
      quarantineId,
      sender: mail.sender,
      recipient: mail.recipient,
      subject: mail.subject,
      body: mail.body,
      riskScore: analysis.score,
      status: "QUARANTINED",
      reasons: analysis.reasons,
      urls: analysis.urls,
    });

    console.log(`🛡️ Quarantine record created: ${item.quarantineId}`);

    // =====================================
    // KEEP ONLY 20 QUARANTINE RECORDS
    // =====================================

    const count = await Quarantine.countDocuments();

    if (count > 20) {
      const oldRecords = await Quarantine.find()
        .sort({ receivedAt: 1 })
        .limit(count - 20);

      for (const oldRecord of oldRecords) {
        try {
          // Delete old email from Gmail
          await deleteGmailMessage(oldRecord.messageId);

          console.log(`🗑️ Old Gmail email deleted: ${oldRecord.subject}`);
        } catch (error) {
          console.error(
            `⚠️ Failed to delete old Gmail email: ${oldRecord.messageId}`,
          );

          console.error(error.message);
        }

        // Delete old MongoDB quarantine record
        await Quarantine.findByIdAndDelete(oldRecord._id);

        console.log(
          `🗑️ Old quarantine record deleted: ${oldRecord.quarantineId}`,
        );
      }
    }

    return item;
  } catch (error) {
    if (error.code === 11000) {
      console.log(`⏭️ Duplicate quarantine prevented: ${mail.messageId}`);

      return await Quarantine.findOne({
        messageId: mail.messageId,
      });
    }

    console.error("❌ Failed to create quarantine record:", error.message);

    throw error;
  }
}

async function getQuarantinedMails() {
  return await Quarantine.find().sort({ receivedAt: -1 });
}

module.exports = {
  quarantineMail,
  getQuarantinedMails,
};
