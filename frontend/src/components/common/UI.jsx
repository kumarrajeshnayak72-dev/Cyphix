import {
  AlertIcon,
  LinkIcon,
  RestoreIcon,
  TrashIcon,
  ShieldIcon,
  RefreshIcon,
} from "./icons";

export function PageLayout({ eyebrow, title, description, action, children }) {
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

export function StatCard({
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

export function PanelHeader({ title, subtitle, action }) {
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

export function QuarantineCard({
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

export function Detail({ label, value }) {
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

export function MiniStat({ label, value }) {
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

export function SettingsCard({ icon, title, description, children }) {
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

export function SettingRow({ label, value, positive }) {
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

export function StatusRow({ label, value }) {
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

export function PolicyRow({ title, description, color }) {
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

export function RefreshButton({ loading, onClick }) {
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

export function ErrorBanner({ message, onClose }) {
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

export function LoadingState() {
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

export function EmptyState({
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
