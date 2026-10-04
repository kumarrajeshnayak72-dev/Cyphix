import { useEffect, useState } from "react";

import StatCard from "./StatCard";

import {
  getQuarantineStats,
} from "../../services/api";

import "./Dashboard.css";


function Dashboard() {

  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ===========================================
  // LOAD DASHBOARD STATISTICS
  // ===========================================

  const loadStats = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await getQuarantineStats();

      if (
        response &&
        response.statistics
      ) {

        setStats(
          response.statistics
        );

      }

    } catch (error) {

      console.error(
        "Dashboard statistics error:",
        error
      );

      setError(
        error.message ||
        "Failed to load dashboard statistics"
      );

    } finally {

      setLoading(false);

    }
  };


  // ===========================================
  // LOAD ON COMPONENT MOUNT
  // ===========================================

  useEffect(() => {

    loadStats();

  }, []);


  // ===========================================
  // LOADING
  // ===========================================

  if (loading) {

    return (
      <main className="dashboard">

        <div className="dashboard-header">

          <h1>
            CyberGuard
          </h1>

          <p>
            Security Monitoring Center
          </p>

        </div>

        <p>
          Loading security statistics...
        </p>

      </main>
    );

  }


  // ===========================================
  // DASHBOARD
  // ===========================================

  return (

    <main className="dashboard">

      {/* =======================================
          HEADER
          ======================================= */}

      <section className="dashboard-header">

        <h1>
          CyberGuard
        </h1>

        <p>
          Security Monitoring Center
        </p>

      </section>


      {/* =======================================
          ERROR
          ======================================= */}

      {error && (

        <div className="dashboard-error">

          {error}

        </div>

      )}


      {/* =======================================
          STATISTICS
          ======================================= */}

      <section className="stats-grid">

        <StatCard
          title="Total Threats"
          value={stats.total}
          icon="🛡️"
          description="Total quarantined threats"
        />


        <StatCard
          title="Critical"
          value={stats.critical}
          icon="🚨"
          description="High-risk malicious emails"
        />


        <StatCard
          title="High"
          value={stats.high}
          icon="⚠️"
          description="High-risk threats"
        />


        <StatCard
          title="Medium"
          value={stats.medium}
          icon="🔎"
          description="Medium-risk threats"
        />

      </section>


      {/* =======================================
          SYSTEM STATUS
          ======================================= */}

      <section className="dashboard-status">

        <div>

          <span className="status-dot">
            ●
          </span>

          CyberGuard monitoring is active

        </div>

        <button
          onClick={loadStats}
          className="refresh-button"
        >
          Refresh
        </button>

      </section>

    </main>

  );
}


export default Dashboard;
