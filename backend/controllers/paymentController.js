const axios = require("axios");
const { getPool } = require("../config/db");

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET || "";
const PAYSTACK_CONTACT_FEE_KOBO = Number(process.env.PAYSTACK_CONTACT_FEE_KOBO || 20000);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function ensurePaystackConfigured(res) {
  if (!PAYSTACK_SECRET) {
    res.status(503).json({ message: "Paystack is not configured on the server." });
    return false;
  }

  return true;
}

exports.initializePayment = async (req, res, next) => {
  try {
    if (!ensurePaystackConfigured(res)) {
      return;
    }

    const propertyId = Number(req.body.property_id);
    const pool = getPool();

    const [properties] = await pool.execute(
      "SELECT id, landlord_id, status FROM properties WHERE id = ? LIMIT 1",
      [propertyId]
    );

    if (properties.length === 0) {
      return res.status(404).json({ message: "Property not found." });
    }

    const property = properties[0];

    if (property.status !== "available") {
      return res.status(400).json({ message: "This property is no longer available." });
    }

    if (property.landlord_id === req.user.id) {
      return res.status(400).json({ message: "You do not need to pay to unlock your own listing." });
    }

    const [existingUnlocks] = await pool.execute(
      `
        SELECT id
        FROM property_contact_unlocks
        WHERE property_id = ? AND renter_id = ? AND status = 'success'
        LIMIT 1
      `,
      [propertyId, req.user.id]
    );

    if (existingUnlocks.length > 0) {
      return res.json({
        message: "Contact is already unlocked for this property.",
        alreadyUnlocked: true
      });
    }

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: req.user.email,
        amount: PAYSTACK_CONTACT_FEE_KOBO,
        callback_url: `${FRONTEND_URL}/payment-success`,
        metadata: {
          renter_id: req.user.id,
          property_id: propertyId
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json(response.data);
  } catch (error) {
    return next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    if (!ensurePaystackConfigured(res)) {
      return;
    }

    const reference = req.params.reference;
    const verificationResponse = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`
        }
      }
    );

    const transaction = verificationResponse.data?.data;

    if (!transaction || transaction.status !== "success") {
      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    const renterId = Number(transaction.metadata?.renter_id);
    const propertyId = Number(transaction.metadata?.property_id);

    if (!renterId || !propertyId) {
      return res.status(400).json({ success: false, message: "Payment metadata is incomplete." });
    }

    if (renterId !== req.user.id) {
      return res.status(403).json({ success: false, message: "This payment does not belong to the current user." });
    }

    const pool = getPool();
    const [properties] = await pool.execute(
      "SELECT id FROM properties WHERE id = ? LIMIT 1",
      [propertyId]
    );

    if (properties.length === 0) {
      return res.status(404).json({ success: false, message: "Property not found." });
    }

    await pool.execute(
      `
        INSERT INTO property_contact_unlocks
          (property_id, renter_id, reference, email, amount_paid, status, paid_at)
        VALUES (?, ?, ?, ?, ?, 'success', NOW())
        ON DUPLICATE KEY UPDATE
          reference = VALUES(reference),
          email = VALUES(email),
          amount_paid = VALUES(amount_paid),
          status = 'success',
          paid_at = COALESCE(property_contact_unlocks.paid_at, VALUES(paid_at))
      `,
      [
        propertyId,
        renterId,
        reference,
        transaction.customer?.email || req.user.email,
        Number(transaction.amount || PAYSTACK_CONTACT_FEE_KOBO)
      ]
    );

    return res.json({
      success: true,
      property_id: propertyId,
      amount_paid: Number(transaction.amount || PAYSTACK_CONTACT_FEE_KOBO)
    });
  } catch (error) {
    return next(error);
  }
};
