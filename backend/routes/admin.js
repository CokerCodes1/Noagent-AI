const bcrypt = require("bcryptjs");
const router = require("express").Router();
const { getPool } = require("../config/db");
const { authorizeRoles, verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  notifyLandlordApproved,
  notifyLandlordRejected
} = require("../utils/landlordVerificationNotifications");
const { ensureTechnicianRecords } = require("../utils/technicianProfile");
const {
  normalizeOptionalText,
  normalizeVerificationStatus
} = require("../utils/landlordVerification");
const {
  getContactPersonLabel,
  getContactUnlockFeeKobo,
  getContactUnlockFeeNaira,
  getListingPurposeLabel,
  normalizeListingPurpose
} = require("../utils/propertyListing");

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "cokarproperties001@gmail.com").toLowerCase();

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizeName(name = "") {
  return String(name).trim();
}

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

function normalizeRole(role = "") {
  if (role === "admin") {
    return "admin";
  }

  if (role === "landlord") {
    return "landlord";
  }

  if (role === "renter") {
    return "renter";
  }

  if (role === "technician") {
    return "technician";
  }

  return "";
}

function normalizePropertyStatus(status = "") {
  if (status === "sold") {
    return "sold";
  }

  return status === "rented" ? "rented" : "available";
}

function normalizeTestimonialRole(role = "") {
  if (role === "landlord") {
    return "landlord";
  }

  if (role === "technician") {
    return "technician";
  }

  return "renter";
}

function normalizeRating(rating) {
  const parsedRating = Number(rating);

  if (!Number.isFinite(parsedRating)) {
    return 5;
  }

  return Math.min(5, Math.max(1, Math.round(parsedRating)));
}

function buildUploadPath(filename = "") {
  return filename ? `/uploads/${filename}` : "";
}

function parseImages(images) {
  try {
    const parsed = JSON.parse(images || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function mapManagedUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    whatsappNumber: row.whatsapp_number || "",
    propertyAddress: row.property_address || "",
    verificationDocument: row.verification_document || "",
    verificationStatus: row.verification_status || "approved",
    verificationSubmittedAt: row.verification_submitted_at || null,
    verifiedAt: row.verified_at || null,
    verifiedBy: row.verified_by || null,
    verificationNotes: row.verification_notes || "",
    role: row.role,
    is_protected: normalizeEmail(row.email) === ADMIN_EMAIL,
    created_at: row.created_at,
    properties_count: Number(row.properties_count || 0),
    unlocks_count: Number(row.unlocks_count || 0)
  };
}

function mapLandlordVerification(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    whatsappNumber: row.whatsapp_number || "",
    propertyAddress: row.property_address || "",
    verificationDocument: row.verification_document || "",
    verificationStatus: row.verification_status || "pending",
    verificationSubmittedAt: row.verification_submitted_at || null,
    verifiedAt: row.verified_at || null,
    verifiedBy: row.verified_by || null,
    verificationNotes: row.verification_notes || "",
    createdAt: row.created_at
  };
}

function isReservedAdminEmail(email = "") {
  return normalizeEmail(email) === ADMIN_EMAIL;
}

function mapManagedProperty(row) {
  const listingPurpose = normalizeListingPurpose(row.listing_purpose);

  return {
    id: row.id,
    landlord_id: row.landlord_id,
    landlord_name: row.landlord_name || "",
    landlord_email: row.landlord_email || "",
    type: row.type,
    listing_purpose: listingPurpose,
    listing_purpose_label: getListingPurposeLabel(listingPurpose),
    description: row.description,
    location: row.location,
    price: Number(row.price),
    phone: row.phone || "",
    wa_link: row.wa_link || "",
    images: parseImages(row.images),
    video: row.video || "",
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    unlocks_count: Number(row.unlocks_count || 0),
    contact_fee_kobo: getContactUnlockFeeKobo(listingPurpose),
    contact_fee_naira: getContactUnlockFeeNaira(listingPurpose),
    contact_label: getContactPersonLabel(listingPurpose)
  };
}

