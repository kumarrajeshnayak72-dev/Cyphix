import { PageLayout } from "../common/UI";

import {
  ScanIcon,
  MessageIcon,
  AlertIcon,
  ShieldIcon,
  CheckIcon,
  LinkIcon,
} from "../common/icons";

export default function MessageChecker({
  checkerType,
  setCheckerType,
  checkerInput,
  setCheckerInput,
  checkerResult,
  setCheckerResult,
  checkerLoading,
  checkerError,
  setCheckerError,
  runChecker,
  clearChecker,
  getRiskClass,
  getRiskLabel,
}) {
    const isSms = checkerType === "sms";
    const score = checkerResult?.score ?? 0;
    const riskClass = checkerResult ? getRiskClass(score) : "";
    const riskLabel = checkerResult ? getRiskLabel(score) : "";

    return (
      <PageLayout
        eyebrow="MANUAL ANALYSIS"
        title="Text & SMS Checker"
        description="Analyze suspicious messages and get an instant CyberGuard risk score."
      >
        <div className="checker-layout">
          <section className="checker-panel panel">
            <div className="checker-tabs">
              <button
                type="button"
                className={
                  checkerType === "text" ? "checker-tab active" : "checker-tab"
                }
                onClick={() => {
                  setCheckerType("text");
                  setCheckerResult(null);
                  setCheckerError("");
                }}
              >
                <ScanIcon />
                Text Check
              </button>

              <button
                type="button"
                className={
                  checkerType === "sms" ? "checker-tab active" : "checker-tab"
                }
                onClick={() => {
                  setCheckerType("sms");
                  setCheckerResult(null);
                  setCheckerError("");
                }}
              >
                <MessageIcon />
                SMS Check
              </button>
            </div>

            <div className="checker-form">
              <label htmlFor="checker-message">
                {isSms ? "SMS message" : "Text message"}
              </label>

              <textarea
                id="checker-message"
                value={checkerInput}
                onChange={(event) => setCheckerInput(event.target.value)}
                placeholder={
                  isSms
                    ? "Paste the suspicious SMS here..."
                    : "Paste an email message, chat message or any suspicious text here..."
                }
                rows={10}
              />

              <div className="checker-form-footer">
                <span>{checkerInput.length} characters</span>

                <div className="checker-actions">
                  <button
                    type="button"
                    className="checker-clear"
                    onClick={clearChecker}
                    disabled={checkerLoading}
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    className="checker-submit"
                    onClick={runChecker}
                    disabled={checkerLoading}
                  >
                    {checkerLoading ? (
                      <>
                        <span className="button-spinner checker-spinner"></span>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ScanIcon />
                        Check Risk
                      </>
                    )}
                  </button>
                </div>
              </div>

              {checkerError && (
                <div className="checker-error">
                  <AlertIcon />
                  <span>{checkerError}</span>
                </div>
              )}
            </div>
          </section>

          <section className="checker-result panel">
            <div className="panel-header">
              <div>
                <h3>Risk Analysis</h3>
                <p>CyberGuard rule-based detection result</p>
              </div>
            </div>

            {!checkerResult ? (
              <div className="checker-empty">
                <div className="checker-empty-icon">
                  <ShieldIcon />
                </div>
                <strong>Ready to analyze</strong>
                <span>
                  Paste a message and click <b>Check Risk</b> to see its score,
                  severity and detection reasons.
                </span>
              </div>
            ) : (
              <div className="checker-result-body">
                <div className={`checker-score ${riskClass}`}>
                  <div>
                    <span>RISK SCORE</span>
                    <strong>{score}/100</strong>
                  </div>
                  <div className="checker-severity">
                    <small>SEVERITY</small>
                    <b>{riskLabel}</b>
                  </div>
                </div>

                <div className="checker-progress">
                  <span
                    style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
                  ></span>
                </div>

                <div className="checker-section">
                  <div className="checker-section-title">
                    <AlertIcon />
                    Detection Reasons
                  </div>

                  {checkerResult.reasons.length ? (
                    <div className="checker-reasons">
                      {checkerResult.reasons.map((reason, index) => (
                        <div
                          key={`${reason}-${index}`}
                          className="checker-reason"
                        >
                          <CheckIcon />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="checker-no-reasons">
                      No suspicious indicators detected.
                    </div>
                  )}
                </div>

                {checkerResult.urls.length > 0 && (
                  <div className="checker-section">
                    <div className="checker-section-title">
                      <LinkIcon />
                      URLs Found
                    </div>
                    <div className="checker-urls">
                      {checkerResult.urls.map((url, index) => (
                        <div key={`${url}-${index}`}>{String(url)}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </PageLayout>
    );
  };