const { scanAndQuarantineGmail } = require("./gmail.scanner");

let isScanning = false;

async function monitorGmail() {
  if (isScanning) {
    return;
  }

  isScanning = true;

  try {
    console.log("🔍 CyberGuard: Scanning Gmail...");

    const results = await scanAndQuarantineGmail();

    const quarantined = results.filter(
      (email) => email.action === "QUARANTINED",
    );

    console.log(`📧 Checked ${results.length} emails`);

    if (quarantined.length > 0) {
      console.log(`🚨 Quarantined ${quarantined.length} high-risk email(s)`);
    } else {
      console.log("✅ No high-risk emails detected");
    }
  } catch (error) {
    console.error("Gmail monitoring error:", error.message);
  } finally {
    isScanning = false;
  }
}

function startGmailMonitor() {
  console.log("🛡️ CyberGuard Gmail Monitor started");

  // First scan
  monitorGmail();

  // Check every 60 seconds
  setInterval(monitorGmail, 60 * 1000);
}

module.exports = {
  startGmailMonitor,
};
