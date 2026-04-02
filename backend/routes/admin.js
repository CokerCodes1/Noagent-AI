const bcrypt = require("bcryptjs");
const router = require("express").Router();
const { getPool } = require("../config/db");
const { authorizeRoles, verifyToken } = require("../middleware/auth");

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "cokarproperties001@gmail.com").toLowerCase();

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizeRole(role = "") {
  return role === "landlord" ? "landlord" : role === "renter" ? "renter" : "";
}

function mapManagedUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    role: row.role,
    created_at: row.created_at,
    properties_count: Number(row.properties_count || 0),
    unlocks_count: Number(row.unlocks_count || 0)
  };
}

router.get("/overview", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const pool = getPool();
    const [[usersCount]] = await pool.execute("SELECT COUNT(*) AS total FROM users");
    const [[landlordsCount]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'landlord'"
    );
    const [[rentersCount]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'renter'"
    );
    const [[propertiesCount]] = await pool.execute("SELECT COUNT(*) AS total FROM properties");
    const [[availablePropertiesCount]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM properties WHERE status = 'available'"
    );
    const [[rentedPropertiesCount]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM properties WHERE status = 'rented'"
    );
    const [[revenue]] = await pool.execute(
      `
        SELECT COALESCE(SUM(amount_paid), 0) AS total
        FROM property_contact_unlocks
        WHERE status = 'success'
      `
    );
    const [properties] = await pool.execute(
      `
        SELECT
          p.id,
          p.type,
          p.location,
          p.price,
          p.status,
          p.created_at,
          u.name AS landlord_name
        FROM properties p
        LEFT JOIN users u
          ON u.id = p.landlord_id
        ORDER BY p.created_at DESC
      `
    );

    return res.json({
      stats: {
        users: usersCount.total,
        landlords: landlordsCount.total,
        renters: rentersCount.total,
        properties: propertiesCount.total,
        availableProperties: availablePropertiesCount.total,
        rentedProperties: rentedPropertiesCount.total,
        revenue: Number(revenue.total)
      },
      properties
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
        WHERE u.role IN ('landlord', 'renter')
        ORDER BY FIELD(u.role, 'landlord', 'renter'), u.created_at DESC
      `
    );

    return res.json(rows.map(mapManagedUser));
  } catch (error) {
    return next(error);
  }
});

router.post("/users", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const { name, email, phone = "", password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedRole = normalizeRole(role);

    if (!name || !normalizedEmail || !password || !normalizedRole) {
      return res.status(400).json({
        message: "Name, email, password, and a valid role are required."
      });
    }

    if (normalizedEmail === ADMIN_EMAIL) {
      return res.status(400).json({
        message: "The reserved admin email cannot be assigned to a landlord or renter."
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
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
      [name.trim(), normalizedEmail, String(phone).trim(), hashedPassword, normalizedRole]
    );

    const [[createdUser]] = await pool.execute(
      `
        SELECT
          id,
          name,
          email,
          phone,
          role,
          created_at,
          0 AS properties_count,
          0 AS unlocks_count
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    return res.status(201).json({
      message: `${normalizedRole === "landlord" ? "Landlord" : "Renter"} created successfully.`,
      user: mapManagedUser(createdUser)
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/users/:id", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { name, email, phone = "", password = "", role } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedRole = normalizeRole(role);

    if (!userId) {
      return res.status(400).json({ message: "A valid user id is required." });
    }

    if (!name || !normalizedEmail || !normalizedRole) {
      return res.status(400).json({
        message: "Name, email, and a valid role are required."
      });
    }

    if (normalizedEmail === ADMIN_EMAIL) {
      return res.status(400).json({
        message: "The reserved admin email cannot be assigned to a landlord or renter."
      });
    }

    if (password && String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const pool = getPool();
    const [[existingUser]] = await pool.execute(
      "SELECT id, email, role FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!existingUser || !["landlord", "renter"].includes(existingUser.role)) {
      return res.status(404).json({ message: "Managed user not found." });
    }

    const [emailConflict] = await pool.execute(
      "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
      [normalizedEmail, userId]
    );

    if (emailConflict.length > 0) {
      return res.status(409).json({ message: "Another account already uses this email." });
    }

    if (existingUser.role === "landlord" && normalizedRole === "renter") {
      const [[propertyCount]] = await pool.execute(
        "SELECT COUNT(*) AS total FROM properties WHERE landlord_id = ?",
        [userId]
      );

      if (propertyCount.total > 0) {
        return res.status(409).json({
          message: "This landlord still has property listings. Remove or reassign them before changing the role."
        });
      }
    }

    const updates = [
      "name = ?",
      "email = ?",
      "phone = ?",
      "role = ?"
    ];
    const values = [
      name.trim(),
      normalizedEmail,
      String(phone).trim(),
      normalizedRole
    ];

    if (password) {
      updates.push("password = ?");
      values.push(await bcrypt.hash(password, 10));
    }

    values.push(userId);

    await pool.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    const [[updatedUser]] = await pool.execute(
      `
        SELECT
          u.id,
          u.name,
          u.email,
          u.phone,
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

    return res.json({
      message: "User updated successfully.",
      user: mapManagedUser(updatedUser)
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/users/:id", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({ message: "A valid user id is required." });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existingUser]] = await connection.execute(
      "SELECT id, role, name, email FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!existingUser || !["landlord", "renter"].includes(existingUser.role)) {
      await connection.rollback();
      return res.status(404).json({ message: "Managed user not found." });
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

module.exports = router;
