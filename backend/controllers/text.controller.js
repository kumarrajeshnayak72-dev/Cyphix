const detectText = require("../services/detection/detector");

const verifyText = async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: "Text is required",
    });
  }

  try {
    const result = await detectText(text);

    res.json({
      success: true,
      input: text,
      ...result,
    });
  } catch (error) {
    console.error("Text detection error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to analyze text",
    });
  }
};

module.exports = {
  verifyText,
};
