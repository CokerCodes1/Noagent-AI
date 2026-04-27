const { getPool } = require("../config/db");
const {
  getContactPersonLabel,
  getContactUnlockFeeKobo,
  getContactUnlockFeeNaira,
  getListingPurposeLabel,
  normalizeListingPurpose
} = require("../utils/propertyListing");

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

function buildWhatsAppLink(phone) {
  const normalizedPhone = normalizePhone(phone);
  return normalizedPhone ? `https://wa.me/${normalizedPhone}` : "";
}

function normalizePropertyStatus(status = "") {
  if (status === "sold") {
    return "sold";
  }

  return status === "rented" ? "rented" : "available";
}

function parseImages(images) {
  try {
    const parsed = JSON.parse(images || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function mapPropertyRow(row) {
  const listingPurpose = normalizeListingPurpose(row.listing_purpose);

  return {
    id: row.id,
    landlord_id: row.landlord_id,
    landlord_name: row.landlord_name,
    type: row.type,
    listing_purpose: listingPurpose,
    listing_purpose_label: getListingPurposeLabel(listingPurpose),
    description: row.description,
    location: row.location,
    price: Number(row.price),
    images: parseImages(row.images),
    video: row.video,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_unlocked: Boolean(row.is_unlocked),
    contact_fee_kobo: getContactUnlockFeeKobo(listingPurpose),
    contact_fee_naira: getContactUnlockFeeNaira(listingPurpose),
    contact_label: getContactPersonLabel(listingPurpose),
    phone: row.visible_phone || "",
    wa_link: row.visible_wa_link || ""
  };
}

exports.createProperty = async (req, res, next) => {
  try {
    const { type, listing_purpose: listingPurposeValue, description, location, price, phone } = req.body;
    const images = req.files?.images || [];
    const video = req.files?.video?.[0];

    if (!type || !description || !location || !price || !phone) {
      return res.status(400).json({ message: "Type, description, location, price, and phone are required." });
    }

    if (images.length === 0 || !video) {
      return res.status(400).json({ message: "Please upload up to 5 images and exactly 1 video." });
    }

    if (images.length > 5) {
      return res.status(400).json({ message: "You can upload a maximum of 5 images." });
    }

    const whatsappLink = buildWhatsAppLink(phone);
    const listingPurpose = normalizeListingPurpose(listingPurposeValue);
    const pool = getPool();
    const [result] = await pool.execute(
      `
        INSERT INTO properties
          (landlord_id, type, listing_purpose, description, location, price, phone, wa_link, images, video, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
      `,
      [
        req.user.id,
        type.trim(),
        listingPurpose,
        description.trim(),
        location.trim(),
        Number(price),
        normalizePhone(phone),
        whatsappLink,
        JSON.stringify(images.map((file) => file.filename)),
        video.filename
      ]
    );

    req.app.get("io").emit("new_property", {
      propertyId: result.insertId,
      message: "A new property is now available."
    });

    return res.status(201).json({
      message: "Property posted successfully.",
      propertyId: result.insertId
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProperties = async (req, res, next) => {
  try {
    const pool = getPool();
    const userId = req.user?.id || 0;
    const userRole = req.user?.role || "";

    const [rows] = await pool.execute(
      `
        SELECT
          p.*,
          u.name AS landlord_name,
          CASE
            WHEN ? = 'admin' OR p.landlord_id = ? OR unlocks.id IS NOT NULL THEN 1
            ELSE 0
          END AS is_unlocked,
          CASE
            WHEN ? = 'admin' OR p.landlord_id = ? OR unlocks.id IS NOT NULL THEN p.phone
            ELSE NULL
          END AS visible_phone,
          CASE
            WHEN ? = 'admin' OR p.landlord_id = ? OR unlocks.id IS NOT NULL THEN p.wa_link
            ELSE NULL
          END AS visible_wa_link
        FROM properties p
        LEFT JOIN users u
          ON u.id = p.landlord_id
        LEFT JOIN property_contact_unlocks unlocks
          ON unlocks.property_id = p.id
         AND unlocks.renter_id = ?
         AND unlocks.status = 'success'
        WHERE p.status = 'available'
        ORDER BY p.created_at DESC
      `,
      [userRole, userId, userRole, userId, userRole, userId, userId]
    );

    return res.json(rows.map(mapPropertyRow));
  } catch (error) {
    return next(error);
  }
};

exports.getMyProperties = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `
        SELECT
          p.*,
          u.name AS landlord_name,
          1 AS is_unlocked,
          p.phone AS visible_phone,
          p.wa_link AS visible_wa_link
        FROM properties p
        LEFT JOIN users u
          ON u.id = p.landlord_id
        WHERE p.landlord_id = ?
        ORDER BY p.created_at DESC
      `,
      [req.user.id]
    );

    return res.json(rows.map(mapPropertyRow));
  } catch (error) {
    return next(error);
  }
};

exports.markRented = async (req, res, next) => {
  try {
    const propertyId = Number(req.params.id);
    const pool = getPool();
    const [rows] = await pool.execute(
      "SELECT id, landlord_id, status, listing_purpose FROM properties WHERE id = ? LIMIT 1",
      [propertyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Property not found." });
    }

    const property = rows[0];
    const nextStatus = "rented";

    if (req.user.role !== "admin" && property.landlord_id !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own properties." });
    }

    if (normalizeListingPurpose(property.listing_purpose) === "sale") {
      return res.status(400).json({ message: "Sale listings cannot be marked as rented." });
    }

    if (property.status === nextStatus) {
      return res.json({ message: "Property is already marked as rented." });
    }

    await pool.execute("UPDATE properties SET status = ? WHERE id = ?", [nextStatus, propertyId]);

    req.app.get("io").emit("property_rented", {
      propertyId,
      message: "A property has been marked as rented."
    });

    return res.json({ message: "Property marked as rented." });
  } catch (error) {
    return next(error);
  }
};

exports.updatePropertyStatus = async (req, res, next) => {
  try {
    const propertyId = Number(req.params.id);
    const nextStatus = normalizePropertyStatus(req.body.status);
    const pool = getPool();
    const [rows] = await pool.execute(
      "SELECT id, landlord_id, status, listing_purpose, type, location, price FROM properties WHERE id = ? LIMIT 1",
      [propertyId]
    );

    if (!propertyId) {
      return res.status(400).json({ message: "A valid property id is required." });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Property not found." });
    }

    const property = rows[0];
    const listingPurpose = normalizeListingPurpose(property.listing_purpose);

    if (req.user.role !== "admin" && property.landlord_id !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own properties." });
    }

    if (nextStatus === "rented" && listingPurpose === "sale") {
      return res.status(400).json({ message: "Sale listings cannot be marked as rented." });
    }

    if (nextStatus === "sold" && listingPurpose !== "sale") {
      return res.status(400).json({ message: "Only sale listings can be marked as sold." });
    }

    if (property.status === nextStatus) {
      return res.json({ message: `Property is already marked as ${nextStatus}.` });
    }

    await pool.execute("UPDATE properties SET status = ? WHERE id = ?", [nextStatus, propertyId]);

    if (nextStatus === "sold") {
      await pool.execute(
        `
          INSERT INTO landlord_finance_records
            (landlord_id, record_type, description, amount, payment_date)
          VALUES (?, 'sale', ?, ?, CURDATE())
        `,
        [
          property.landlord_id,
          `${property.type} sale in ${property.location}`,
          Number(property.price)
        ]
      );
    }

    req.app.get("io").emit("property_rented", {
      propertyId,
      message:
        nextStatus === "sold"
          ? "A property has been marked as sold."
          : "A property has been marked as rented."
    });

    return res.json({ message: `Property marked as ${nextStatus}.` });
  } catch (error) {
    return next(error);
  }
};
