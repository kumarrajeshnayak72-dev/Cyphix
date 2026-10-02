const mongoose = require("mongoose");

const quarantineSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
    },

    quarantineId: {
      type: String,
      required: true,
      unique: true,
    },

    sender: {
      type: String,
      required: true,
    },

    recipient: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      default: "QUARANTINED",
    },

    reasons: {
      type: [String],
      default: [],
    },

    urls: {
      type: [String],
      default: [],
    },

    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Quarantine", quarantineSchema);
