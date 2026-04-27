export function normalizeListingPurpose(listingPurpose = "") {
  return listingPurpose === "sale" ? "sale" : "rent";
}

export function getListingPurposeLabel(listingPurpose = "") {
  return normalizeListingPurpose(listingPurpose) === "sale" ? "For Sale" : "For Rent";
}

export function getContactPersonLabel(listingPurpose = "") {
  return normalizeListingPurpose(listingPurpose) === "sale" ? "Owner" : "Landlord";
}

export function getContactFeeNaira(property = {}) {
  if (Number.isFinite(Number(property.contact_fee_naira)) && Number(property.contact_fee_naira) > 0) {
    return Number(property.contact_fee_naira);
  }

  return normalizeListingPurpose(property.listing_purpose) === "sale" ? 10000 : 1000;
}

export function formatNaira(amount = 0) {
  return `N${Number(amount || 0).toLocaleString()}`;
}
