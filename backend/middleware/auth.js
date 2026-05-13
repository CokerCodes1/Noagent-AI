const { verifyJwt } = require("../config/jwt");
const { getPool } = require("../config/db");
const { getLandlordVerificationMessage } = require("../utils/landlordVerification");

function extractToken(req) {
  const authorization = req.headers.authorization || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  return authorization.trim();
}

function verifyToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    req.user = verifyJwt(token);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = verifyJwt(token);
  } catch (error) {
    req.user = null;
  }

  return next();
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have access to this resource." });
    }

    return next();
  };
}

async function requireApprovedLandlord(req, res, next) {
  if (!req.user || req.user.role !== "landlord") {
    return next();
  }

  try {
    const pool = getPool();
    const [[user]] = await pool.execute(
      `
        SELECT role, verification_status
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.verification_status !== "approved") {
      return res.status(403).json({
        message: getLandlordVerificationMessage(user)
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  authorizeRoles,
  optionalAuth,
  requireApprovedLandlord,
  verifyToken
};
