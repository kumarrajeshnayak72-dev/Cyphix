const urgencyRules = [
  {
    pattern: /\burgent\b/i,
    score: 10,
    reason: "Urgent language detected",
  },

  {
    pattern: /\b(immediately|right away|act now|hurry|asap)\b/i,
    score: 10,
    reason: "Pressure to act immediately",
  },

  {
    pattern: /\b(within\s+\d+\s*(seconds?|minutes?|hours?))\b/i,
    score: 10,
    reason: "Time pressure detected",
  },

  {
    pattern: /\b(offer expires|expires soon|limited time|last chance)\b/i,
    score: 10,
    reason: "Limited-time pressure detected",
  },

  {
    pattern: /\b(do not wait|don't wait|respond now|take action now)\b/i,
    score: 10,
    reason: "Immediate response pressure detected",
  },
];

module.exports = urgencyRules;
