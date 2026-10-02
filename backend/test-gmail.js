require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: true,
  debug: true,
});

async function test() {
  try {
    console.log("Checking Gmail SMTP...");

    await transporter.verify();

    console.log("✅ Gmail SMTP authentication successful");
  } catch (error) {
    console.log("❌ Gmail SMTP authentication failed");
    console.log("Code:", error.code);
    console.log("Response:", error.response);
    console.log("Command:", error.command);
  }
}

test();
