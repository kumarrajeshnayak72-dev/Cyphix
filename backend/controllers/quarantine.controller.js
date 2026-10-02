const { getQuarantinedMails } = require("../services/quarantine");

const getQuarantineHistory = async (req, res) => {
  try {
    const mails = await getQuarantinedMails();

    res.json({
      success: true,
      count: mails.length,
      mails,
    });
  } catch (error) {
    console.error("Failed to fetch quarantine history:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch quarantine history",
    });
  }
};

module.exports = {
  getQuarantineHistory,
};
