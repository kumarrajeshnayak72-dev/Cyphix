const { google } = require("googleapis");

const GmailAccount = require("../models/GmailAccount");

async function getGmailClient() {
  const account = await GmailAccount.findOne();

  if (!account) {
    throw new Error("No Gmail account connected");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  oauth2Client.setCredentials({
    refresh_token: account.refreshToken,
  });

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  return {
    gmail,
    account,
  };
}

async function getRecentEmails(maxResults = 10) {
  const { gmail } = await getGmailClient();

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: "in:anywhere",
  });

  const messages = response.data.messages || [];

  const emails = [];

  for (const message of messages) {
    const result = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full",
    });

    const payload = result.data.payload;

    const headers = payload.headers || [];

    const getHeader = (name) => {
      const header = headers.find(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      );

      return header ? header.value : "";
    };

    const body = extractBody(payload);

    emails.push({
      id: result.data.id,
      threadId: result.data.threadId,
      sender: getHeader("From"),
      recipient: getHeader("To"),
      subject: getHeader("Subject"),
      date: getHeader("Date"),
      body,
    });
  }

  return emails;
}

async function getOrCreateQuarantineLabel() {
  const { gmail } = await getGmailClient();

  const response = await gmail.users.labels.list({
    userId: "me",
  });

  const labels = response.data.labels || [];

  const existingLabel = labels.find(
    (label) => label.name === "CyberGuard/Quarantine",
  );

  if (existingLabel) {
    return existingLabel.id;
  }

  const createdLabel = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name: "CyberGuard/Quarantine",
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });

  return createdLabel.data.id;
}

async function restoreGmailMessage(messageId) {
  const { gmail } = await getGmailClient();

  const quarantineLabelId = await getOrCreateQuarantineLabel();

  // Remove the quarantine label
  // and put the message back into Inbox.
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: [quarantineLabelId],
      addLabelIds: ["INBOX"],
    },
  });

  return {
    success: true,
    messageId,
  };
}

async function checkGmailMessageLabels(messageId) {
  const { gmail } = await getGmailClient();

  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "minimal",
  });

  console.log("Thread ID:", response.data.threadId);

  const labelIds = response.data.labelIds || [];

  const labelResponse = await gmail.users.labels.list({
    userId: "me",
  });

  const labels = labelResponse.data.labels || [];

  const labelNames = labelIds.map((id) => {
    const label = labels.find((item) => item.id === id);

    return label ? `${label.name} (${label.id})` : `Unknown (${id})`;
  });

  console.log("");
  console.log("=================================");
  console.log("🔍 GMAIL LABEL DIAGNOSTIC");
  console.log("=================================");
  console.log("Message ID:", messageId);
  console.log("Label IDs:", labelIds);
  console.log("Label Names:", labelNames);
  console.log("=================================");
  console.log("");

  return {
    messageId,
    labelIds,
    labelNames,
  };
}

async function deleteGmailMessage(messageId) {
  const { gmail } = await getGmailClient();

  // Permanently delete the Gmail message.
  await gmail.users.messages.delete({
    userId: "me",
    id: messageId,
  });

  return {
    success: true,
    messageId,
  };
}

function extractBody(payload) {
  if (!payload) {
    return "";
  }

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf8");
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf8");
      }
    }

    for (const part of payload.parts) {
      const result = extractBody(part);

      if (result) {
        return result;
      }
    }
  }

  return "";
}

module.exports = {
  getGmailClient,
  getRecentEmails,
  getOrCreateQuarantineLabel,
  restoreGmailMessage,
  deleteGmailMessage,
  checkGmailMessageLabels,
};
