import {
  ShieldIcon,
  DashboardIcon,
  InboxIcon,
  ActivityIcon,
  ScanIcon,
  SettingsIcon,
  LogoutIcon,
} from "../common/icons";

import NavButton from "./NavButton";

function Sidebar({
  currentPage,
  changePage,
  mails = [],
  user,
  handleLogout,
}) {
  return (
    <aside className="sidebar">

      {/* BRAND */}
      <div className="sidebar-brand">
        <div className="brand-mark">
          <ShieldIcon />
        </div>

        <div>
          <h1>CyberGuard</h1>
          <span>Mail Security</span>
        </div>
      </div>


      {/* SECURITY */}
      <div className="sidebar-label">
        SECURITY
      </div>

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


      {/* SYSTEM */}
      <div className="sidebar-label system-label">
        SYSTEM
      </div>

      <nav className="sidebar-nav">

        <NavButton
          active={currentPage === "settings"}
          icon={<SettingsIcon />}
          label="Settings"
          onClick={() => changePage("settings")}
        />

      </nav>


      {/* BOTTOM */}
      <div className="sidebar-bottom">

        {/* SYSTEM STATUS */}
        <div className="connection-card">
          <span className="online-dot"></span>

          <div>
            <strong>System Online</strong>
            <span>Protection active</span>
          </div>
        </div>


        {/* ACCOUNT */}
        {user && (
          <div className="sidebar-user">

            <div className="sidebar-user-heading">
              <span>ACCOUNT</span>

              <span className="account-protected">
                <i></i>
                Protected
              </span>
            </div>


            <div className="sidebar-user-info">

              <div className="sidebar-user-avatar">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || "User"}
                  />
                ) : (
                  <span>
                    {(user.name || user.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>


              <div className="sidebar-user-details">

                <strong>
                  {user.name || "Google User"}
                </strong>

                <span>
                  {user.email}
                </span>

              </div>

            </div>


            {/* LOGOUT */}
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              <LogoutIcon />

              <span>
                Sign out
              </span>

              <span className="logout-arrow">
                →
              </span>
            </button>

          </div>
        )}


        {/* VERSION */}
        <div className="sidebar-version">
          CyberGuard v1.0
        </div>

      </div>

    </aside>
  );
}

export default Sidebar;
