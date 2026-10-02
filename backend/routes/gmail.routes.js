const express = require("express");

const { getRecentEmails } = require("../services/gmail.service");

const { scanGmail } = require("../services/gmail.scanner");

const { scanAndQuarantineGmail } = require("../services/gmail.scanner");

const router = express.Router();

// Read recent Gmail messages
router.get("/emails", async (req, res) => {
  try {
    const emails = await getRecentEmails(10);

    res.json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error("Failed to fetch Gmail:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch Gmail emails",
    });
  }
});

router.post("/scan-and-quarantine", async (req, res) => {
  try {
    const results = await scanAndQuarantineGmail();

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Gmail quarantine scan failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Gmail quarantine scan failed",
    });
  }
});
router.get("/status", async (req, res) => {
  try {
    const GmailAccount = require("../models/GmailAccount");

    const account = await GmailAccount.findOne();

    if (!account) {
      return res.json({
        connected: false,
      });
    }

    res.json({
      connected: true,
      email: account.email,
      connectedAt: account.connectedAt,
    });
  } catch (error) {
    console.error("Gmail status error:", error.message);

    res.status(500).json({
      connected: false,
      message: "Failed to check Gmail status",
    });
  }
});
// Scan recent Gmail messages
router.get("/scan", async (req, res) => {
  try {
    const results = await scanGmail();

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Gmail scan failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Gmail scan failed",
    });
  }
});

module.exports = router;
