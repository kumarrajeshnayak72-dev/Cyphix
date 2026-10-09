const {
  analyzeImage,
} = require("../services/detection/multimedia/image.analyzer");

// =============================================
// ANALYZE IMAGE
// =============================================

async function analyzeImageController(req, res) {
  console.log("📸 Multimedia image request received");

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    console.log(`📁 Uploaded file: ${req.file.originalname}`);

    console.log(`📦 Saved path: ${req.file.path}`);

    const result = await analyzeImage(req.file.path);

    return res.status(200).json({
      success: true,
      message: "Image analysis completed",
      analysis: result,
    });
  } catch (error) {
    console.error("❌ Multimedia image analysis failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Image analysis failed",
      error: error.message,
    });
  }
}

module.exports = {
  analyzeImageController,
};
