function normalizePhone(phone = "") {
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

function buildWhatsAppLink(phone = "") {
  const normalizedPhone = normalizePhone(phone);
  return normalizedPhone ? `https://wa.me/${normalizedPhone}` : "";
}

module.exports = {
  normalizePhone,
  buildWhatsAppLink
};
