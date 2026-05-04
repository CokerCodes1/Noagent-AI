import { BACKEND_URL } from "../api/axios.js";

export function resolveMediaUrl(mediaPath = "") {
  const trimmedPath = String(mediaPath || "").trim();

  if (!trimmedPath) {
    return "";
  }

  if (
    /^(https?:)?\/\//i.test(trimmedPath) ||
    trimmedPath.startsWith("data:") ||
    trimmedPath.startsWith("blob:")
  ) {
    return trimmedPath;
  }

  if (trimmedPath.startsWith("/")) {
    return `${BACKEND_URL}${trimmedPath}`;
  }

  return `${BACKEND_URL}/uploads/${trimmedPath}`;
}

export function getInitials(name = "") {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) {
    return "NA";
  }

  return words.map((word) => word[0]?.toUpperCase() || "").join("");
}
