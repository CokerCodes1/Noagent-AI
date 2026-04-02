const router = require("express").Router();
const { getPool } = require("../config/db");
const { authorizeRoles, verifyToken } = require("../middleware/auth");

router.get("/overview", verifyToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const pool = getPool();
    const [[usersCount]] = await pool.execute("SELECT COUNT(*) AS total FROM users");
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

module.exports = router;
