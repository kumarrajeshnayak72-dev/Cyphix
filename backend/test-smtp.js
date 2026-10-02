const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "localhost",
  port: 2525,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
});

const mail = {
  from: "user@gmail.com",
  to: "videocreative948@gmail.com",
  subject: "URGENT: Your Account Will Be Suspended",
  text: `
Dear Customer,

We detected unusual activity on your account and your KYC verification is incomplete.

Your account will be permanently suspended within 24 hours unless you verify your information immediately.

Verify your account here:
http://example.com/verify-account

Please do not ignore this message. Failure to complete verification may result in restricted access to your account.

Regards,
Account Security Team
`,
};

transporter
  .sendMail(mail)
  .then((info) => {
    console.log("Email sent to CyberGuard SMTP gateway");
    console.log(info.response);
  })
  .catch((error) => {
    console.error("SMTP test failed:");
    console.error(error);
  });
