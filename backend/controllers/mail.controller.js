const detectText = require("../services/detector");
const decideMailDelivery = require("../services/mail.gateway");

const verifyMail = (req, res) => {
  const { sender, subject, body } = req.body;

  if (!sender || !subject || !body) {
    return res.status(400).json({
      success: false,
      message: "Sender, subject and body are required",
    });
  }

  let score = 0;
  const reasons = [];

  // Sender analysis
  const senderLower = sender.toLowerCase();

  if (!senderLower.includes("@")) {
    score += 20;
    reasons.push("Invalid sender email format");
  }

  const freeEmailDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
  ];

  const domain = senderLower.split("@")[1];

  if (domain && freeEmailDomains.includes(domain)) {
    score += 5;
    reasons.push("Sender uses a free email provider");
  }

  // Subject analysis
  const subjectResult = detectText(subject);

  score += subjectResult.score;
  reasons.push(...subjectResult.reasons);

  // Body analysis
  const bodyResult = detectText(body);

  score += bodyResult.score;
  reasons.push(...bodyResult.reasons);

  score = Math.min(score, 100);

  let status;

  if (score >= 70) {
    status = "malicious";
  } else if (score >= 30) {
    status = "suspicious";
  } else {
    status = "safe";
  }

  // Delivery decision
  const delivery = decideMailDelivery(score);

  res.json({
    success: true,

    sender,
    subject,

    status,
    score,

    action: delivery.action,
    deliver: delivery.deliver,

    // Only show reasons to CyberGuard/admin.
    reasons,

    urls: bodyResult.urls,

    userMessage: delivery.message,
  });
};

module.exports = {
  verifyMail,
};
