function extractUrls(text = "") {
  const urlRegex = /https?:\/\/[^\s]+/gi;

  return text.match(urlRegex) || [];
}

function analyzeUrls(urls = []) {
  const signals = [];

  urls.forEach((url) => {
    const cleanUrl = url.replace(/[),.!?]+$/, "");

    // Insecure HTTP
    if (/^http:\/\//i.test(cleanUrl)) {
      signals.push({
        score: 15,
        reason: "URL uses insecure HTTP",
        source: "url",
      });
    }

    // Security-sensitive keywords
    if (
      /\b(login|verify|kyc|account|secure|update|password)\b/i.test(cleanUrl)
    ) {
      signals.push({
        score: 10,
        reason: "URL contains a security-sensitive keyword",
        source: "url",
      });
    }

    try {
      const domain = new URL(cleanUrl).hostname;

      // IP address instead of domain
      if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
        signals.push({
          score: 20,
          reason: "URL uses an IP address instead of a domain",
          source: "url",
        });
      }

      // Missing normal domain structure
      if (!domain.includes(".")) {
        signals.push({
          score: 15,
          reason: "URL contains an unusual domain structure",
          source: "url",
        });
      }
    } catch {
      signals.push({
        score: 10,
        reason: "Malformed or suspicious URL",
        source: "url",
      });
    }
  });

  return signals;
}

module.exports = {
  extractUrls,
  analyzeUrls,
};
