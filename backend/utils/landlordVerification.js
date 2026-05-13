const LANDLORD_SUPPORT_CONTACT =
  process.env.LANDLORD_SUPPORT_CONTACT || "08081232613";

const LANDLORD_VERIFICATION_STATUSES = ["pending", "approved", "rejected"];

function normalizeVerificationStatus(status = "") {
  return LANDLORD_VERIFICATION_STATUSES.includes(status) ? status : "pending";
}

function normalizeOptionalText(value = "", maxLength = 255) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizePhoneNumber(phone = "") {
  return String(phone || "").trim().replace(/[^\d+]/g, "");
}

function canAccessLandlordWorkspace(user = {}) {
  if (user.role !== "landlord") {
    return true;
  }

  return normalizeVerificationStatus(user.verification_status) === "approved";
}

function getLandlordVerificationMessage(user = {}) {
  const status = normalizeVerificationStatus(user.verification_status);

  if (status === "approved") {
    return "";
  }

  if (status === "rejected") {
    return `Your landlord account verification was not approved. Contact support on ${LANDLORD_SUPPORT_CONTACT} for assistance.`;
  }

  return "Your landlord account is currently under verification. Our team will contact you shortly.";
}

function isLandlordVerificationDocumentMime(mime = "") {
  return [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
  ].includes(String(mime || "").toLowerCase());
}

function isLandlordVerificationDocumentExtension(extension = "") {
  return [".jpg", ".jpeg", ".png", ".webp", ".pdf"].includes(
    String(extension || "").toLowerCase()
  );
}

module.exports = {
  LANDLORD_SUPPORT_CONTACT,
  normalizeOptionalText,
  normalizePhoneNumber,
  normalizeVerificationStatus,
  canAccessLandlordWorkspace,
  getLandlordVerificationMessage,
  isLandlordVerificationDocumentExtension,
  isLandlordVerificationDocumentMime
};
