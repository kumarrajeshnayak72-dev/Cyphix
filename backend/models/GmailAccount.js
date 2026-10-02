const mongoose = require("mongoose");

const gmailAccountSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    refreshToken: {
      type: String,
      required: true,
    },

    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("GmailAccount", gmailAccountSchema);
