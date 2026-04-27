const RENT_CONTACT_FEE_KOBO = Number(
  process.env.PAYSTACK_RENT_CONTACT_FEE_KOBO || 100000
);
const SALE_CONTACT_FEE_KOBO = Number(
  process.env.PAYSTACK_SALE_CONTACT_FEE_KOBO || 1000000
);

function normalizeListingPurpose(listingPurpose = "") {
  return listingPurpose === "sale" ? "sale" : "rent";
}

function getListingPurposeLabel(listingPurpose = "") {
  return normalizeListingPurpose(listingPurpose) === "sale" ? "For Sale" : "For Rent";
}

function getContactPersonLabel(listingPurpose = "") {
  return normalizeListingPurpose(listingPurpose) === "sale" ? "Owner" : "Landlord";
}

function getContactUnlockFeeKobo(listingPurpose = "") {
  return normalizeListingPurpose(listingPurpose) === "sale"
    ? SALE_CONTACT_FEE_KOBO
    : RENT_CONTACT_FEE_KOBO;
}

function getContactUnlockFeeNaira(listingPurpose = "") {
  return getContactUnlockFeeKobo(listingPurpose) / 100;
}

module.exports = {
  RENT_CONTACT_FEE_KOBO,
  SALE_CONTACT_FEE_KOBO,
  normalizeListingPurpose,
  getListingPurposeLabel,
  getContactPersonLabel,
  getContactUnlockFeeKobo,
  getContactUnlockFeeNaira
};
