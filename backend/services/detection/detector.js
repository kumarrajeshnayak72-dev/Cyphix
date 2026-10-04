const phishingRules = require("./rules/phishing.rules");
const scamRules = require("./rules/scam.rules");
const urgencyRules = require("./rules/urgency.rules");
const credentialRules = require("./rules/credential.rules");

const { extractUrls, analyzeUrls } = require("./url/url.detector");

const {
  calculateRiskScore,
  getSeverity,
  getStatus,
  getRecommendedAction,
} = require("./scoring/risk.scorer");

const { analyzeTextWithNLP } = require("./nlp/nlp.detector");

const { classifyText } = require("./nlp/text.classifier");

const { calculateMLRisk } = require("./nlp/ml.scorer");

// --------------------------------
// All rule-based detectors
// --------------------------------

const allRules = [
  ...phishingRules,
  ...scamRules,
  ...urgencyRules,
  ...credentialRules,
];

// --------------------------------
// Main CyberGuard detector
// --------------------------------

async function detectText(text = "") {
  // --------------------------------
  // Validate input
  // --------------------------------

  if (typeof text !== "string" || !text.trim()) {
    return {
      status: "safe",
      severity: "low",
      score: 0,
      reasons: [],
      urls: [],
      action: "allow",
    };
  }

  const signals = [];

  // --------------------------------
  // 1. Rule-based detection
  // --------------------------------

  allRules.forEach((rule) => {
    if (rule.pattern.test(text)) {
      signals.push({
        score: rule.score,
        reason: rule.reason,
        source: "rule",
      });
    }
  });

  // --------------------------------
  // 2. URL detection
  // --------------------------------

  const urls = extractUrls(text);

  if (urls.length > 0) {
    const urlSignals = analyzeUrls(urls);

    signals.push(...urlSignals);
  }

  // --------------------------------
  // 3. Combination detection
  // --------------------------------

  const hasAccountThreat =
    /\b(account|profile|wallet)\b/i.test(text) &&
    /\b(blocked|suspended|disabled|locked)\b/i.test(text);

  const hasVerification = /\b(verify|verification|kyc|confirm)\b/i.test(text);

  if (hasAccountThreat && hasVerification) {
    signals.push({
      score: 15,
      reason: "Account threat combined with verification request",
      source: "combination",
    });
  }

  // --------------------------------
  // 4. NLP analysis
  // --------------------------------

  const nlpResult = analyzeTextWithNLP(text);

  signals.push(...nlpResult.signals);

  // --------------------------------
  // 5. ML phishing classification
  // --------------------------------

  const mlResult = await classifyText(text);

  const mlRisk = calculateMLRisk(mlResult);

  if (mlRisk.score > 0) {
    signals.push({
      score: mlRisk.score,
      reason: mlRisk.reason,
      source: "ml",
    });
  }

  // --------------------------------
  // 6. Calculate final risk score
  // --------------------------------

  const score = calculateRiskScore(signals);

  // --------------------------------
  // 7. Remove duplicate reasons
  // --------------------------------

  const reasons = [...new Set(signals.map((signal) => signal.reason))];

  // --------------------------------
  // 8. Classification
  // --------------------------------

  const status = getStatus(score);
  const severity = getSeverity(score);
  const action = getRecommendedAction(score);

  // --------------------------------
  // 9. Final result
  // --------------------------------

  return {
    status,
    severity,
    score,
    reasons,
    urls,
    action,

    // ML information
    ml: {
      label: mlResult.label,
      confidence: mlResult.confidence,
    },
  };
}

module.exports = detectText;
