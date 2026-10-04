const credentialRules = [
  {
    pattern: /\b(password|otp|pin|cvv|card|bank details)\b/i,
    score: 20,
    reason: "Sensitive information mentioned",
  },

  {
    pattern:
      /\b(enter|share|provide|submit|send)\b.*\b(password|otp|pin|cvv)\b/i,
    score: 15,
    reason: "Request for sensitive credentials detected",
  },

  {
    pattern: /\b(one[-\s]?time password|verification code|security code)\b/i,
    score: 15,
    reason: "Authentication code request detected",
  },
];

module.exports = credentialRules;
