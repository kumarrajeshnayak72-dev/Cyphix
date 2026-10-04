const express = require("express");

const {
  getQuarantineHistory,
  getQuarantineStats,
} = require("../controllers/quarantine.controller");

const {
  restoreGmailMessage,
  deleteGmailMessage,
} = require("../services/gmail.service");

const Quarantine = require("../models/Quarantine");
const RestoredMessage = require("../models/RestoredMessage");

const router = express.Router();

// =============================================
// GET DASHBOARD STATISTICS
// =============================================

router.get("/stats", getQuarantineStats);

// =============================================
// GET QUARANTINE HISTORY
// =============================================

router.get("/", getQuarantineHistory);

// =============================================
// RESTORE EMAIL
// =============================================

router.patch("/:id/restore", async (req, res) => {
  try {
    const quarantine = await Quarantine.findById(req.params.id);

    if (!quarantine) {
      return res.status(404).json({
        success: false,
        message: "Quarantined email not found",
      });
    }

    // =======================================
    // RESTORE GMAIL EMAIL
    // =======================================

    if (!quarantine.messageId.startsWith("smtp-")) {
      await restoreGmailMessage(quarantine.messageId);
    } else {
      console.log(
        `ℹ️ SMTP quarantine record restored: ${quarantine.messageId}`,
      );
    }

    // =======================================
    // SAVE RESTORED MESSAGE
    // =======================================

    await RestoredMessage.findOneAndUpdate(
      {
        messageId: quarantine.messageId,
      },

      {
        messageId: quarantine.messageId,

        restoredAt: new Date(),
      },

      {
        upsert: true,
        new: true,
      },
    );

    console.log(`↩️ Message marked as restored: ${quarantine.messageId}`);

    // =======================================
    // REMOVE QUARANTINE RECORD
    // =======================================

    await Quarantine.findByIdAndDelete(req.params.id);

    // =======================================
    // RESPONSE
    // =======================================

    res.json({
      success: true,

      message: "Email restored successfully",
    });
  } catch (error) {
    console.error("Failed to restore email:");

    console.error("Gmail error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,

      message: "Failed to restore email",
    });
  }
});

// =============================================
// DELETE EMAIL
// =============================================

router.delete("/:id", async (req, res) => {
  try {
    const quarantine = await Quarantine.findById(req.params.id);

    if (!quarantine) {
      return res.status(404).json({
        success: false,

        message: "Quarantined email not found",
      });
    }

    // =======================================
    // DELETE FROM GMAIL
    // =======================================

    if (!quarantine.messageId.startsWith("smtp-")) {
      await deleteGmailMessage(quarantine.messageId);
    } else {
      console.log(`ℹ️ SMTP quarantine record deleted: ${quarantine.messageId}`);
    }

    // =======================================
    // REMOVE QUARANTINE RECORD
    // =======================================

    await Quarantine.findByIdAndDelete(req.params.id);

    // =======================================
    // REMOVE RESTORED MESSAGE MARKER
    // =======================================

    await RestoredMessage.findOneAndDelete({
      messageId: quarantine.messageId,
    });

    // =======================================
    // RESPONSE
    // =======================================

    res.json({
      success: true,

      message: "Email deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete email:");

    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,

      message: "Failed to delete email",
    });
  }
});

// =============================================
// EXPORT ROUTER
// =============================================

module.exports = router;
