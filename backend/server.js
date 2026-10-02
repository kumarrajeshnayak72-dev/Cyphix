const express = require("express");
const cors = require("cors");
const session = require("express-session");

require("dotenv").config();

const connectDB = require("./config/db");

const { startGmailMonitor } = require("./services/gmail.monitor");

const textRoutes = require("./routes/text.routes");

const mailRoutes = require("./routes/mail.routes");

const quarantineRoutes = require("./routes/quarantine.routes");

const authRoutes = require("./routes/auth.routes");

const gmailRoutes = require("./routes/gmail.routes");

const notificationRoutes = require("./routes/notification.routes");

const smsRoutes = require("./routes/sms.routes");

const app = express();

// =====================================
// CONNECT DATABASE
// =====================================

connectDB();

// =====================================
// SMTP GATEWAY
// =====================================

require("./services/mail.server");

// =====================================
// MIDDLEWARE
// =====================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",

    credentials: true,
  }),
);

app.use(express.json());

// =====================================
// SESSION
// =====================================

app.use(
  session({
    secret: process.env.SESSION_SECRET || "cyberguard-development-secret",

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      secure: false,

      sameSite: "lax",

      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// =====================================
// TEST ROUTE
// =====================================

app.get("/", (req, res) => {
  res.json({
    message: "CyberGuard API is running",
  });
});

// =====================================
// API ROUTES
// =====================================

app.use("/api/auth", authRoutes);

app.use("/api/verify", textRoutes);

app.use("/api/verify", mailRoutes);

app.use("/api/quarantine", quarantineRoutes);

app.use("/api/gmail", gmailRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/sms", smsRoutes);

// =====================================
// SERVER
// =====================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("");

  console.log("=================================");

  console.log("🛡️ CYBERGUARD API");

  console.log("=================================");

  console.log(`Server running on port ${PORT}`);

  console.log("MongoDB: Connecting...");

  console.log("SMTP Gateway: Starting...");

  console.log("Authentication: Google OAuth");

  console.log("=================================");

  console.log("");

  startGmailMonitor();
});
