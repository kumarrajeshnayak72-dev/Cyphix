const suspiciousPatterns = [
  {
    pattern: /\burgent\b/i,
    score: 10,
    reason: "Urgent language detected",
  },
  {
    pattern: /\b(immediately|right away|act now)\b/i,
    score: 10,
    reason: "Pressure to act immediately",
  },
  {
    pattern:
      /\b(account|profile|wallet)\b.*\b(blocked|suspended|disabled|locked)\b/i,
    score: 20,
    reason: "Account suspension/blocking claim",
  },
  {
    pattern: /\b(kyc|verification|verify|confirm)\b/i,
    score: 15,
    reason: "Identity or account verification request",
  },
  {
    pattern:
      /\b(permanent suspension|permanently blocked|account will be closed)\b/i,
    score: 15,
    reason: "Threat of permanent account consequences",
  },
  {
    pattern: /\b(password|otp|pin|cvv|card|bank details)\b/i,
    score: 20,
    reason: "Sensitive information mentioned",
  },
  {
    pattern: /\b(click|visit|open|follow)\b.*\b(link|url|below|here)\b/i,
    score: 10,
    reason: "Suspicious call-to-action detected",
  },
];

function extractUrls(text) {
  const urlRegex = /https?:\/\/[^\s]+/gi;
  return text.match(urlRegex) || [];
}

function analyzeUrls(urls) {
  let score = 0;
  const reasons = [];

  urls.forEach((url) => {
    if (url.startsWith("http://")) {
      score += 15;
      reasons.push("URL uses insecure HTTP");
    }

    if (
      url.includes("login") ||
      url.includes("verify") ||
      url.includes("kyc") ||
      url.includes("account")
    ) {
      score += 10;
      reasons.push("URL contains a security-sensitive keyword");
    }

    try {
      const domain = new URL(url).hostname;

      if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
        score += 20;
        reasons.push("URL uses an IP address instead of a domain");
      }
    } catch {
      score += 10;
      reasons.push("Malformed or suspicious URL");
    }
  });

  return {
    score,
    reasons,
  };
}

function detectText(text) {
  const reasons = [];
  let score = 0;

  // Analyze text patterns
  suspiciousPatterns.forEach((item) => {
    if (item.pattern.test(text)) {
      score += item.score;
      reasons.push(item.reason);
    }
  });

  // Analyze URLs
  const urls = extractUrls(text);

  if (urls.length > 0) {
    const urlResult = analyzeUrls(urls);

    score += urlResult.score;
    reasons.push(...urlResult.reasons);
  }

  // Extra combination signal
  const hasAccountThreat =
    /\b(account|profile|wallet)\b/i.test(text) &&
    /\b(blocked|suspended|disabled|locked)\b/i.test(text);

  const hasVerification = /\b(verify|verification|kyc|confirm)\b/i.test(text);

  if (hasAccountThreat && hasVerification) {
    score += 15;
    reasons.push("Account threat combined with verification request");
  }

  score = Math.min(score, 100);

  let status;

  if (score >= 70) {
    status = "malicious";
  } else if (score >= 30) {
    status = "suspicious";
  } else {
    status = "safe";
  }

  return {
    status,
    score,
    reasons,
    urls,
  };
}

module.exports = detectText;
