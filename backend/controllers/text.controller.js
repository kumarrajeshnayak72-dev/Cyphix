const detectText = require("../services/detector");

const verifyText = (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: "Text is required",
    });
  }

  const result = detectText(text);

  res.json({
    success: true,
    input: text,
    ...result,
  });
};

module.exports = {
  verifyText,
};