function mapRevenueRow(row) {
  return {
    id: row.id,
    reference: row.reference,
    email: row.email,
    amount_paid: Number(row.amount_paid || 0),
    status: row.status,
    paid_at: row.paid_at,
    property_id: row.property_id,
    property_type: row.property_type || "",
    property_location: row.property_location || "",
    renter_id: row.renter_id,
    renter_name: row.renter_name || "",
    renter_email: row.renter_email || "",
    landlord_id: row.landlord_id,
    landlord_name: row.landlord_name || "",
    landlord_email: row.landlord_email || ""
  };
}

function mapTestimonial(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    videoUrl: row.video_url,
    avatarUrl: row.avatar_url,
    rating: Number(row.rating || 5),
    textContent: row.text_content,
    createdAt: row.created_at
  };
}

async function fetchManagedUserById(pool, userId) {
  const [[user]] = await pool.execute(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.whatsapp_number,
        u.property_address,
        u.verification_document,
        u.verification_status,
        u.verification_submitted_at,
        u.verified_at,
        u.verified_by,
        u.verification_notes,
        u.role,
        u.created_at,
        COALESCE(property_stats.properties_count, 0) AS properties_count,
        COALESCE(unlock_stats.unlocks_count, 0) AS unlocks_count
      FROM users u
      LEFT JOIN (
        SELECT landlord_id, COUNT(*) AS properties_count
        FROM properties
        GROUP BY landlord_id
      ) AS property_stats
        ON property_stats.landlord_id = u.id
      LEFT JOIN (
        SELECT renter_id, COUNT(*) AS unlocks_count
        FROM property_contact_unlocks
        WHERE status = 'success'
        GROUP BY renter_id
      ) AS unlock_stats
        ON unlock_stats.renter_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId]
  );

  return user ? mapManagedUser(user) : null;
}

async function fetchManagedPropertyById(pool, propertyId) {
  const [[property]] = await pool.execute(
    `
      SELECT
        p.*,
        u.name AS landlord_name,
        u.email AS landlord_email,
        COALESCE(unlock_stats.unlocks_count, 0) AS unlocks_count
      FROM properties p
      LEFT JOIN users u
        ON u.id = p.landlord_id
      LEFT JOIN (
        SELECT property_id, COUNT(*) AS unlocks_count
        FROM property_contact_unlocks
        WHERE status = 'success'
        GROUP BY property_id
      ) AS unlock_stats
        ON unlock_stats.property_id = p.id
      WHERE p.id = ?
      LIMIT 1
    `,
    [propertyId]
  );

  return property ? mapManagedProperty(property) : null;
}

async function ensureAssignableLandlord(pool, landlordId) {
  const [[landlord]] = await pool.execute(
    "SELECT id, role, name, email, verification_status FROM users WHERE id = ? LIMIT 1",
    [landlordId]
  );

  if (
    !landlord ||
    landlord.role !== "landlord" ||
    landlord.verification_status !== "approved"
  ) {
    return null;
  }

  return landlord;
}

