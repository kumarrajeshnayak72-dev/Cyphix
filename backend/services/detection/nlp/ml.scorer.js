function calculateMLRisk(result = {}) {
  if (!result || result.label === "UNKNOWN") {
    return {
      score: 0,
      reason: null,
    };
  }

  if (result.label.toLowerCase() === "phishing") {
    const score = Math.round(result.confidence * 30);

    return {
      score,
      reason: `ML model detected phishing with ${(result.confidence * 100).toFixed(1)}% confidence`,
    };
  }

  return {
    score: 0,
    reason: null,
  };
}

module.exports = {
  calculateMLRisk,
};
