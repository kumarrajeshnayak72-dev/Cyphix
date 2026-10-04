const Quarantine = require("../models/Quarantine");

// =============================================
// GET QUARANTINE HISTORY
// =============================================

const getQuarantineHistory = async (req, res) => {
  try {
    const quarantines = await Quarantine.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: quarantines,
    });
  } catch (error) {
    console.error("Failed to get quarantine history:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to get quarantine history",
    });
  }
};

// =============================================
// GET DASHBOARD STATISTICS
// =============================================

const getQuarantineStats = async (req, res) => {
  try {
    // -----------------------------------------
    // TOTAL QUARANTINED EMAILS
    // -----------------------------------------

    const total = await Quarantine.countDocuments();

    // -----------------------------------------
    // CRITICAL THREATS
    // Risk Score >= 70
    // -----------------------------------------

    const critical = await Quarantine.countDocuments({
      riskScore: {
        $gte: 70,
      },
    });

    // -----------------------------------------
    // HIGH THREATS
    // Risk Score 50 - 69
    // -----------------------------------------

    const high = await Quarantine.countDocuments({
      riskScore: {
        $gte: 50,
        $lt: 70,
      },
    });

    // -----------------------------------------
    // MEDIUM THREATS
    // Risk Score 30 - 49
    // -----------------------------------------

    const medium = await Quarantine.countDocuments({
      riskScore: {
        $gte: 30,
        $lt: 50,
      },
    });

    // -----------------------------------------
    // RECENT THREATS
    // -----------------------------------------

    const recentThreats = await Quarantine.find()
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .select(
        "sender recipient subject riskScore status reasons urls receivedAt createdAt",
      );

    // -----------------------------------------
    // SEND RESPONSE
    // -----------------------------------------

    res.json({
      success: true,

      statistics: {
        total,

        critical,

        high,

        medium,
      },

      recentThreats,
    });
  } catch (error) {
    console.error("Failed to get dashboard statistics:", error.message);

    res.status(500).json({
      success: false,

      message: "Failed to get dashboard statistics",
    });
  }
};

// =============================================
// EXPORT
// =============================================

module.exports = {
  getQuarantineHistory,

  getQuarantineStats,
};
