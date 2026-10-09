const {
  pipeline,
  RawImage,
} = require("@xenova/transformers");

let classifier = null;


async function loadModel() {

  if (classifier) {
    return classifier;
  }

  console.log("?? Loading AI image detection model...");
  console.log(
    "?? Model: onnx-community/ai-image-detection-ONNX"
  );

  classifier = await pipeline(
    "image-classification",
    "onnx-community/ai-image-detection-ONNX",
    {
      quantized: true,
    }
  );

  console.log(
    "? AI image detection model loaded"
  );

  return classifier;
}


async function detectAIImage(filePath) {

  if (!filePath) {
    throw new Error(
      "Image file path is required"
    );
  }


  const model =
    await loadModel();


  const image =
    await RawImage.read(filePath);


  const results =
    await model(image, {
      topk: 2,
    });


  console.log(
    "?? AI image detection results:"
  );

  console.log(results);


  const fakeResult =
    results.find(
      (result) =>
        result.label?.toUpperCase() === "FAKE"
    );


  const realResult =
    results.find(
      (result) =>
        result.label?.toUpperCase() === "REAL"
    );


  const fakeConfidence =
    fakeResult?.score ?? null;


  const realConfidence =
    realResult?.score ?? null;


  // =============================================
  // AUTHENTICITY
  // =============================================

  let authenticity;


  if (fakeConfidence === null) {

    authenticity =
      "UNKNOWN";

  } else if (fakeConfidence >= 0.70) {

    authenticity =
      "LIKELY_AI_GENERATED";

  } else if (fakeConfidence >= 0.50) {

    authenticity =
      "UNCERTAIN";

  } else {

    authenticity =
      "LIKELY_REAL";
  }


  // =============================================
  // MODEL CONFIDENCE
  // =============================================

  const confidence =
    Math.max(
      fakeConfidence ?? 0,
      realConfidence ?? 0
    );


  // =============================================
  // RETURN
  // =============================================

  return {

    available: true,

    authenticity,

    confidence,

    fakeConfidence,

    realConfidence,

    fakeConfidencePercent:
      fakeConfidence !== null
        ? Number(
            (
              fakeConfidence * 100
            ).toFixed(2)
          )
        : null,

    realConfidencePercent:
      realConfidence !== null
        ? Number(
            (
              realConfidence * 100
            ).toFixed(2)
          )
        : null,

    rawResults:
      results,
  };
}


module.exports = {
  detectAIImage,
};
