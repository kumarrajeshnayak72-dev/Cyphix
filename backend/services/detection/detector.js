const phishingRules = require("./rules/phishing.rules");
const scamRules = require("./rules/scam.rules");
const urgencyRules = require("./rules/urgency.rules");
const credentialRules = require("./rules/credential.rules");

const {
  extractUrls,
  analyzeUrls,
} = require("./url/url.detector");

const {
  calculateRiskScore,
  getSeverity,
  getStatus,
  getRecommendedAction,
} = require("./scoring/risk.scorer");

const {
  analyzeTextWithNLP,
} = require("./nlp/nlp.detector");

const {
  classifyText,
} = require("./nlp/text.classifier");

const {
  calculateMLRisk,
} = require("./nlp/ml.scorer");


// =============================================
// ALL RULE-BASED DETECTORS
// =============================================

const allRules = [
  ...phishingRules,
  ...scamRules,
  ...urgencyRules,
  ...credentialRules,
];


// =============================================
// TRUSTED SENDER CONTEXT
// =============================================
//
// These are NOT automatic whitelists.
//
// They only provide contextual evidence that
// can reduce false positives for legitimate
// security/account emails.
// =============================================

const trustedDomains = [
  "facebook.com",
  "facebookmail.com",
  "leetcode.com",
  "google.com",
  "github.com",
  "microsoft.com",
  "amazon.com",
];


// =============================================
// CHECK TRUSTED SENDER
// =============================================

function isTrustedSender(sender = "") {

  const normalizedSender =
    sender
      .toLowerCase()
      .trim();


  const match =
    normalizedSender.match(
      /@([a-z0-9.-]+)(?:>|$|\s)/i
    );


  if (!match) {
    return false;
  }


  const domain =
    match[1];


  return trustedDomains.some(
    (trustedDomain) =>
      domain === trustedDomain ||
      domain.endsWith(
        `.${trustedDomain}`
      )
  );
}


// =============================================
// MAIN CYBERGUARD DETECTOR
// =============================================

async function detectText(
  text = "",
  context = {}
) {

  // =============================================
  // VALIDATE INPUT
  // =============================================

  if (
    typeof text !== "string" ||
    !text.trim()
  ) {

    return {

      status: "safe",

      severity: "low",

      score: 0,

      reasons: [],

      urls: [],

      action: "allow",

      ml: {
        label: "UNKNOWN",
        confidence: 0,
      },
    };
  }


  const signals = [];


  const sender =
    context.sender || "";


  const subject =
    context.subject || "";


  const trustedSender =
    isTrustedSender(sender);


  // =============================================
  // 1. RULE-BASED DETECTION
  // =============================================

  allRules.forEach((rule) => {

    if (rule.pattern.test(text)) {

      signals.push({

        score:
          Number(rule.score || 0),

        reason:
          rule.reason,

        source:
          "rule",
      });
    }
  });


  // =============================================
  // 2. URL DETECTION
  // =============================================

  const urls =
    extractUrls(text);


  if (urls.length > 0) {

    const urlSignals =
      analyzeUrls(urls);


    signals.push(

      ...urlSignals.map(
        (signal) => ({

          ...signal,

          source:
            signal.source || "url",
        })
      )

    );
  }


  // =============================================
  // 3. COMBINATION DETECTION
  // =============================================

  const hasAccountThreat =
    /\b(account|profile|wallet)\b/i.test(text) &&
    /\b(blocked|suspended|disabled|locked)\b/i.test(text);


  const hasVerification =
    /\b(verify|verification|kyc|confirm)\b/i.test(text);


  if (
    hasAccountThreat &&
    hasVerification
  ) {

    signals.push({

      score: 15,

      reason:
        "Account threat combined with verification request",

      source:
        "combination",
    });
  }


  // =============================================
  // 4. NLP ANALYSIS
  // =============================================

  const nlpResult =
    analyzeTextWithNLP(text);


  if (
    nlpResult &&
    Array.isArray(nlpResult.signals)
  ) {

    signals.push(

      ...nlpResult.signals.map(
        (signal) => ({

          ...signal,

          source:
            signal.source || "nlp",
        })
      )

    );
  }


  // =============================================
  // 5. ML PHISHING CLASSIFICATION
  // =============================================

  const mlResult =
    await classifyText(text);


  const mlRisk =
    calculateMLRisk(mlResult);


  if (
    mlRisk.score > 0
  ) {

    signals.push({

      score:
        mlRisk.score,

      reason:
        mlRisk.reason,

      source:
        "ml",
    });
  }


  // =============================================
  // 6. TRUSTED SENDER CONTEXT
  // =============================================
  //
  // IMPORTANT:
  // Trusted sender does NOT make an email
  // automatically safe.
  //
  // It only reduces the risk caused by
  // generic account/security language.
  // =============================================

  const securityLanguage =
    /\b(password|account|verification|verify|security|login|sign[- ]?in|authentication|participation)\b/i.test(
      text,
    );

  if (
    trustedSender &&
    securityLanguage
  ) {

    signals.push({

      score: -20,

      reason:
        "Trusted sender domain with legitimate security/account context",

      source:
        "sender",
    });
  }


  // =============================================
  // 7. CALCULATE FINAL RISK
  // =============================================

  const score =
    calculateRiskScore(signals);


  // =============================================
  // 8. REMOVE DUPLICATE REASONS
  // =============================================

  const reasons =
    [
      ...new Set(
        signals
          .filter(
            (signal) =>
              Number(signal.score || 0) !== 0
          )
          .map(
            (signal) =>
              signal.reason
          )
          .filter(Boolean)
      ),
    ];


  // =============================================
  // 9. CLASSIFICATION
  // =============================================

  const status =
    getStatus(score);


  const severity =
    getSeverity(score);


  const action =
    getRecommendedAction(score);


  // =============================================
  // 10. FINAL RESULT
  // =============================================

  return {

    status,

    severity,

    score,

    reasons,

    urls,

    action,

    senderContext: {

      sender,

      subject,

      trusted:
        trustedSender,
    },

    ml: {

      label:
        mlResult.label,

      confidence:
        mlResult.confidence,
    },
  };
}


module.exports = detectText;