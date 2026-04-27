export function normalizePhone(phone = "") {
  const digits = String(phone).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("234")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `234${digits.slice(1)}`;
  }

  return `234${digits}`;
}

export function buildWhatsAppLink(phone = "") {
  const normalizedPhone = normalizePhone(phone);
  return normalizedPhone ? `https://wa.me/${normalizedPhone}` : "";
}

export function buildWhatsAppMessageLink(phone = "", message = "") {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return "";
  }

  const encodedMessage = encodeURIComponent(String(message || "").trim());
  return encodedMessage
    ? `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
    : `https://wa.me/${normalizedPhone}`;
}