router.get("/overview", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const pool = getPool();
    const [
      [usersCountRows],
      [adminsCountRows],
      [landlordsCountRows],
      [pendingLandlordVerificationRows],
      [rentersCountRows],
      [techniciansCountRows],
      [propertiesCountRows],
      [availablePropertiesCountRows],
      [rentedPropertiesCountRows],
      [soldPropertiesCountRows],
      [revenueRows],
      [successfulTransactionsRows],
      recentPropertiesRows,
      recentTransactionsRows
    ] = await Promise.all([
      pool.execute("SELECT COUNT(*) AS total FROM users"),
      pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'"),
      pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'landlord'"),
      pool.execute(
        "SELECT COUNT(*) AS total FROM users WHERE role = 'landlord' AND verification_status = 'pending'"
      ),
      pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'renter'"),
      pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'technician'"),
      pool.execute("SELECT COUNT(*) AS total FROM properties"),
      pool.execute("SELECT COUNT(*) AS total FROM properties WHERE status = 'available'"),
      pool.execute("SELECT COUNT(*) AS total FROM properties WHERE status = 'rented'"),
      pool.execute("SELECT COUNT(*) AS total FROM properties WHERE status = 'sold'"),
      pool.execute(
        `
          SELECT COALESCE(SUM(amount_paid), 0) AS total
          FROM property_contact_unlocks
          WHERE status = 'success'
        `
      ),
      pool.execute(
        `
          SELECT COUNT(*) AS total
          FROM property_contact_unlocks
          WHERE status = 'success'
        `
      ),
      pool.execute(
        `
          SELECT
            p.*,
            u.name AS landlord_name,
            u.email AS landlord_email,
            COALESCE(unlock_stats.unlocks_count, 0) AS unlocks_count
          FROM properties p
          LEFT JOIN users u
            ON u.id = p.landlord_id
          LEFT JOIN (
            SELECT property_id, COUNT(*) AS unlocks_count
            FROM property_contact_unlocks
            WHERE status = 'success'
            GROUP BY property_id
          ) AS unlock_stats
            ON unlock_stats.property_id = p.id
          ORDER BY p.created_at DESC
          LIMIT 6
        `
      ),
      pool.execute(
        `
          SELECT
            unlocks.id,
            unlocks.reference,
            unlocks.email,
            unlocks.amount_paid,
            unlocks.status,
            unlocks.paid_at,
            unlocks.property_id,
            property.type AS property_type,
            property.location AS property_location,
            unlocks.renter_id,
            renter.name AS renter_name,
            renter.email AS renter_email,
            property.landlord_id,
            landlord.name AS landlord_name,
            landlord.email AS landlord_email
          FROM property_contact_unlocks unlocks
          LEFT JOIN properties property
            ON property.id = unlocks.property_id
          LEFT JOIN users renter
            ON renter.id = unlocks.renter_id
          LEFT JOIN users landlord
            ON landlord.id = property.landlord_id
          WHERE unlocks.status = 'success'
          ORDER BY COALESCE(unlocks.paid_at, unlocks.created_at) DESC
          LIMIT 6
        `
      )
    ]);

    return res.json({
      stats: {
        users: usersCountRows[0].total,
        admins: adminsCountRows[0].total,
        landlords: landlordsCountRows[0].total,
        pendingLandlordVerifications: pendingLandlordVerificationRows[0].total,
        renters: rentersCountRows[0].total,
        technicians: techniciansCountRows[0].total,
        properties: propertiesCountRows[0].total,
        availableProperties: availablePropertiesCountRows[0].total,
        rentedProperties: rentedPropertiesCountRows[0].total,
        soldProperties: soldPropertiesCountRows[0].total,
        revenue: Number(revenueRows[0].total),
        successfulTransactions: successfulTransactionsRows[0].total
      },
      properties: recentPropertiesRows.map(mapManagedProperty),
      recentTransactions: recentTransactionsRows.map(mapRevenueRow)
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/users", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `
        SELECT
          u.id,
          u.name,
          u.email,
          u.phone,
          u.whatsapp_number,
          u.property_address,
          u.verification_document,
          u.verification_status,
          u.verification_submitted_at,
          u.verified_at,
          u.verified_by,
          u.verification_notes,
          u.role,
          u.created_at,
          COALESCE(property_stats.properties_count, 0) AS properties_count,
          COALESCE(unlock_stats.unlocks_count, 0) AS unlocks_count
        FROM users u
        LEFT JOIN (
          SELECT landlord_id, COUNT(*) AS properties_count
          FROM properties
          GROUP BY landlord_id
        ) AS property_stats
          ON property_stats.landlord_id = u.id
        LEFT JOIN (
          SELECT renter_id, COUNT(*) AS unlocks_count
          FROM property_contact_unlocks
          WHERE status = 'success'
          GROUP BY renter_id
        ) AS unlock_stats
          ON unlock_stats.renter_id = u.id
        ORDER BY FIELD(u.role, 'admin', 'landlord', 'technician', 'renter'), u.created_at DESC
      `
    );

    return res.json(
      rows.map((row) => ({
        ...mapManagedUser(row),
        can_edit: !isReservedAdminEmail(row.email) || Number(row.id) === Number(req.user.id)
      }))
    );
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/landlord-verifications",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res, next) => {
    try {
      const pool = getPool();
      const [rows] = await pool.execute(
        `
          SELECT
            id,
            name,
            email,
            phone,
            whatsapp_number,
            property_address,
            verification_document,
            verification_status,
            verification_submitted_at,
            verified_at,
            verified_by,
            verification_notes,
            created_at
          FROM users
          WHERE role = 'landlord'
          ORDER BY
            FIELD(verification_status, 'pending', 'rejected', 'approved'),
            COALESCE(verification_submitted_at, created_at) DESC
        `
      );

      return res.json({
        applications: rows.map(mapLandlordVerification)
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.patch(
  "/landlord-verifications/:id",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res, next) => {
    try {
      const landlordId = Number(req.params.id);
      const nextStatus = normalizeVerificationStatus(req.body.verificationStatus);
      const adminNotes = normalizeOptionalText(req.body.adminNotes, 2000);

      if (!landlordId) {
        return res.status(400).json({ message: "A valid landlord id is required." });
      }

      if (!["approved", "rejected"].includes(nextStatus)) {
        return res.status(400).json({
          message: "Verification status must be approved or rejected."
        });
      }

      const pool = getPool();
      const [[landlord]] = await pool.execute(
        `
          SELECT
            id,
            name,
            email,
            phone,
            whatsapp_number,
            property_address,
            verification_document,
            verification_status,
            verification_submitted_at,
            verification_notes,
            role
          FROM users
          WHERE id = ?
          LIMIT 1
        `,
        [landlordId]
      );

      if (!landlord || landlord.role !== "landlord") {
        return res.status(404).json({ message: "Landlord application not found." });
      }

      await pool.execute(
        `
          UPDATE users
          SET
            verification_status = ?,
            verification_notes = ?,
            verified_by = ?,
            verified_at = ?,
            verification_submitted_at = COALESCE(verification_submitted_at, created_at)
          WHERE id = ?
        `,
        [
          nextStatus,
          adminNotes,
          req.user.id,
          nextStatus === "approved" ? new Date() : null,
          landlordId
        ]
      );

      const payload = {
        landlordId,
        landlordName: landlord.name,
        email: landlord.email,
        phone: landlord.phone || "",
        whatsappNumber: landlord.whatsapp_number || "",
        propertyAddress: landlord.property_address || "",
        verificationDocument: landlord.verification_document || "",
        adminNotes
      };

      if (nextStatus === "approved") {
        await notifyLandlordApproved(payload);
      } else {
        await notifyLandlordRejected(payload);
      }

      return res.json({
        message:
          nextStatus === "approved"
            ? "Landlord approved successfully."
            : "Landlord rejected successfully."
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post("/users", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const { name, email, phone = "", password, role } = req.body;
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedRole = normalizeRole(role);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedName || !normalizedEmail || !password || !normalizedRole) {
      return res.status(400).json({
        message: "Name, email, password, and a valid role are required."
      });
    }

    if (normalizedEmail === ADMIN_EMAIL && normalizedRole !== "admin") {
      return res.status(400).json({
        message: "The reserved admin email can only be assigned to an admin account."
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const pool = getPool();
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `
          INSERT INTO users (
            name,
            email,
            phone,
            whatsapp_number,
            property_address,
            verification_document,
            verification_status,
            verification_submitted_at,
            verified_at,
            verified_by,
            verification_notes,
            password,
            role
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          normalizedName,
          normalizedEmail,
          normalizedPhone,
          "",
          "",
          "",
          normalizedRole === "landlord" ? "approved" : "approved",
          normalizedRole === "landlord" ? new Date() : null,
          normalizedRole === "landlord" ? new Date() : null,
          normalizedRole === "landlord" ? req.user.id : null,
          "",
          hashedPassword,
          normalizedRole
        ]
      );

      if (normalizedRole === "technician") {
        await ensureTechnicianRecords(connection, {
          id: result.insertId,
          name: normalizedName,
          phone: normalizedPhone
        });
      }

      await connection.commit();

      const createdUser = await fetchManagedUserById(pool, result.insertId);

      return res.status(201).json({
        message: `${normalizedRole.charAt(0).toUpperCase()}${normalizedRole.slice(1)} created successfully.`,
        user: createdUser
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return next(error);
  }
});

router.put("/users/:id", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { name, email, phone = "", password = "", role } = req.body;
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedRole = normalizeRole(role);
    const normalizedPhone = normalizePhone(phone);

    if (!userId) {
      return res.status(400).json({ message: "A valid user id is required." });
    }

    if (!normalizedName || !normalizedEmail || !normalizedRole) {
      return res.status(400).json({
        message: "Name, email, and a valid role are required."
      });
    }

    if (normalizedEmail === ADMIN_EMAIL && normalizedRole !== "admin") {
      return res.status(400).json({
        message: "The reserved admin email must remain assigned to an admin account."
      });
    }

    if (password && String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const pool = getPool();
    const [[existingUser]] = await pool.execute(
      "SELECT id, email, role, verification_status FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (isReservedAdminEmail(existingUser.email) && Number(req.user.id) !== userId) {
      return res.status(403).json({
        message: "Only the owner of the reserved admin account can edit this account."
      });
    }

    if (
      normalizeEmail(existingUser.email) === ADMIN_EMAIL &&
      normalizedRole !== "admin"
    ) {
      return res.status(400).json({
        message: "The reserved admin account cannot be reassigned to another role."
      });
    }

    if (
      isReservedAdminEmail(normalizedEmail) &&
      !isReservedAdminEmail(existingUser.email)
    ) {
      return res.status(403).json({
        message: "This reserved admin email cannot be assigned to another account."
      });
    }

    const [emailConflict] = await pool.execute(
      "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
      [normalizedEmail, userId]
    );

    if (emailConflict.length > 0) {
      return res.status(409).json({ message: "Another account already uses this email." });
    }

    if (existingUser.role === "landlord" && normalizedRole !== "landlord") {
      const [propertyCountResult, tenantCountResult, financeCountResult] = await Promise.all([
        pool.execute("SELECT COUNT(*) AS total FROM properties WHERE landlord_id = ?", [userId]),
        pool.execute("SELECT COUNT(*) AS total FROM landlord_tenants WHERE landlord_id = ?", [userId]),
        pool.execute("SELECT COUNT(*) AS total FROM landlord_finance_records WHERE landlord_id = ?", [userId])
      ]);
      const propertyCount = propertyCountResult[0][0];
      const tenantCount = tenantCountResult[0][0];
      const financeCount = financeCountResult[0][0];

      if (propertyCount.total > 0 || tenantCount.total > 0 || financeCount.total > 0) {
        return res.status(409).json({
          message: "This landlord still has linked records. Remove or reassign their properties, tenants, and finance records before changing the role."
        });
      }
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const updates = ["name = ?", "email = ?", "phone = ?", "role = ?"];
      const values = [normalizedName, normalizedEmail, normalizedPhone, normalizedRole];

      if (existingUser.role !== "landlord" && normalizedRole === "landlord") {
        updates.push(
          "verification_status = ?",
          "verification_submitted_at = ?",
          "verified_at = ?",
          "verified_by = ?",
          "verification_notes = ?"
        );
        values.push("approved", new Date(), new Date(), req.user.id, "");
      }

      if (password) {
        updates.push("password = ?");
        values.push(await bcrypt.hash(password, 10));
      }

      values.push(userId);

      await connection.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

      if (normalizedRole === "technician") {
        await ensureTechnicianRecords(connection, {
          id: userId,
          name: normalizedName,
          phone: normalizedPhone
        });
      } else if (existingUser.role === "technician" && normalizedRole !== "technician") {
        const [[technician]] = await connection.execute(
          "SELECT id FROM technicians WHERE user_id = ? LIMIT 1",
          [userId]
        );

        if (technician) {
          await connection.execute("DELETE FROM technician_portfolios WHERE technician_id = ?", [technician.id]);
          await connection.execute("DELETE FROM technician_stats WHERE technician_id = ?", [technician.id]);
          await connection.execute("DELETE FROM technicians WHERE id = ?", [technician.id]);
        }
      }

      await connection.commit();

      const updatedUser = await fetchManagedUserById(pool, userId);

      return res.json({
        message: "User updated successfully.",
        user: updatedUser
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return next(error);
  }
});

router.delete("/users/:id", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({ message: "A valid user id is required." });
  }

  if (userId === req.user.id) {
    return res.status(400).json({ message: "You cannot delete the admin account you are currently using." });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existingUser]] = await connection.execute(
      "SELECT id, role, name, email FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!existingUser) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found." });
    }

    if (normalizeEmail(existingUser.email) === ADMIN_EMAIL) {
      await connection.rollback();
      return res.status(400).json({ message: "The reserved admin account cannot be deleted here." });
    }

    await connection.execute(
      `
        DELETE unlocks
        FROM property_contact_unlocks AS unlocks
        INNER JOIN properties AS properties
          ON properties.id = unlocks.property_id
        WHERE properties.landlord_id = ?
      `,
      [userId]
    );
    await connection.execute("DELETE FROM property_contact_unlocks WHERE renter_id = ?", [userId]);
    const [[technician]] = await connection.execute(
      "SELECT id FROM technicians WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (technician) {
      await connection.execute("DELETE FROM technician_portfolios WHERE technician_id = ?", [technician.id]);
      await connection.execute("DELETE FROM technician_stats WHERE technician_id = ?", [technician.id]);
      await connection.execute("DELETE FROM technicians WHERE id = ?", [technician.id]);
    }
    await connection.execute("DELETE FROM landlord_finance_records WHERE landlord_id = ?", [userId]);
    await connection.execute("DELETE FROM landlord_tenants WHERE landlord_id = ?", [userId]);
    await connection.execute("DELETE FROM properties WHERE landlord_id = ?", [userId]);
    await connection.execute("DELETE FROM users WHERE id = ?", [userId]);

    await connection.commit();

    return res.json({
      message: `${existingUser.name} and related records were deleted successfully.`
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.get("/properties", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `
        SELECT
          p.*,
          u.name AS landlord_name,
          u.email AS landlord_email,
          COALESCE(unlock_stats.unlocks_count, 0) AS unlocks_count
        FROM properties p
        LEFT JOIN users u
          ON u.id = p.landlord_id
        LEFT JOIN (
          SELECT property_id, COUNT(*) AS unlocks_count
          FROM property_contact_unlocks
          WHERE status = 'success'
          GROUP BY property_id
        ) AS unlock_stats
          ON unlock_stats.property_id = p.id
        ORDER BY p.created_at DESC
      `
    );

    return res.json(rows.map(mapManagedProperty));
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/properties",
  verifyToken,
  authorizeRoles("admin"),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const {
        landlord_id: landlordIdValue,
        type,
        listing_purpose: listingPurposeValue,
        description,
        location,
        price,
        phone
      } = req.body;
      const landlordId = Number(landlordIdValue);
      const images = req.files?.images || [];
      const video = req.files?.video?.[0];

      if (!landlordId || !type || !description || !location || !price || !phone) {
        return res.status(400).json({
          message: "Landlord, type, description, location, price, and phone are required."
        });
      }

      if (images.length === 0 || !video) {
        return res.status(400).json({ message: "Please upload up to 5 images and exactly 1 video." });
      }

      if (images.length > 5) {
        return res.status(400).json({ message: "You can upload a maximum of 5 images." });
      }

      const pool = getPool();
      const landlord = await ensureAssignableLandlord(pool, landlordId);

      if (!landlord) {
        return res.status(404).json({ message: "Selected landlord was not found." });
      }

      const normalizedPhone = normalizePhone(phone);
      const listingPurpose = normalizeListingPurpose(listingPurposeValue);
      const [result] = await pool.execute(
        `
          INSERT INTO properties
            (landlord_id, type, listing_purpose, description, location, price, phone, wa_link, images, video, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
        `,
        [
          landlordId,
          normalizeName(type),
          listingPurpose,
          String(description).trim(),
          String(location).trim(),
          Number(price),
          normalizedPhone,
          buildWhatsAppLink(phone),
          JSON.stringify(images.map((file) => file.filename)),
          video.filename
        ]
      );

      const createdProperty = await fetchManagedPropertyById(pool, result.insertId);

      return res.status(201).json({
        message: "Property created successfully.",
        property: createdProperty
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/properties/:id",
  verifyToken,
  authorizeRoles("admin"),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const propertyId = Number(req.params.id);
      const {
        landlord_id: landlordIdValue,
        type,
        listing_purpose: listingPurposeValue,
        description,
        location,
        price,
        phone,
        status
      } = req.body;
      const landlordId = Number(landlordIdValue);
      const newImages = req.files?.images || [];
      const newVideo = req.files?.video?.[0];

      if (!propertyId) {
        return res.status(400).json({ message: "A valid property id is required." });
      }

      if (!landlordId || !type || !description || !location || !price || !phone) {
        return res.status(400).json({
          message: "Landlord, type, description, location, price, and phone are required."
        });
      }

      if (newImages.length > 5) {
        return res.status(400).json({ message: "You can upload a maximum of 5 images." });
      }

      const pool = getPool();
      const landlord = await ensureAssignableLandlord(pool, landlordId);

      if (!landlord) {
        return res.status(404).json({ message: "Selected landlord was not found." });
      }

      const [[existingProperty]] = await pool.execute(
        "SELECT id, images, video FROM properties WHERE id = ? LIMIT 1",
        [propertyId]
      );

      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found." });
      }

      const imagesToStore =
        newImages.length > 0
          ? JSON.stringify(newImages.map((file) => file.filename))
          : existingProperty.images;
      const videoToStore = newVideo ? newVideo.filename : existingProperty.video;
      const normalizedPhone = normalizePhone(phone);
      const listingPurpose = normalizeListingPurpose(listingPurposeValue);

      await pool.execute(
        `
          UPDATE properties
          SET
            landlord_id = ?,
            type = ?,
            listing_purpose = ?,
            description = ?,
            location = ?,
            price = ?,
            phone = ?,
            wa_link = ?,
            images = ?,
            video = ?,
            status = ?
          WHERE id = ?
        `,
        [
          landlordId,
          normalizeName(type),
          listingPurpose,
          String(description).trim(),
          String(location).trim(),
          Number(price),
          normalizedPhone,
          buildWhatsAppLink(phone),
          imagesToStore,
          videoToStore,
          normalizePropertyStatus(status),
          propertyId
        ]
      );

      const updatedProperty = await fetchManagedPropertyById(pool, propertyId);

      return res.json({
        message: "Property updated successfully.",
        property: updatedProperty
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.delete("/properties/:id", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  const propertyId = Number(req.params.id);

  if (!propertyId) {
    return res.status(400).json({ message: "A valid property id is required." });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existingProperty]] = await connection.execute(
      "SELECT id, type, location FROM properties WHERE id = ? LIMIT 1",
      [propertyId]
    );

    if (!existingProperty) {
      await connection.rollback();
      return res.status(404).json({ message: "Property not found." });
    }

    await connection.execute("DELETE FROM property_contact_unlocks WHERE property_id = ?", [propertyId]);
    await connection.execute("DELETE FROM properties WHERE id = ?", [propertyId]);
    await connection.commit();

    return res.json({
      message: `${existingProperty.type} in ${existingProperty.location} was deleted successfully.`
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.get("/revenue", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const pool = getPool();
    const [[summary]] = await pool.execute(
      `
        SELECT
          COUNT(*) AS successful_transactions,
          COALESCE(SUM(amount_paid), 0) AS total_revenue
        FROM property_contact_unlocks
        WHERE status = 'success'
      `
    );
    const [rows] = await pool.execute(
      `
        SELECT
          unlocks.id,
          unlocks.reference,
          unlocks.email,
          unlocks.amount_paid,
          unlocks.status,
          unlocks.paid_at,
          unlocks.property_id,
          property.type AS property_type,
          property.location AS property_location,
          unlocks.renter_id,
          renter.name AS renter_name,
          renter.email AS renter_email,
          property.landlord_id,
          landlord.name AS landlord_name,
          landlord.email AS landlord_email
        FROM property_contact_unlocks unlocks
        LEFT JOIN properties property
          ON property.id = unlocks.property_id
        LEFT JOIN users renter
          ON renter.id = unlocks.renter_id
        LEFT JOIN users landlord
          ON landlord.id = property.landlord_id
        WHERE unlocks.status = 'success'
        ORDER BY COALESCE(unlocks.paid_at, unlocks.created_at) DESC
      `
    );

    return res.json({
      summary: {
        successfulTransactions: Number(summary.successful_transactions || 0),
        revenue: Number(summary.total_revenue || 0)
      },
      transactions: rows.map(mapRevenueRow)
    });
  } catch (error) {
    return next(error);
  }
});

// Testimonials management
router.get("/testimonials", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      "SELECT id, name, role, video_url, avatar_url, rating, text_content, created_at FROM testimonials ORDER BY created_at DESC"
    );

    return res.json({
      testimonials: rows.map(mapTestimonial)
    });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/testimonials",
  verifyToken,
  authorizeRoles("admin"),
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "avatar", maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const rawName = String(req.body.name || "").trim();
      const normalizedRole = normalizeTestimonialRole(req.body.role);
      const normalizedRating = normalizeRating(req.body.rating);
      const textContent = String(req.body.textContent || "").trim();
      const uploadedVideo = req.files?.video?.[0];
      const uploadedAvatar = req.files?.avatar?.[0];
      const videoUrl = uploadedVideo ? buildUploadPath(uploadedVideo.filename) : "";
      const avatarUrl = uploadedAvatar
        ? buildUploadPath(uploadedAvatar.filename)
        : String(req.body.avatarUrl || "").trim();

      if (!rawName) {
        return res.status(400).json({ message: "Name and role are required." });
      }

      if (!videoUrl && !textContent) {
        return res.status(400).json({
          message: "Please provide at least a video or testimonial text."
        });
      }

      const pool = getPool();
      const [result] = await pool.execute(
        "INSERT INTO testimonials (name, role, video_url, avatar_url, rating, text_content) VALUES (?, ?, ?, ?, ?, ?)",
        [rawName, normalizedRole, videoUrl, avatarUrl, normalizedRating, textContent]
      );

      return res.status(201).json({
        message: "Testimonial created successfully.",
        testimonial: {
          id: result.insertId,
          name: rawName,
          role: normalizedRole,
          videoUrl,
          avatarUrl,
          rating: normalizedRating,
          textContent,
          createdAt: new Date()
        }
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/testimonials/:id",
  verifyToken,
  authorizeRoles("admin"),
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "avatar", maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const testimonialId = Number(req.params.id);
      const rawName = String(req.body.name || "").trim();
      const normalizedRole = normalizeTestimonialRole(req.body.role);
      const normalizedRating = normalizeRating(req.body.rating);
      const textContent = String(req.body.textContent || "").trim();

      if (!testimonialId) {
        return res.status(400).json({ message: "A valid testimonial id is required." });
      }

      if (!rawName) {
        return res.status(400).json({ message: "Name and role are required." });
      }

      const pool = getPool();
      const [[existing]] = await pool.execute(
        "SELECT id, video_url, avatar_url FROM testimonials WHERE id = ? LIMIT 1",
        [testimonialId]
      );

      if (!existing) {
        return res.status(404).json({ message: "Testimonial not found." });
      }

      const uploadedVideo = req.files?.video?.[0];
      const uploadedAvatar = req.files?.avatar?.[0];
      const videoUrl = uploadedVideo
        ? buildUploadPath(uploadedVideo.filename)
        : String(req.body.videoUrl || existing.video_url || "").trim();
      const avatarUrl = uploadedAvatar
        ? buildUploadPath(uploadedAvatar.filename)
        : String(req.body.avatarUrl || existing.avatar_url || "").trim();

      if (!videoUrl && !textContent) {
        return res.status(400).json({
          message: "Please provide at least a video or testimonial text."
        });
      }

      await pool.execute(
        "UPDATE testimonials SET name = ?, role = ?, video_url = ?, avatar_url = ?, rating = ?, text_content = ? WHERE id = ?",
        [rawName, normalizedRole, videoUrl, avatarUrl, normalizedRating, textContent, testimonialId]
      );

      return res.json({ message: "Testimonial updated successfully." });
    } catch (error) {
      return next(error);
    }
  }
);

router.delete("/testimonials/:id", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const testimonialId = Number(req.params.id);

    if (!testimonialId) {
      return res.status(400).json({ message: "A valid testimonial id is required." });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      "DELETE FROM testimonials WHERE id = ?",
      [testimonialId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Testimonial not found." });
    }

    return res.json({ message: "Testimonial deleted successfully." });
  } catch (error) {
    return next(error);
  }
});

// Loan Support Requests - Admin endpoints
router.get("/loan-requests", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `
        SELECT
          id,
          loan_type,
          name,
          phone,
          address,
          occupation,
          monthly_income,
          landlord_name,
          landlord_phone,
          created_at
        FROM loan_support_requests
        ORDER BY created_at DESC
      `
    );

    return res.json({
      requests: rows.map((row) => ({
        id: row.id,
        loanType: row.loan_type,
        name: row.name,
        phone: row.phone || "",
        address: row.address || "",
        occupation: row.occupation || "",
        monthlyIncome: Number(row.monthly_income || 0),
        landlordName: row.landlord_name || "",
        landlordPhone: row.landlord_phone || "",
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/loan-requests/:id", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);

    if (!requestId) {
      return res.status(400).json({ message: "A valid request id is required." });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      "DELETE FROM loan_support_requests WHERE id = ?",
      [requestId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Loan request not found." });
    }

    return res.json({ message: "Loan request deleted successfully." });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
