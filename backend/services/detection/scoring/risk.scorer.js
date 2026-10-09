function calculateRiskScore(signals = []) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return 0;
  }

  let positiveScore = 0;
  let negativeScore = 0;

  const positiveSources = new Set();

  for (const signal of signals) {
    const value = Number(signal.score || 0);

    if (value > 0) {
      positiveScore += value;

      if (signal.source) {
        positiveSources.add(signal.source);
      }
    } else if (value < 0) {
      negativeScore += Math.abs(value);
    }
  }

  // =============================================
  // CAP POSITIVE EVIDENCE
  // =============================================

  positiveScore = Math.min(positiveScore, 100);

  // =============================================
  // APPLY TRUST / BENIGN CONTEXT
  // =============================================

  const finalScore = Math.max(0, positiveScore - negativeScore);

  // =============================================
  // ML-ONLY PROTECTION
  // =============================================

  const hasML = signals.some(
    (signal) => signal.source === "ml" && Number(signal.score || 0) > 0,
  );

  const hasNonMLPositiveSignal = signals.some(
    (signal) => signal.source !== "ml" && Number(signal.score || 0) > 0,
  );

  let score = finalScore;

  // ML alone can never quarantine.
  if (hasML && !hasNonMLPositiveSignal) {
    score = Math.min(score, 29);
  }

  // =============================================
  // REQUIRE MULTIPLE SOURCES FOR QUARANTINE
  // =============================================

  if (score >= 70 && positiveSources.size < 2) {
    score = 69;
  }

  return Math.min(Math.round(score), 100);
}

function getSeverity(score) {
  if (score >= 70) {
    return "critical";
  }

  if (score >= 50) {
    return "high";
  }

  if (score >= 30) {
    return "medium";
  }

  return "low";
}

function getStatus(score) {
  if (score >= 70) {
    return "malicious";
  }

  if (score >= 30) {
    return "suspicious";
  }

  return "safe";
}

function getRecommendedAction(score) {
  if (score >= 70) {
    return "quarantine";
  }

  if (score >= 30) {
    return "warn";
  }

  return "allow";
}

module.exports = {
  calculateRiskScore,

  getSeverity,

  getStatus,

  getRecommendedAction,
};
