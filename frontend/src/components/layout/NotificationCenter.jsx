import {
  BellIcon,
  ShieldIcon,
  CheckIcon,
  AlertIcon,
  ArrowIcon,
} from "../common/icons";

export default function NotificationCenter({
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
