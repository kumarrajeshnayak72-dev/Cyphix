const fs = require("fs");
const path = require("path");

const { detectAIImage } = require("./ai.image.detector");

const { extractTextFromImage } = require("./ocr.analyzer");

const detectText = require("../detector");

// =============================================
// IMAGE ANALYZER
// =============================================

async function analyzeImage(filePath) {
  if (!filePath) {
    throw new Error("Image file path is required");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error("Image file not found");
  }

  // =============================================
  // FILE INFORMATION
  // =============================================

  const stats = fs.statSync(filePath);

  const extension = path.extname(filePath).toLowerCase();

  const fileName = path.basename(filePath);

  const supportedFormats = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];

  const evidence = [];

  let score = 0;

  // =============================================
  // BASIC FILE VALIDATION
  // =============================================

  if (!supportedFormats.includes(extension)) {
    score += 20;

    evidence.push("Unknown or unsupported image format");
  }

  if (stats.size === 0) {
    score = 100;

    evidence.push("Image file is empty or corrupted");
  }

  // =============================================
  // SUSPICIOUS DOUBLE EXTENSION
  // =============================================

  const suspiciousDoubleExtension =
    /\.(jpg|jpeg|png|gif|webp)\.(exe|scr|bat|cmd|js|vbs)$/i.test(fileName);

  if (suspiciousDoubleExtension) {
    score = Math.max(score, 70);

    evidence.push("Suspicious double file extension detected");
  }

  // =============================================
  // AI IMAGE AUTHENTICITY
  // =============================================

  let aiDetection;

  try {
    console.log("");
    console.log("🤖 Running AI image detection...");

    aiDetection = await detectAIImage(filePath);

    console.log(`🤖 Authenticity: ${aiDetection.authenticity}`);

    console.log(`📊 Fake confidence: ${aiDetection.fakeConfidencePercent}%`);

    console.log(`📊 Real confidence: ${aiDetection.realConfidencePercent}%`);

    if (aiDetection.authenticity === "LIKELY_AI_GENERATED") {
      evidence.push(
        `AI model indicates the image is likely AI-generated (${aiDetection.fakeConfidencePercent}% confidence)`,
      );
    } else if (aiDetection.authenticity === "UNCERTAIN") {
      evidence.push(
        `AI authenticity is uncertain (${aiDetection.fakeConfidencePercent}% fake-class confidence)`,
      );
    } else if (aiDetection.authenticity === "LIKELY_REAL") {
      evidence.push(
        `AI model indicates the image is likely real (${aiDetection.realConfidencePercent}% confidence)`,
      );
    }
  } catch (error) {
    console.error("⚠️ AI image detection failed:", error.message);

    aiDetection = {
      available: false,

      authenticity: "UNAVAILABLE",

      confidence: 0,

      fakeConfidence: null,

      realConfidence: null,

      fakeConfidencePercent: null,

      realConfidencePercent: null,

      message: error.message,
    };
  }

  // =============================================
  // OCR TEXT EXTRACTION
  // =============================================

  let ocr;

  try {
    console.log("");
    console.log("🔤 Running OCR analysis...");

    ocr = await extractTextFromImage(filePath);
  } catch (error) {
    console.error("⚠️ OCR failed:", error.message);

    ocr = {
      available: false,

      text: "",

      hasText: false,

      message: error.message,
    };
  }

  // =============================================
  // ANALYZE OCR TEXT
  // WITH EXISTING CYBERGUARD DETECTOR
  // =============================================

  let textAnalysis = null;

  if (ocr.available && ocr.hasText) {
    console.log("");
    console.log("🛡️ Analyzing OCR text with CyberGuard...");

    try {
      textAnalysis = await detectText(ocr.text);

      console.log(`📊 OCR risk score: ${textAnalysis.score}%`);

      console.log(`🛡️ OCR status: ${textAnalysis.status}`);

      // =========================================
      // USE TEXT THREAT SCORE
      // =========================================

      score = Math.max(score, textAnalysis.score || 0);

      // =========================================
      // ADD IMPORTANT TEXT EVIDENCE
      // =========================================

      if (textAnalysis.score >= 30) {
        evidence.push(
          `Suspicious text detected inside image (${textAnalysis.score}% risk)`,
        );
      }
    } catch (error) {
      console.error("⚠️ OCR text threat analysis failed:", error.message);
    }
  }

  // =============================================
  // FINAL SCORE LIMIT
  // =============================================

  score = Math.min(Math.max(score, 0), 100);

  // =============================================
  // FINAL CLASSIFICATION
  // =============================================

  let classification;

  if (score >= 70) {
    classification = "MALICIOUS";
  } else if (score >= 30) {
    classification = "SUSPICIOUS";
  } else {
    classification = "SAFE";
  }

  // =============================================
  // FINAL RESULT
  // =============================================

  return {
    type: "image",

    score,

    classification,

    evidence:
      evidence.length > 0 ? evidence : ["No cyber-threat indicators detected"],

    aiDetection,

    ocr: {
      available: ocr.available,

      hasText: ocr.hasText,

      text: ocr.text,
    },

    textAnalysis,

    file: {
      name: fileName,

      extension,

      size: stats.size,
    },
  };
}

module.exports = {
  analyzeImage,
};
