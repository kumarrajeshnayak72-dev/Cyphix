import { useEffect, useMemo, useState } from "react";
import "./index.css";
import Login from "./components/Login";

const API_BASE = "http://localhost:5000/api";
const QUARANTINE_API = `${API_BASE}/quarantine`;
const NOTIFICATION_API = `${API_BASE}/notifications`;

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const [mails, setMails] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notificationOpen, setNotificationOpen] = useState(false);

  const [actionModal, setActionModal] = useState({
    open: false,
    type: null,
    mail: null,
  });

  const [actionLoading, setActionLoading] = useState(false);

  const [checkerType, setCheckerType] = useState("text");
  const [checkerInput, setCheckerInput] = useState("");
  const [checkerResult, setCheckerResult] = useState(null);
  const [checkerLoading, setCheckerLoading] = useState(false);
  const [checkerError, setCheckerError] = useState("");

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  const [authLoading, setAuthLoading] = useState(true);

  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);

        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  // =====================================================
  // FETCH QUARANTINE
  // =====================================================

  const fetchQuarantineHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(QUARANTINE_API);

      if (!response.ok) {
        throw new Error("Failed to fetch quarantine history");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Unable to load quarantine history");
      }

      setMails(data.mails || []);
    } catch (err) {
      console.error("Quarantine error:", err);

      setError("Unable to connect to the CyberGuard server.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  const fetchNotifications = async () => {
    try {
      const response = await fetch(NOTIFICATION_API);

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Notification error:", err.message);
    }
  };

  // =====================================================
  // FETCH UNREAD COUNT
  // =====================================================

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${NOTIFICATION_API}/unread`);

      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }

      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error("Unread notification error:", err.message);
    }
  };

  // =====================================================
  // MARK NOTIFICATION READ
  // =====================================================

  const markNotificationAsRead = async (id) => {
    try {
      const response = await fetch(`${NOTIFICATION_API}/${id}/read`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === id
            ? {
                ...item,
                read: true,
              }
            : item,
        ),
      );

      setUnreadCount((previous) => (previous > 0 ? previous - 1 : 0));
    } catch (err) {
      console.error("Read notification error:", err.message);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchQuarantineHistory();
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchQuarantineHistory();
      fetchNotifications();
      fetchUnreadCount();
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    const total = mails.length;

    const highRisk = mails.filter(
      (mail) => Number(mail.riskScore) >= 70,
    ).length;

    const suspicious = mails.filter(
      (mail) => Number(mail.riskScore) >= 30 && Number(mail.riskScore) < 70,
    ).length;

    const averageRisk =
      total > 0
        ? Math.round(
            mails.reduce((sum, mail) => sum + Number(mail.riskScore || 0), 0) /
              total,
          )
        : 0;

    return {
      total,
      highRisk,
      suspicious,
      averageRisk,
    };
  }, [mails]);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const changePage = (page) => {
    setCurrentPage(page);
    setNotificationOpen(false);
  };

  // =====================================================
  // OPEN RESTORE / DELETE MODAL
  // =====================================================

  const openActionModal = (type, mail) => {
    setActionModal({
      open: true,
      type,
      mail,
    });
  };

  const closeActionModal = () => {
    if (actionLoading) return;

    setActionModal({
      open: false,
      type: null,
      mail: null,
    });
  };

  // =====================================================
  // RESTORE / DELETE
  // =====================================================

  const executeMailAction = async () => {
    const { type, mail } = actionModal;

    if (!mail || !type) return;

    try {
      setActionLoading(true);

      const endpoint =
        type === "restore"
          ? `${QUARANTINE_API}/${mail._id}/restore`
          : `${QUARANTINE_API}/${mail._id}`;

      const response = await fetch(endpoint, {
        method: type === "restore" ? "PATCH" : "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${type} email`);
      }

      setMails((previous) => previous.filter((item) => item._id !== mail._id));

      setActionModal({
        open: false,
        type: null,
        mail: null,
      });

      await fetchNotifications();
      await fetchUnreadCount();
    } catch (err) {
      console.error(`${type} error:`, err);

      setError(err.message || `Failed to ${type} email`);
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getRiskClass = (score) => {
    const value = Number(score);

    if (value >= 90) return "risk-critical";

    if (value >= 70) return "risk-high";

    if (value >= 30) return "risk-medium";

    return "risk-low";
  };

  const getRiskLabel = (score) => {
    const value = Number(score);

    if (value >= 90) return "Critical";

    if (value >= 70) return "High Risk";

    if (value >= 30) return "Suspicious";

    return "Low Risk";
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Unknown";
    }

    return parsed.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatRelativeTime = (date) => {
    if (!date) return "";

    const created = new Date(date);

    if (Number.isNaN(created.getTime())) {
      return "";
    }

    const seconds = Math.floor((Date.now() - created.getTime()) / 1000);

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);

    if (days < 7) return `${days}d ago`;

    return created.toLocaleDateString("en-IN");
  };

  // =====================================================
  // TEXT / SMS CHECKER
  // =====================================================

  const runChecker = async () => {
    const message = checkerInput.trim();

    if (!message) {
      setCheckerError(
        `Enter ${checkerType === "sms" ? "an SMS" : "some text"} to analyze.`,
      );
      setCheckerResult(null);
      return;
    }

    try {
      setCheckerLoading(true);
      setCheckerError("");
      setCheckerResult(null);

      const endpoint =
        checkerType === "sms"
          ? `${API_BASE}/sms/check`
          : `${API_BASE}/verify/text`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message,
          message,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Unable to analyze the message.",
        );
      }

      const result = data.analysis || data.result || data.data || data;

      const score = Number(
        result.riskScore ?? result.score ?? data.riskScore ?? data.score ?? 0,
      );

      setCheckerResult({
        score,
        status:
          result.status ||
          data.status ||
          (score >= 70 ? "malicious" : score >= 30 ? "suspicious" : "safe"),
        reasons: result.reasons || data.reasons || [],
        urls: result.urls || data.urls || [],
      });
    } catch (err) {
      console.error(`${checkerType} checker error:`, err);
      setCheckerError(
        err.message || "Unable to connect to the CyberGuard server.",
      );
    } finally {
      setCheckerLoading(false);
    }
  };

  const clearChecker = () => {
    setCheckerInput("");
    setCheckerResult(null);
    setCheckerError("");
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Logout failed");
      }

      setUser(null);
      setMails([]);
      setNotifications([]);
      setUnreadCount(0);
      setNotificationOpen(false);
      setCurrentPage("dashboard");
    } catch (error) {
      console.error("Logout error:", error);
      setError(error.message || "Unable to logout from CyberGuard.");
    }
  };

  // =====================================================
  // SIDEBAR
  // =====================================================

  const Sidebar = () => (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <ShieldIcon />
        </div>

        <div>
          <h1>CyberGuard</h1>
          <span>Mail Security</span>
        </div>
      </div>

      <div className="sidebar-label">SECURITY</div>

      <nav className="sidebar-nav">
        <NavButton
          active={currentPage === "dashboard"}
          icon={<DashboardIcon />}
          label="Dashboard"
          onClick={() => changePage("dashboard")}
        />

        <NavButton
          active={currentPage === "quarantine"}
          icon={<InboxIcon />}
          label="Quarantine"
          count={mails.length}
          onClick={() => changePage("quarantine")}
        />

        <NavButton
          active={currentPage === "logs"}
          icon={<ActivityIcon />}
          label="Detection Logs"
          onClick={() => changePage("logs")}
        />

        <NavButton
          active={currentPage === "checker"}
          icon={<ScanIcon />}
          label="Text / SMS Check"
          onClick={() => changePage("checker")}
        />
      </nav>

      <div className="sidebar-label system-label">SYSTEM</div>

      <nav className="sidebar-nav">
        <NavButton
          active={currentPage === "settings"}
          icon={<SettingsIcon />}
          label="Settings"
          onClick={() => changePage("settings")}
        />
      </nav>

      <div className="sidebar-bottom">
        <div className="connection-card">
          <span className="online-dot"></span>

          <div>
            <strong>System Online</strong>

            <span>Protection active</span>
          </div>
        </div>

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-heading">
              <span>ACCOUNT</span>
              <span className="account-protected">
                <i></i> Protected
              </span>
            </div>

            <div className="sidebar-user-info">
              <div className="sidebar-user-avatar">
                {user.picture ? (
                  <img src={user.picture} alt={user.name || "User"} />
                ) : (
                  <span>
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="sidebar-user-details">
                <strong>{user.name || "Google User"}</strong>
                <span>{user.email}</span>
              </div>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              <LogoutIcon />
              <span>Sign out</span>
              <span className="logout-arrow">→</span>
            </button>
          </div>
        )}

        <div className="sidebar-version">CyberGuard v1.0</div>
      </div>
    </aside>
  );

  // =====================================================
  // DASHBOARD
  // =====================================================

  const Dashboard = () => (
    <PageLayout
      eyebrow="SECURITY CENTER"
      title="Security Dashboard"
      description="Real-time overview of your email security activity."
      action={
        <RefreshButton loading={loading} onClick={fetchQuarantineHistory} />
      }
    >
      {error && <ErrorBanner message={error} onClose={() => setError("")} />}

      <div className="stats-grid">
        <StatCard
          icon={<InboxIcon />}
          label="Quarantined"
          value={statistics.total}
          description="Total blocked emails"
        />

        <StatCard
          icon={<AlertIcon />}
          label="High Risk"
          value={statistics.highRisk}
          description="70%+ risk score"
          danger
        />

        <StatCard
          icon={<WarningIcon />}
          label="Suspicious"
          value={statistics.suspicious}
          description="30–69% risk score"
          warning
        />

        <StatCard
          icon={<ChartIcon />}
          label="Average Risk"
          value={`${statistics.averageRisk}%`}
          description="Average detection score"
          success
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel recent-panel">
          <PanelHeader
            title="Recent Threats"
            subtitle="Latest emails placed in quarantine"
            action={
              <button
                className="link-button"
                onClick={() => changePage("quarantine")}
              >
                View all
                <ArrowIcon />
              </button>
            }
          />

          {loading && mails.length === 0 ? (
            <LoadingState />
          ) : mails.length === 0 ? (
            <EmptyState
              compact
              title="No threats detected"
              description="Your quarantine is currently clear."
            />
          ) : (
            <div className="recent-threats">
              {mails.slice(0, 6).map((mail) => (
                <div className="threat-row" key={mail._id}>
                  <div
                    className={`threat-icon ${getRiskClass(mail.riskScore)}`}
                  >
                    <MailIcon />
                  </div>

                  <div className="threat-info">
                    <strong>{mail.subject || "No Subject"}</strong>

                    <span>{mail.sender || "Unknown sender"}</span>
                  </div>

                  <div className={`risk-pill ${getRiskClass(mail.riskScore)}`}>
                    {mail.riskScore}%
                  </div>

                  <span className="threat-time">
                    {formatRelativeTime(mail.receivedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel security-panel">
          <PanelHeader
            title="Protection Status"
            subtitle="Current security configuration"
          />

          <div className="protection-content">
            <div className="protection-hero">
              <div className="protection-icon">
                <ShieldIcon />
              </div>

              <div>
                <strong>Protection Active</strong>

                <span>CyberGuard is monitoring your Gmail account.</span>
              </div>
            </div>

            <div className="protection-list">
              <StatusRow label="Gmail Monitor" value="Active" />

              <StatusRow label="Detection Engine" value="Active" />

              <StatusRow label="MongoDB" value="Connected" />

              <StatusRow label="Blocking Threshold" value="70%" />
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );

  // =====================================================
  // QUARANTINE
  // =====================================================

  const Quarantine = () => (
    <PageLayout
      eyebrow="SECURITY / QUARANTINE"
      title="Quarantine"
      description="Review emails detected as high-risk by CyberGuard."
      action={
        <RefreshButton loading={loading} onClick={fetchQuarantineHistory} />
      }
    >
      {error && <ErrorBanner message={error} onClose={() => setError("")} />}

      <div className="quarantine-toolbar">
        <div>
          <strong>
            {mails.length} {mails.length === 1 ? "email" : "emails"}
          </strong>

          <span>currently in quarantine</span>
        </div>

        <div className="toolbar-status">
          <span className="online-dot"></span>
          Monitoring active
        </div>
      </div>

      {loading && mails.length === 0 ? (
        <div className="panel">
          <LoadingState />
        </div>
      ) : mails.length === 0 ? (
        <div className="panel">
          <EmptyState
            title="Quarantine is empty"
            description="No suspicious emails are currently being held."
          />
        </div>
      ) : (
        <div className="quarantine-list">
          {mails.map((mail) => (
            <QuarantineCard
              key={mail._id}
              mail={mail}
              riskClass={getRiskClass(mail.riskScore)}
              riskLabel={getRiskLabel(mail.riskScore)}
              formatDate={formatDate}
              onRestore={() => openActionModal("restore", mail)}
              onDelete={() => openActionModal("delete", mail)}
            />
          ))}
        </div>
      )}
    </PageLayout>
  );

  // =====================================================
  // LOGS
  // =====================================================

  const DetectionLogs = () => (
    <PageLayout
      eyebrow="SECURITY / LOGS"
      title="Detection Logs"
      description="Historical detection events generated by CyberGuard."
      action={
        <RefreshButton loading={loading} onClick={fetchQuarantineHistory} />
      }
    >
      <div className="log-stats">
        <MiniStat label="Total Events" value={statistics.total} />

        <MiniStat label="High Risk" value={statistics.highRisk} />

        <MiniStat label="Suspicious" value={statistics.suspicious} />

        <MiniStat label="Avg. Risk" value={`${statistics.averageRisk}%`} />
      </div>

      <section className="panel logs-panel">
        <PanelHeader
          title="Detection Activity"
          subtitle="Latest recorded security events"
        />

        {mails.length === 0 ? (
          <EmptyState
            compact
            title="No detection events"
            description="Detection activity will appear here."
          />
        ) : (
          <div className="table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>SENDER</th>
                  <th>SUBJECT</th>
                  <th>RISK</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {mails.map((mail) => (
                  <tr key={mail._id}>
                    <td>{formatDate(mail.receivedAt)}</td>

                    <td>
                      <div className="table-sender">
                        <span className="sender-avatar">
                          {(mail.sender || "?").charAt(0).toUpperCase()}
                        </span>

                        <span>{mail.sender || "Unknown"}</span>
                      </div>
                    </td>

                    <td>
                      <span className="table-subject">
                        {mail.subject || "No Subject"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`risk-pill ${getRiskClass(mail.riskScore)}`}
                      >
                        {mail.riskScore}%
                      </span>
                    </td>

                    <td>
                      <span className="blocked-status">
                        <span></span>
                        Quarantined
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageLayout>
  );

  // =====================================================
  // SETTINGS
  // =====================================================

  const Settings = () => (
    <PageLayout
      eyebrow="SYSTEM / SETTINGS"
      title="System Settings"
      description="View CyberGuard services and detection configuration."
    >
      <div className="settings-grid">
        <SettingsCard
          icon={<MailIcon />}
          title="Gmail Monitor"
          description="Email monitoring service"
        >
          <SettingRow label="Status" value="Active" positive />

          <SettingRow label="Scan interval" value="60 seconds" />

          <SettingRow label="Account" value="Connected" />
        </SettingsCard>

        <SettingsCard
          icon={<DatabaseIcon />}
          title="Database"
          description="Quarantine data storage"
        >
          <SettingRow label="Status" value="Connected" positive />

          <SettingRow label="Stored emails" value={mails.length} />

          <SettingRow label="Storage" value="MongoDB" />
        </SettingsCard>

        <SettingsCard
          icon={<ShieldIcon />}
          title="Detection Engine"
          description="Threat analysis configuration"
        >
          <SettingRow label="Status" value="Active" positive />

          <SettingRow label="Malicious threshold" value="70%" />

          <SettingRow label="Analysis" value="Pattern + URL" />
        </SettingsCard>
      </div>

      <section className="panel configuration-panel">
        <PanelHeader
          title="Detection Policy"
          subtitle="Current rules used by the CyberGuard engine"
        />

        <div className="policy-list">
          <PolicyRow
            title="Malicious"
            description="Emails scoring 70% or higher are quarantined."
            color="red"
          />

          <PolicyRow
            title="Suspicious"
            description="Emails scoring between 30% and 69% are classified as suspicious."
            color="yellow"
          />

          <PolicyRow
            title="Safe"
            description="Emails scoring below 30% are classified as safe."
            color="green"
          />
        </div>
      </section>
    </PageLayout>
  );

  // =====================================================
  // TEXT / SMS CHECKER PAGE
  // =====================================================

  const MessageChecker = () => {
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

  // =====================================================
  // PAGE SWITCH
  // =====================================================

  const renderPage = () => {
    switch (currentPage) {
      case "quarantine":
        return <Quarantine />;

      case "logs":
        return <DetectionLogs />;

      case "checker":
        return <MessageChecker />;

      case "settings":
        return <Settings />;

      default:
        return <Dashboard />;
    }
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          color: "#172033",
          fontSize: "16px",
          fontWeight: 600,
        }}
      >
        Checking authentication...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <header className="main-header">
          <div className="header-spacer"></div>

          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            open={notificationOpen}
            setOpen={setNotificationOpen}
            markAsRead={markNotificationAsRead}
            goToQuarantine={() => changePage("quarantine")}
            getRiskClass={getRiskClass}
            formatRelativeTime={formatRelativeTime}
          />
        </header>

        {renderPage()}

        <footer className="app-footer">
          <span>© {new Date().getFullYear()} CyberGuard</span>

          <span>Intelligent Email Security</span>
        </footer>
      </main>

      {actionModal.open && (
        <ConfirmationModal
          type={actionModal.type}
          mail={actionModal.mail}
          loading={actionLoading}
          onCancel={closeActionModal}
          onConfirm={executeMailAction}
        />
      )}
    </div>
  );
}

// =====================================================
// PAGE LAYOUT
// =====================================================

function PageLayout({ eyebrow, title, description, action, children }) {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">{eyebrow}</div>

          <h2>{title}</h2>

          <p>{description}</p>
        </div>

        {action && <div className="page-action">{action}</div>}
      </div>

      {children}
    </div>
  );
}

// =====================================================
// NAV BUTTON
// =====================================================

function NavButton({ active, icon, label, count, onClick }) {
  return (
    <button
      className={`nav-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>

      <span className="nav-label">{label}</span>

      {count > 0 && <span className="nav-count">{count}</span>}
    </button>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon,
  label,
  value,
  description,
  danger,
  warning,
  success,
}) {
  let modifier = "";

  if (danger) modifier = "danger";

  if (warning) modifier = "warning";

  if (success) modifier = "success";

  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>

        <div className={`stat-card-icon ${modifier}`}>{icon}</div>
      </div>

      <strong>{value}</strong>

      <small>{description}</small>
    </div>
  );
}

// =====================================================
// PANEL HEADER
// =====================================================

function PanelHeader({ title, subtitle, action }) {
  return (
    <div className="panel-header">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>

      {action}
    </div>
  );
}

// =====================================================
// QUARANTINE CARD
// =====================================================

function QuarantineCard({
  mail,
  riskClass,
  riskLabel,
  formatDate,
  onRestore,
  onDelete,
}) {
  return (
    <article className="quarantine-card">
      <div className="quarantine-card-top">
        <div className="quarantine-title-area">
          <div className="quarantine-status">
            <span></span>
            QUARANTINED
          </div>

          <h3>{mail.subject || "No Subject"}</h3>

          <p>Detected {formatDate(mail.receivedAt)}</p>
        </div>

        <div className={`risk-display ${riskClass}`}>
          <span>{riskLabel}</span>

          <strong>{mail.riskScore}%</strong>
        </div>
      </div>

      <div className="mail-details">
        <Detail label="FROM" value={mail.sender || "Unknown"} />

        <Detail label="TO" value={mail.recipient || "Unknown"} />

        <Detail label="QUARANTINE ID" value={mail.quarantineId || "Unknown"} />
      </div>

      <div className="mail-body-section">
        <div className="content-label">EMAIL CONTENT</div>

        <div className="mail-body">
          {mail.body || "No email content available."}
        </div>
      </div>

      {mail.reasons?.length > 0 && (
        <div className="analysis-section">
          <div className="content-label">WHY CYBERGUARD FLAGGED IT</div>

          <div className="reason-grid">
            {mail.reasons.map((reason, index) => (
              <div className="analysis-reason" key={index}>
                <span>
                  <AlertIcon />
                </span>

                <p>{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {mail.urls?.length > 0 && (
        <div className="analysis-section">
          <div className="content-label">DETECTED LINKS</div>

          <div className="url-grid">
            {mail.urls.map((url, index) => (
              <div className="detected-url" key={index}>
                <LinkIcon />

                <span>{url}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="quarantine-actions">
        <div className="quarantine-action-note">
          This message is currently blocked from your inbox.
        </div>

        <div className="action-buttons">
          <button className="restore-button" onClick={onRestore}>
            <RestoreIcon />
            Restore
          </button>

          <button className="delete-button" onClick={onDelete}>
            <TrashIcon />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

// =====================================================
// DETAIL
// =====================================================

function Detail({ label, value }) {
  return (
    <div className="detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

// =====================================================
// MINI STAT
// =====================================================

function MiniStat({ label, value }) {
  return (
    <div className="mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

// =====================================================
// SETTINGS CARD
// =====================================================

function SettingsCard({ icon, title, description, children }) {
  return (
    <section className="settings-card">
      <div className="settings-card-title">
        <div className="settings-card-icon">{icon}</div>

        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      <div className="settings-card-body">{children}</div>
    </section>
  );
}

// =====================================================
// SETTING ROW
// =====================================================

function SettingRow({ label, value, positive }) {
  return (
    <div className="setting-row">
      <span>{label}</span>

      <strong className={positive ? "positive" : ""}>
        {positive && <span className="tiny-dot"></span>}

        {value}
      </strong>
    </div>
  );
}

// =====================================================
// STATUS ROW
// =====================================================

function StatusRow({ label, value }) {
  return (
    <div className="status-row">
      <span>{label}</span>

      <strong>
        <span className="tiny-dot"></span>
        {value}
      </strong>
    </div>
  );
}

// =====================================================
// POLICY ROW
// =====================================================

function PolicyRow({ title, description, color }) {
  return (
    <div className="policy-row">
      <span className={`policy-dot ${color}`}></span>

      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

// =====================================================
// REFRESH BUTTON
// =====================================================

function RefreshButton({ loading, onClick }) {
  return (
    <button className="refresh-button" onClick={onClick} disabled={loading}>
      <RefreshIcon spinning={loading} />

      {loading ? "Refreshing" : "Refresh"}
    </button>
  );
}

// =====================================================
// ERROR
// =====================================================

function ErrorBanner({ message, onClose }) {
  return (
    <div className="error-banner">
      <div className="error-icon">
        <AlertIcon />
      </div>

      <div>
        <strong>Connection problem</strong>

        <span>{message}</span>
      </div>

      <button onClick={onClose} className="error-close">
        ×
      </button>
    </div>
  );
}

// =====================================================
// LOADING
// =====================================================

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loader"></div>

      <strong>Loading security data</strong>

      <span>Connecting to CyberGuard...</span>
    </div>
  );
}

// =====================================================
// EMPTY
// =====================================================

function EmptyState({
  title = "No emails in quarantine",
  description = "CyberGuard has not quarantined any emails.",
  compact = false,
}) {
  return (
    <div className={`empty-state ${compact ? "compact" : ""}`}>
      <div className="empty-shield">
        <ShieldIcon />
      </div>

      <strong>{title}</strong>

      <span>{description}</span>
    </div>
  );
}

// =====================================================
// NOTIFICATION CENTER
// =====================================================

function NotificationCenter({
  notifications,
  unreadCount,
  open,
  setOpen,
  markAsRead,
  goToQuarantine,
  getRiskClass,
  formatRelativeTime,
}) {
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    setOpen(false);
    goToQuarantine();
  };

  return (
    <div className="notification-center">
      <button
        className={`notification-button ${open ? "active" : ""}`}
        onClick={() => setOpen((previous) => !previous)}
      >
        <BellIcon />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="notification-backdrop"
            onClick={() => setOpen(false)}
          ></div>

          <div className="notification-dropdown">
            <div className="notification-header">
              <div>
                <h3>Notifications</h3>

                <span>
                  {unreadCount > 0
                    ? `${unreadCount} unread alert${
                        unreadCount === 1 ? "" : "s"
                      }`
                    : "You're all caught up"}
                </span>
              </div>

              <div className="notification-header-icon">
                <ShieldIcon />
              </div>
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <div>
                    <CheckIcon />
                  </div>

                  <strong>No security alerts</strong>

                  <span>New threat detections will appear here.</span>
                </div>
              ) : (
                notifications.slice(0, 8).map((notification) => (
                  <button
                    className={`notification-item ${
                      notification.read ? "" : "unread"
                    }`}
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-item-icon">
                      <AlertIcon />
                    </div>

                    <div className="notification-item-content">
                      <div className="notification-item-top">
                        <strong>
                          {notification.title || "Security Alert"}
                        </strong>

                        <span>
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>

                      <p>
                        {notification.message ||
                          "A suspicious email was quarantined."}
                      </p>

                      {notification.sender && (
                        <small>{notification.sender}</small>
                      )}

                      {notification.riskScore !== undefined && (
                        <div className="notification-meta">
                          <span
                            className={`risk-pill ${getRiskClass(
                              notification.riskScore,
                            )}`}
                          >
                            {notification.riskScore}%
                          </span>

                          {!notification.read && (
                            <span className="unread-label">New</span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <button
                className="notification-footer"
                onClick={() => {
                  setOpen(false);
                  goToQuarantine();
                }}
              >
                Open quarantine
                <ArrowIcon />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// =====================================================
// CONFIRMATION MODAL
// =====================================================

function ConfirmationModal({ type, mail, loading, onCancel, onConfirm }) {
  const isRestore = type === "restore";

  return (
    <div className="modal-overlay">
      <div className="confirmation-modal">
        <div className={`modal-icon ${isRestore ? "restore" : "delete"}`}>
          {isRestore ? <RestoreIcon /> : <TrashIcon />}
        </div>

        <div className="modal-content">
          <h3>{isRestore ? "Restore this email?" : "Delete this email?"}</h3>

          <p>
            {isRestore
              ? "This email will be moved back to your Gmail inbox."
              : "This will permanently delete the email from Gmail. This action cannot be undone."}
          </p>

          {mail && (
            <div className="modal-email">
              <strong>{mail.subject || "No Subject"}</strong>

              <span>{mail.sender || "Unknown sender"}</span>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="modal-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className={
              isRestore
                ? "modal-confirm restore-confirm"
                : "modal-confirm delete-confirm"
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Processing...
              </>
            ) : isRestore ? (
              <>
                <RestoreIcon />
                Restore email
              </>
            ) : (
              <>
                <TrashIcon />
                Delete permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// ICONS
// =====================================================

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" />
      <path d="m14 8 4 4-4 4" />
      <path d="M9 12h9" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3 20 6v5c0 5.2-3.4 8.7-8 10-4.6-1.3-8-4.8-8-10V6l8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 5h16v14H4z" />
      <path d="M4 14h4l2 2h4l2-2h4" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 8V5a1 1 0 0 1 1-1h3" />
      <path d="M16 4h3a1 1 0 0 1 1 1v3" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
      <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.2 8.2 0 0 1-3.4-.7L4 20l1.6-3.8A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />
      <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 6.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.1 1.4Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3 22 20H2L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function WarningIcon() {
  return <AlertIcon />;
}

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="m7 15 4-4 3 2 5-6" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      className={spinning ? "spin-icon" : ""}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
      <path d="M3 4v6h6" />
      <path d="M4 13a8 8 0 0 0 14.8 4L21 14" />
      <path d="M21 20v-6h-6" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h9a7 7 0 0 1 7 7v1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="m6 7 1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2" />
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 7 20l1.2-1.2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default App;
