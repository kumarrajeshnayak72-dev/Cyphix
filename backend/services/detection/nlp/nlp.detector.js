function analyzeTextWithNLP(text = "") {
  if (typeof text !== "string" || !text.trim()) {
    return {
      score: 0,
      signals: [],
    };
  }

  const signals = [];
  const normalizedText = text.toLowerCase();

  // Social engineering intent
  const socialEngineeringPatterns = [
    /\byou have won\b/i,
    /\byou have been selected\b/i,
    /\byour account is at risk\b/i,
    /\bsecurity alert\b/i,
    /\bimportant notice\b/i,
  ];

  if (
    socialEngineeringPatterns.some((pattern) => pattern.test(normalizedText))
  ) {
    signals.push({
      score: 15,
      reason: "Potential social-engineering intent detected",
      source: "nlp",
    });
  }

  // Financial lure
  const financialPatterns = [
    /\bprize\b/i,
    /\breward\b/i,
    /\blottery\b/i,
    /\bjackpot\b/i,
    /\bbonus\b/i,
    /\bcash\b/i,
    /\bmoney\b/i,
    /\bprofit\b/i,
  ];

  if (financialPatterns.some((pattern) => pattern.test(normalizedText))) {
    signals.push({
      score: 10,
      reason: "Potential financial lure detected",
      source: "nlp",
    });
  }

  // Fear / threat language
  const threatPatterns = [
    /\baccount will be closed\b/i,
    /\baccount will be blocked\b/i,
    /\byou will lose\b/i,
    /\bsecurity risk\b/i,
    /\bunauthorized access\b/i,
  ];

  if (threatPatterns.some((pattern) => pattern.test(normalizedText))) {
    signals.push({
      score: 10,
      reason: "Threat or fear-based language detected",
      source: "nlp",
    });
  }

  // Urgency context
  const urgencyPatterns = [
    /\bimmediately\b/i,
    /\bact now\b/i,
    /\burgent\b/i,
    /\basap\b/i,
    /\bright away\b/i,
  ];

  if (urgencyPatterns.some((pattern) => pattern.test(normalizedText))) {
    signals.push({
      score: 10,
      reason: "Urgency context detected",
      source: "nlp",
    });
  }

  const score = Math.min(
    signals.reduce((total, signal) => total + signal.score, 0),
    100,
  );

  return {
    score,
    signals,
  };
}

module.exports = {
  analyzeTextWithNLP,
};
