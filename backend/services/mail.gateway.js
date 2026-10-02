function decideMailDelivery(score) {
  if (score >= 90) {
    return {
      action: "BLOCK",
      deliver: false,
      message: "This email was blocked because it was detected as suspicious.",
    };
  }

  return {
    action: "DELIVER",
    deliver: true,
    message: "Email delivered successfully.",
  };
}

module.exports = decideMailDelivery;
