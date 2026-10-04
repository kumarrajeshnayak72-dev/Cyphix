const phishingRules = [
  {
    pattern:
      /\b(account|profile|wallet)\b.*\b(blocked|suspended|disabled|locked)\b/i,
    score: 20,
    reason: "Account suspension/blocking claim",
  },

  {
    pattern:
      /\b(permanent suspension|permanently blocked|account will be closed|account closure)\b/i,
    score: 15,
    reason: "Threat of permanent account consequences",
  },

  {
    pattern: /\b(verify|verification|kyc|confirm)\b/i,
    score: 15,
    reason: "Identity or account verification request",
  },

  {
    pattern: /\b(click|visit|open|follow)\b.*\b(link|url|below|here)\b/i,
    score: 10,
    reason: "Suspicious call-to-action detected",
  },
];

module.exports = phishingRules;
