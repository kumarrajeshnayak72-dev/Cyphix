import { useEffect, useMemo, useState } from "react";

import {
  getCurrentUser,
  logoutUser,
  getQuarantineHistory,
  restoreEmail,
  deleteEmail,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  checkText,
  checkSms,
} from "../services/api";

export function useCyberGuard() {
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
        const data = await getCurrentUser();

        if (!data.authenticated) {
          setUser(null);
          return;
        }

        setUser(data.user);
        return;

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

      const data = await getQuarantineHistory();

      if (!data.success) {
        throw new Error(data.message || "Unable to load quarantine history");
      }

      setMails(data.mails || data.data || []);
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
      const data = await getNotifications();

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
      const data = await getUnreadNotificationCount();

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
      await markNotificationRead(id);

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

      if (type === "restore") {
        await restoreEmail(mail._id);
      } else {
        await deleteEmail(mail._id);
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

      const data =
        checkerType === "sms"
          ? await checkSms(message)
          : await checkText(message);

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
      const data = await logoutUser();

      if (!data.success) {
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
  return {
    currentPage,
    setCurrentPage,
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
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    runChecker,
    clearChecker,
    handleLogout,
  };
}
