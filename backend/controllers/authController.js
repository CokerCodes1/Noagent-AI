const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const { getPool } = require("../config/db");
const { signToken } = require("../config/jwt");

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "cokarproperties001@gmail.com").toLowerCase();
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function resolveRole(email, requestedRole = "renter") {
  if (normalizeEmail(email) === ADMIN_EMAIL) {
    return "admin";
  }

  return requestedRole === "landlord" ? "landlord" : "renter";
}

function createAuthResponse(user) {
  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role
    }
  };
}

exports.signup = async (req, res, next) => {
  try {
    const { name, email, phone = "", password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const normalizedEmail = normalizeEmail(email);
    const resolvedRole = resolveRole(normalizedEmail, role);
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
      [name.trim(), normalizedEmail, phone.trim(), hashedPassword, resolvedRole]
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      role: resolvedRole
    };

    return res.status(201).json(createAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = normalizeEmail(email);
    const pool = getPool();
    const [users] = await pool.execute(
      "SELECT id, name, email, phone, password, role FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = users[0];
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const resolvedRole = resolveRole(user.email, user.role);

    if (resolvedRole !== user.role) {
      await pool.execute("UPDATE users SET role = ? WHERE id = ?", [resolvedRole, user.id]);
      user.role = resolvedRole;
    }

    return res.json(createAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    if (!googleClient) {
      return res.status(503).json({ message: "Google sign-in is not configured on the server." });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google credential is required." });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = normalizeEmail(payload.email);
    const name = payload.name || "Google User";
    const resolvedRole = resolveRole(email, "renter");
    const pool = getPool();

    const [users] = await pool.execute(
      "SELECT id, name, email, phone, password, role FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    let user = users[0];

    if (!user) {
      const randomPasswordHash = await bcrypt.hash(`${Date.now()}-${email}`, 10);
      const [result] = await pool.execute(
        "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
        [name, email, "", randomPasswordHash, resolvedRole]
      );

      user = {
        id: result.insertId,
        name,
        email,
        phone: "",
        role: resolvedRole
      };
    } else if (user.role !== resolvedRole) {
      await pool.execute("UPDATE users SET role = ? WHERE id = ?", [resolvedRole, user.id]);
      user.role = resolvedRole;
    }

    return res.json(createAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};
