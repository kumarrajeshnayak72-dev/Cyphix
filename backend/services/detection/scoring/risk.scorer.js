function calculateRiskScore(signals = []) {
  const score = signals.reduce(
    (total, signal) => total + Number(signal.score || 0),
    0,
  );

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
