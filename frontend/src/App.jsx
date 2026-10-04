import "./index.css";

import Login from "./components/Login";

import Sidebar from "./components/layout/Sidebar";
import NotificationCenter from "./components/layout/NotificationCenter";
import ConfirmationModal from "./components/modals/ConfirmationModal";

import Dashboard from "./components/dashboard/Dashboard";
import Quarantine from "./components/quarantine/Quarantine";
import DetectionLogs from "./components/logs/DetectionLogs";
import MessageChecker from "./components/checker/MessageChecker";
import Settings from "./components/settings/Settings";

import { useCyberGuard } from "./hooks/useCyberGuard";
import {
  getRiskClass,
  getRiskLabel,
  formatDate,
  formatRelativeTime,
} from "./utils/risk";

function App() {
  const cyberGuard = useCyberGuard();

  const {
    currentPage,
    mails,
    notifications,
    unreadCount,
    loading,
    error,
    setError,
    notificationOpen,
    setNotificationOpen,
    actionModal,
    actionLoading,
    checkerType,
    setCheckerType,
    checkerInput,
    setCheckerInput,
    checkerResult,
    setCheckerResult,
    checkerLoading,
    checkerError,
    setCheckerError,
    authLoading,
    user,
    statistics,
    changePage,
    openActionModal,
    closeActionModal,
    executeMailAction,
    fetchQuarantineHistory,
    markNotificationAsRead,
    runChecker,
    clearChecker,
    handleLogout,
  } = cyberGuard;

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

  const renderPage = () => {
    switch (currentPage) {
      case "quarantine":
        return (
          <Quarantine
            loading={loading}
            mails={mails}
            error={error}
            setError={setError}
            fetchQuarantineHistory={fetchQuarantineHistory}
            getRiskClass={getRiskClass}
            getRiskLabel={getRiskLabel}
            formatDate={formatDate}
            openActionModal={openActionModal}
          />
        );

      case "logs":
        return (
          <DetectionLogs
            loading={loading}
            mails={mails}
            statistics={statistics}
            fetchQuarantineHistory={fetchQuarantineHistory}
            getRiskClass={getRiskClass}
            formatDate={formatDate}
          />
        );

      case "checker":
        return (
          <MessageChecker
            checkerType={checkerType}
            setCheckerType={setCheckerType}
            checkerInput={checkerInput}
            setCheckerInput={setCheckerInput}
            checkerResult={checkerResult}
            setCheckerResult={setCheckerResult}
            checkerLoading={checkerLoading}
            checkerError={checkerError}
            setCheckerError={setCheckerError}
            runChecker={runChecker}
            clearChecker={clearChecker}
            getRiskClass={getRiskClass}
            getRiskLabel={getRiskLabel}
          />
        );

      case "settings":
        return <Settings mails={mails} />;

      default:
        return (
          <Dashboard
            loading={loading}
            mails={mails}
            statistics={statistics}
            error={error}
            setError={setError}
            fetchQuarantineHistory={fetchQuarantineHistory}
            changePage={changePage}
            getRiskClass={getRiskClass}
            formatRelativeTime={formatRelativeTime}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={currentPage}
        mails={mails}
        user={user}
        changePage={changePage}
        handleLogout={handleLogout}
      />

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

export default App;
