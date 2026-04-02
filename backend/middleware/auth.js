const { verifyJwt } = require("../config/jwt");

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

module.exports = {
  authorizeRoles,
  optionalAuth,
  verifyToken
};
