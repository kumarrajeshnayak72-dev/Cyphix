const express = require("express");

const {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
} = require("../services/notification");

const router = express.Router();

// Get all notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await getNotifications();

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
});

// Get unread notification count
router.get("/unread", async (req, res) => {
  try {
    const count = await getUnreadCount();

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Failed to fetch unread count:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
    });
  }
});

// Mark notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const notification = await markNotificationAsRead(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
});

module.exports = router;
