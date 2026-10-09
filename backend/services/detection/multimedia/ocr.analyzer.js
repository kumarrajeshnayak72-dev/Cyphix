const { createWorker } = require("tesseract.js");

let worker = null;

// =============================================
// LOAD OCR MODEL
// =============================================

async function loadOCR() {
  if (worker) {
    return worker;
  }

  console.log("🔤 Loading OCR model...");

  worker = await createWorker("eng");

  console.log("✅ OCR model loaded");

  return worker;
}

// =============================================
// EXTRACT TEXT FROM IMAGE
// =============================================

async function extractTextFromImage(filePath) {
  if (!filePath) {
    throw new Error("Image file path is required");
  }

  const ocr = await loadOCR();

  console.log("🔍 Extracting text from image...");

  const result = await ocr.recognize(filePath);

  const text = result.data.text?.replace(/\s+/g, " ").trim() || "";

  // ===========================================
  // OCR CONFIDENCE
  // ===========================================

  const confidence = Number(result.data.confidence || 0);

  console.log(`📝 OCR confidence: ${confidence.toFixed(2)}%`);

  console.log(`📝 OCR extracted: ${text || "[No text detected]"}`);

  // ===========================================
  // TEXT QUALITY
  // ===========================================

  const characters = text.replace(/\s/g, "");

  const characterCount = characters.length;

  const words = text ? text.split(/\s+/).filter(Boolean) : [];

  const wordCount = words.length;

  // ===========================================
  // DETECT MEANINGFUL TEXT
  // ===========================================

  const alphabeticCharacters = characters.match(/[A-Za-z]/g) || [];

  const alphabeticRatio =
    characterCount > 0 ? alphabeticCharacters.length / characterCount : 0;

  const hasEnoughText = wordCount >= 3 && characterCount >= 10;

  const goodOCRConfidence = confidence >= 55;

  const meaningfulText =
    hasEnoughText && goodOCRConfidence && alphabeticRatio >= 0.5;

  // ===========================================
  // RETURN
  // ===========================================

  return {
    available: true,

    hasText: meaningfulText,

    text: meaningfulText ? text : "",

    confidence,

    characterCount,

    wordCount,

    alphabeticRatio: Number(alphabeticRatio.toFixed(2)),

    meaningfulText,

    message: meaningfulText
      ? "Readable text detected"
      : "OCR text quality too low for threat analysis",
  };
}

module.exports = {
  extractTextFromImage,
};
