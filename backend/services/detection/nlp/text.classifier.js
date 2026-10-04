const {
  AutoTokenizer,
  AutoModelForSequenceClassification,
} = require("@xenova/transformers");

const MODEL_NAME =
  "onnx-community/bert-small-phishing-ONNX";

let tokenizer = null;
let model = null;

const MAX_TOKENS = 512;


// ==========================================
// LOAD MODEL
// ==========================================

async function loadModel() {

  if (!tokenizer || !model) {

    console.log(
      "Loading phishing ML model..."
    );

    tokenizer =
      await AutoTokenizer.from_pretrained(
        MODEL_NAME
      );

    model =
      await AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        {
          quantized: true,
        }
      );

    console.log(
      "Phishing ML model loaded."
    );
  }

  return {
    tokenizer,
    model,
  };
}


// ==========================================
// CLASSIFY TEXT
// ==========================================

async function classifyText(text) {

  if (
    typeof text !== "string" ||
    !text.trim()
  ) {
    return {
      label: "UNKNOWN",
      confidence: 0,
      score: 0,
    };
  }


  const {
    tokenizer,
    model,
  } = await loadModel();


  // ========================================
  // TOKENIZE AND TRUNCATE
  // ========================================

  const inputs =
    await tokenizer(
      text,
      {
        truncation: true,
        max_length: MAX_TOKENS,
      }
    );


  console.log(
    `?? ML input tokens: ${inputs.input_ids.dims[1]}`
  );


  // ========================================
  // RUN ONNX MODEL DIRECTLY
  // ========================================

  const output =
    await model(inputs);


  const logits =
    output.logits;


  // ========================================
  // SOFTMAX
  // ========================================

  const values =
    Array.from(logits.data);

  const maxLogit =
    Math.max(...values);

  const exponentials =
    values.map(
      (value) =>
        Math.exp(value - maxLogit)
    );

  const sum =
    exponentials.reduce(
      (a, b) => a + b,
      0
    );

  const probabilities =
    exponentials.map(
      (value) => value / sum
    );


  // ========================================
  // FIND PREDICTED CLASS
  // ========================================

  let predictedIndex = 0;

  for (
    let i = 1;
    i < probabilities.length;
    i++
  ) {

    if (
      probabilities[i] >
      probabilities[predictedIndex]
    ) {
      predictedIndex = i;
    }
  }


  const confidence =
    probabilities[predictedIndex];


  // ========================================
  // MODEL LABELS
  // ========================================

  const labels =
    model.config?.id2label || {};


  const label =
    labels[predictedIndex] ||
    labels[String(predictedIndex)] ||
    `LABEL_${predictedIndex}`;


  return {
    label: label.toLowerCase(),

    confidence:
      Number(
        confidence.toFixed(4)
      ),

    score:
      Number(
        (confidence * 100).toFixed(2)
      ),
  };
}


module.exports = {
  classifyText,
};
