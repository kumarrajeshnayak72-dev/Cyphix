const detectText = require("../services/detector");

const checkSms = (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "SMS text is required",
      });
    }

    const analysis = detectText(text);

    res.json({
      success: true,
      result: analysis,
    });
  } catch (error) {
    console.error("SMS analysis failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to analyze SMS",
    });
  }
};

module.exports = {
  checkSms,
};
