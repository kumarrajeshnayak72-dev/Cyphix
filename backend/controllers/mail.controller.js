const detectText = require("../services/detection/detector");
const decideMailDelivery = require("../services/mail.gateway");

const verifyMail = async (req, res) => {
  const { sender, subject, body } = req.body;

  if (!sender || !subject || !body) {
    return res.status(400).json({
      success: false,
      message: "Sender, subject and body are required",
    });
  }

  try {
    // Combine sender, subject and body so the ML model
    // and detection rules can analyze the complete email.
    const combinedText = `
From: ${sender}

Subject: ${subject}

${body}
`;

    const analysis = await detectText(combinedText);

    // Additional sender analysis
    const senderLower = sender.toLowerCase();

    const senderSignals = [];

    if (!senderLower.includes("@")) {
      senderSignals.push({
        score: 20,
        reason: "Invalid sender email format",
      });
    }

    const freeEmailDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
    ];

    const domain = senderLower.split("@")[1];

    if (domain && freeEmailDomains.includes(domain)) {
      senderSignals.push({
        score: 5,
        reason: "Sender uses a free email provider",
      });
    }

    // Add sender risk to the detector score
    const senderScore = senderSignals.reduce(
      (total, signal) => total + signal.score,
      0
    );

    const finalScore = Math.min(
      analysis.score + senderScore,
      100
    );

    // Delivery decision
    const delivery = decideMailDelivery(finalScore);

    const reasons = [
      ...new Set([
        ...analysis.reasons,
        ...senderSignals.map(
          (signal) => signal.reason
        ),
      ]),
    ];

    let status;

    if (finalScore >= 70) {
      status = "malicious";
    } else if (finalScore >= 30) {
      status = "suspicious";
    } else {
      status = "safe";
    }

    res.json({
      success: true,

      sender,
      subject,

      status,
      severity: analysis.severity,
      score: finalScore,

      action: delivery.action,
      deliver: delivery.deliver,

      reasons,

      urls: analysis.urls,

      ml: analysis.ml,

      userMessage: delivery.message,
    });

  } catch (error) {
    console.error(
      "Email analysis failed:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to analyze email",
    });
  }
};

module.exports = {
  verifyMail,
};
