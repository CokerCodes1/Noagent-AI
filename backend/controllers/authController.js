const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { getPool } = require("../config/db");
const { signToken } = require("../config/jwt");
const { ensureTechnicianRecords } = require("../utils/technicianProfile");
const { sendPasswordResetEmail } = require("../utils/mailer");

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "cokarproperties001@gmail.com").toLowerCase();
const PASSWORD_RESET_CODE_TTL_MINUTES = Number(
  process.env.PASSWORD_RESET_CODE_TTL_MINUTES || 15
);
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function normalizeName(name = "") {
  return String(name).trim();
}

function normalizePhone(phone = "") {
  return String(phone).trim();
}

function normalizeResetCode(resetCode = "") {
  return String(resetCode).trim().replace(/\s+/g, "");
}

function hashResetCode(email, resetCode) {
  return crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${normalizeResetCode(resetCode)}`)
    .digest("hex");
}

function generateResetCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function getPasswordResetExpiry() {
  return new Date(Date.now() + PASSWORD_RESET_CODE_TTL_MINUTES * 60 * 1000);
}

function isPasswordValid(password = "") {
  return String(password).length >= 6;
}

function resolveRole(email, requestedRole = "renter") {
  if (requestedRole === "admin") {
    return "admin";
  }

  if (normalizeEmail(email) === ADMIN_EMAIL) {
    return "admin";
  }

  if (requestedRole === "technician") {
    return "technician";
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

    if (!isPasswordValid(password)) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedName = normalizeName(name);
    const normalizedPhone = normalizePhone(phone);

    if (normalizedEmail === ADMIN_EMAIL) {
      return res.status(403).json({
        message: "This email is reserved. Contact an admin if you need access."
      });
    }

    if (role === "landlord" || role === "admin") {
      return res.status(403).json({
        message: "Public signup creates renter or technician accounts only. Admins create landlord and admin accounts."
      });
    }

    const requestedRole = role === "technician" ? "technician" : "renter";
    const resolvedRole = resolveRole(normalizedEmail, requestedRole);
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
        "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
        [normalizedName, normalizedEmail, normalizedPhone, hashedPassword, resolvedRole]
      );

      const user = {
        id: result.insertId,
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        role: resolvedRole
      };

      if (resolvedRole === "technician") {
        await ensureTechnicianRecords(connection, user);
      }

      await connection.commit();

      return res.status(201).json(createAuthResponse(user));
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = normalizeEmail(email);
    const pool = getPool();
    const [users] = await pool.execute(
      "SELECT id, name, email FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );
    const successMessage =
      "If an account with that email exists, a reset code has been sent.";

    if (users.length === 0) {
      return res.json({ message: successMessage });
    }

    const user = users[0];
    const resetCode = generateResetCode();
    const codeHash = hashResetCode(normalizedEmail, resetCode);
    const expiresAt = getPasswordResetExpiry();

    await pool.execute("DELETE FROM password_reset_codes WHERE user_id = ?", [user.id]);
    await pool.execute(
      `
        INSERT INTO password_reset_codes (user_id, email, code_hash, expires_at)
        VALUES (?, ?, ?, ?)
      `,
      [user.id, normalizedEmail, codeHash, expiresAt]
    );

    try {
      await sendPasswordResetEmail({
        name: user.name,
        to: normalizedEmail,
        resetCode,
        expiresInMinutes: PASSWORD_RESET_CODE_TTL_MINUTES
      });
    } catch (error) {
      await pool.execute(
        "DELETE FROM password_reset_codes WHERE user_id = ? AND code_hash = ?",
        [user.id, codeHash]
      );
      throw error;
    }

    return res.json({ message: successMessage });
  } catch (error) {
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({
        message: "Email, reset code, and a new password are required."
      });
    }

    if (!isPasswordValid(newPassword)) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedResetCode = normalizeResetCode(resetCode);
    const pool = getPool();
    const [users] = await pool.execute(
      "SELECT id, name, email, phone, role FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid or expired reset code." });
    }

    const user = users[0];
    const [resetRows] = await pool.execute(
      `
        SELECT id, code_hash, expires_at
        FROM password_reset_codes
        WHERE user_id = ? AND consumed_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [user.id]
    );

    if (resetRows.length === 0) {
      return res.status(401).json({ message: "Invalid or expired reset code." });
    }

    const resetEntry = resetRows[0];

    if (new Date(resetEntry.expires_at).getTime() < Date.now()) {
      await pool.execute("DELETE FROM password_reset_codes WHERE id = ?", [resetEntry.id]);
      return res.status(401).json({ message: "Reset code has expired. Please request another one." });
    }

    const receivedCodeHash = hashResetCode(normalizedEmail, normalizedResetCode);

    if (receivedCodeHash !== resetEntry.code_hash) {
      return res.status(401).json({ message: "Invalid or expired reset code." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const resolvedRole = resolveRole(user.email, user.role);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await connection.execute(
        "UPDATE users SET password = ?, role = ? WHERE id = ?",
        [hashedPassword, resolvedRole, user.id]
      );
      await connection.execute(
        "UPDATE password_reset_codes SET consumed_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        [user.id]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    user.role = resolvedRole;

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
      if (email === ADMIN_EMAIL) {
        return res.status(403).json({
          message: "This email is reserved. Contact an admin if you need access."
        });
      }

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
