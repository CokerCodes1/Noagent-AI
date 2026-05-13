async function dispatchVerificationNotification(eventType, payload = {}) {
  const safePayload = {
    ...payload,
    password: undefined
  };

  console.info(`[landlord-verification:${eventType}]`, safePayload);

  return {
    delivered: false,
    eventType
  };
}

async function notifyAdminOfLandlordApplication(payload) {
  return dispatchVerificationNotification("admin-alert", payload);
}

async function notifyLandlordApproved(payload) {
  return dispatchVerificationNotification("landlord-approved", payload);
}

async function notifyLandlordRejected(payload) {
  return dispatchVerificationNotification("landlord-rejected", payload);
}

async function notifyLandlordVerificationReminder(payload) {
  return dispatchVerificationNotification("landlord-reminder", payload);
}

module.exports = {
  notifyAdminOfLandlordApplication,
  notifyLandlordApproved,
  notifyLandlordRejected,
  notifyLandlordVerificationReminder
};
