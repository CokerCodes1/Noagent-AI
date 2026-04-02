const { getPool } = require("../config/db");

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

function parseImages(images) {
  try {
    const parsed = JSON.parse(images || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function mapPropertyRow(row) {
  return {
    id: row.id,
    landlord_id: row.landlord_id,
    landlord_name: row.landlord_name,
    type: row.type,
    description: row.description,
    location: row.location,
    price: Number(row.price),
    images: parseImages(row.images),
    video: row.video,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_unlocked: Boolean(row.is_unlocked),
    phone: row.visible_phone || "",
    wa_link: row.visible_wa_link || ""
  };
}

exports.createProperty = async (req, res, next) => {
  try {
    const { type, description, location, price, phone } = req.body;
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
    const pool = getPool();
    const [result] = await pool.execute(
      `
        INSERT INTO properties
          (landlord_id, type, description, location, price, phone, wa_link, images, video, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
      `,
      [
        req.user.id,
        type.trim(),
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
      "SELECT id, landlord_id, status FROM properties WHERE id = ? LIMIT 1",
      [propertyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Property not found." });
    }

    const property = rows[0];

    if (req.user.role !== "admin" && property.landlord_id !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own properties." });
    }

    if (property.status === "rented") {
      return res.json({ message: "Property is already marked as rented." });
    }

    await pool.execute("UPDATE properties SET status = 'rented' WHERE id = ?", [propertyId]);

    req.app.get("io").emit("property_rented", {
      propertyId,
      message: "A property has been marked as rented."
    });

    return res.json({ message: "Property marked as rented." });
  } catch (error) {
    return next(error);
  }
};
