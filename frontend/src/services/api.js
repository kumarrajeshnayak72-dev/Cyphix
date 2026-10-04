const API_BASE = "http://localhost:5000/api";

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export async function getCurrentUser() {
  return apiRequest("/auth/me", {
    credentials: "include",
  });
}

export async function logoutUser() {
  return apiRequest("/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export async function getQuarantineHistory() {
  return apiRequest("/quarantine");
}

export async function restoreEmail(id) {
  return apiRequest(`/quarantine/${id}/restore`, {
    method: "PATCH",
  });
}

export async function deleteEmail(id) {
  return apiRequest(`/quarantine/${id}`, {
    method: "DELETE",
  });
}

export async function getNotifications() {
  return apiRequest("/notifications");
}

export async function getUnreadNotificationCount() {
  return apiRequest("/notifications/unread");
}

export async function markNotificationRead(id) {
  return apiRequest(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function checkText(text) {
  return apiRequest("/verify/text", {
    method: "POST",
    body: JSON.stringify({
      text,
      message: text,
    }),
  });
}

export async function checkSms(text) {
  return apiRequest("/sms/check", {
    method: "POST",
    body: JSON.stringify({
      text,
      message: text,
    }),
  });
}

export { API_BASE };

export async function getQuarantineStats() {
  return apiRequest("/quarantine/stats");
}
