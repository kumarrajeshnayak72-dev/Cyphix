const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "SECURITY_ALERT",
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "HIGH",
    },

    quarantineId: {
      type: String,
      required: true,
    },

    emailSubject: {
      type: String,
      default: "",
    },

    sender: {
      type: String,
      default: "",
    },

    riskScore: {
      type: Number,
      default: 0,
    },

    reasons: {
      type: [String],
      default: [],
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
