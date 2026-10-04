const scamRules = [
  {
    pattern:
      /\b(congratulations|congrats)\b.*\b(winner|selected|chosen|prize|reward)\b/i,
    score: 20,
    reason: "Prize or reward scam pattern detected",
  },

  {
    pattern:
      /\b(you('ve| have)? been selected|you('ve| have)? won|lucky winner|lucky user)\b/i,
    score: 20,
    reason: "Fake winner/selection claim detected",
  },

  {
    pattern: /\b(prize|reward|jackpot|lottery|giveaway|cash prize|bonus)\b/i,
    score: 15,
    reason: "Prize or financial reward language detected",
  },

  {
    pattern:
      /\b(claim|collect|receive)\b.*\b(prize|reward|money|cash|bonus)\b/i,
    score: 15,
    reason: "Prize claim request detected",
  },

  {
    pattern: /(?:₹|\$|€|£)\s?\d[\d,]*(?:\.\d+)?/i,
    score: 10,
    reason: "Monetary amount mentioned",
  },

  {
    pattern: /\b(1,?000,?000|million|crore|lakh)\b/i,
    score: 10,
    reason: "Large financial amount mentioned",
  },
];

module.exports = scamRules;
