import {
  PageLayout,
  RefreshButton,
  ErrorBanner,
  LoadingState,
  EmptyState,
  QuarantineCard,
} from "../common/UI";

export default function Quarantine({
  loading,
  mails,
  error,
  setError,
  fetchQuarantineHistory,
  getRiskClass,
  getRiskLabel,
  formatDate,
  openActionModal,
}) {
  return (
    <PageLayout
      eyebrow="SECURITY / QUARANTINE"
      title="Quarantine"
      description="Review emails detected as high-risk by CyberGuard."
      action={
        <RefreshButton
          loading={loading}
          onClick={fetchQuarantineHistory}
        />
      }
    >
      {error && (
        <ErrorBanner
          message={error}
          onClose={() => setError("")}
        />
      )}

      <div className="quarantine-toolbar">
        <div>
          <strong>
            {mails.length}{" "}
            {mails.length === 1 ? "email" : "emails"}
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
              onRestore={() =>
                openActionModal("restore", mail)
              }
              onDelete={() =>
                openActionModal("delete", mail)
              }
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
}
