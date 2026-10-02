const express = require("express");

const {
  getQuarantineHistory,
} = require("../controllers/quarantine.controller");

const {
  restoreGmailMessage,
  deleteGmailMessage,
} = require("../services/gmail.service");

const Quarantine = require("../models/Quarantine");

const router = express.Router();

// GET QUARANTINE HISTORY
router.get("/", getQuarantineHistory);

// RESTORE EMAIL
router.patch("/:id/restore", async (req, res) => {
  try {
    const quarantine = await Quarantine.findById(req.params.id);

    if (!quarantine) {
      return res.status(404).json({
        success: false,
        message: "Quarantined email not found",
      });
    }

    await restoreGmailMessage(quarantine.messageId);

    await Quarantine.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Email restored successfully",
    });
  } catch (error) {
    console.error("Failed to restore email:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to restore email",
    });
  }
});

// DELETE EMAIL
router.delete("/:id", async (req, res) => {
  try {
    const quarantine = await Quarantine.findById(req.params.id);

    if (!quarantine) {
      return res.status(404).json({
        success: false,
        message: "Quarantined email not found",
      });
    }

    await deleteGmailMessage(quarantine.messageId);

    await Quarantine.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Email deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete email:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete email",
    });
  }
});

module.exports = router;
