const nodemailer = require("nodemailer");
const Notification = require("../models/Notification");

// ==========================================
// EMAIL NOTIFICATION
// ==========================================

const notificationTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendSecurityNotification(mail, analysis) {
  const message = {
    from: process.env.SMTP_USER,

    to: mail.recipient,

    subject: "🛡️ CyberGuard Security Alert - Email Blocked",

    text: `
CyberGuard Security Alert

A suspicious email addressed to your account has been blocked and placed in quarantine.

Email Details
-------------

From: ${mail.sender}
Subject: ${mail.subject}
Risk Score: ${analysis.score}%

Action: BLOCKED
Status: QUARANTINED

Why was this email blocked?

${analysis.reasons.map((reason, index) => `${index + 1}. ${reason}`).join("\n")}

The original email was not delivered to your inbox.

You can review the email details in the CyberGuard Quarantine Dashboard.

CyberGuard Security System
`,
  };

  return await notificationTransporter.sendMail(message);
}

// ==========================================
// DASHBOARD NOTIFICATIONS
// ==========================================

async function createDashboardNotification(quarantine, analysis) {
  // Prevent duplicate dashboard notifications
  const existing = await Notification.findOne({
    quarantineId: quarantine.quarantineId,
  });

  if (existing) {
    return existing;
  }

  return await Notification.create({
    type: "SECURITY_ALERT",

    title: "Suspicious email quarantined",

    message:
      `A suspicious email from ${quarantine.sender} ` +
      `was quarantined by CyberGuard.`,

    severity: analysis.score >= 90 ? "CRITICAL" : "HIGH",

    quarantineId: quarantine.quarantineId,

    emailSubject: quarantine.subject,

    sender: quarantine.sender,

    riskScore: analysis.score,

    reasons: analysis.reasons,

    read: false,
  });
}

async function getNotifications() {
  return await Notification.find().sort({
    createdAt: -1,
  });
}

async function getUnreadCount() {
  return await Notification.countDocuments({
    read: false,
  });
}

async function markNotificationAsRead(id) {
  return await Notification.findByIdAndUpdate(
    id,
    {
      read: true,
    },
    {
      returnDocument: "after",
    },
  );
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  sendSecurityNotification,
  createDashboardNotification,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
};
