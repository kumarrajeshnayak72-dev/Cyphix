export function getRiskClass(score) {
  const value = Number(score);

  if (value >= 90) return "risk-critical";
  if (value >= 70) return "risk-high";
  if (value >= 30) return "risk-medium";

  return "risk-low";
}

export function getRiskLabel(score) {
  const value = Number(score);

  if (value >= 90) return "Critical";
  if (value >= 70) return "High Risk";
  if (value >= 30) return "Suspicious";

  return "Low Risk";
}

export function formatDate(date) {
  if (!date) return "Unknown";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatRelativeTime(date) {
  if (!date) return "";

  const created = new Date(date);

  if (Number.isNaN(created.getTime())) {
    return "";
  }

  const seconds = Math.floor((Date.now() - created.getTime()) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return created.toLocaleDateString("en-IN");
}
