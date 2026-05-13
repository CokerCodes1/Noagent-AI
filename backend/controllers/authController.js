const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs/promises");
const { OAuth2Client } = require("google-auth-library");
const { getPool } = require("../config/db");
const { signToken } = require("../config/jwt");
const {
  notifyAdminOfLandlordApplication
} = require("../utils/landlordVerificationNotifications");
const {
  LANDLORD_SUPPORT_CONTACT,
  getLandlordVerificationMessage,
  normalizeOptionalText,
  normalizePhoneNumber
} = require("../utils/landlordVerification");
const { ensureTechnicianRecords } = require("../utils/technicianProfile");
const { sendPasswordResetEmail } = require("../utils/mailer");

const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "cokarproperties001@gmail.com"
).toLowerCase();
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

function normalizeAddress(address = "") {
  return String(address).trim();
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

  if (requestedRole === "landlord") {
    return "landlord";
  }

  return "renter";
}

function buildUploadPath(filename = "") {
  return filename ? `/uploads/${filename}` : "";
}

async function cleanupUploadedFile(file) {
  if (!file?.path) {
    return;
  }

  try {
    await fs.unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Failed to clean up uploaded file:", error);
    }
  }
}

function mapAuthUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    phoneNumber: user.phone || "",
    whatsappNumber: user.whatsapp_number || "",
    propertyAddress: user.property_address || "",
    verificationDocument: user.verification_document || "",
    verificationStatus: user.verification_status || "approved",
    verificationSubmittedAt: user.verification_submitted_at || null,
    verifiedAt: user.verified_at || null,
    verifiedBy: user.verified_by || null,
    verificationNotes: user.verification_notes || "",
    home_address: user.home_address || "",
    avatar_url: user.avatar_url || "",
    role: user.role
  };
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
    user: mapAuthUser(user)
  };
}

async function fetchUserById(pool, userId) {
  const [users] = await pool.execute(
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
        home_address,
        avatar_url,
        password,
        role
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [userId]
  );

  return users[0] || null;
}

exports.signup = async (req, res, next) => {
  try {
    const { name, email, phone = "", password, role } = req.body;

    if (!name || !email || !password) {
      await cleanupUploadedFile(req.file);
      return res.status(400).json({
        message: "Name, email, and password are required."
      });
    }

    if (!isPasswordValid(password)) {
      await cleanupUploadedFile(req.file);
      return res.status(400).json({
        message: "Password must be at least 6 characters long."
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedName = normalizeName(name);
    const normalizedPhone = normalizePhone(phone);
    const resolvedRole = resolveRole(normalizedEmail, role);
    const isLandlordSignup = resolvedRole === "landlord";
    const normalizedWhatsAppNumber = normalizePhoneNumber(
      req.body.whatsappNumber
    );
    const normalizedPropertyAddress = normalizeOptionalText(
      req.body.propertyAddress,
      255
    );
    const verificationDocumentPath = req.file
      ? buildUploadPath(`verification-documents/${req.file.filename}`)
      : "";

    if (normalizedEmail === ADMIN_EMAIL) {
      await cleanupUploadedFile(req.file);
      return res.status(403).json({
        message: "This email is reserved. Contact an admin if you need access."
      });
    }

    if (resolvedRole === "admin") {
      await cleanupUploadedFile(req.file);
      return res.status(403).json({
        message: "Admin accounts can only be created internally."
      });
    }

    if (isLandlordSignup) {
      if (
        !normalizedPhone ||
        !normalizedWhatsAppNumber ||
        !normalizedPropertyAddress
      ) {
        await cleanupUploadedFile(req.file);
        return res.status(400).json({
          message:
            "Phone number, WhatsApp number, and property address are required for landlord verification."
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message:
            "Upload a verification document to continue your landlord registration."
        });
      }
    }

    const pool = getPool();
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      await cleanupUploadedFile(req.file);
      return res.status(409).json({
        message: "An account with this email already exists."
      });
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
            home_address,
            avatar_url,
            password,
            role
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          normalizedName,
          normalizedEmail,
          normalizedPhone,
          isLandlordSignup ? normalizedWhatsAppNumber : "",
          isLandlordSignup ? normalizedPropertyAddress : "",
          isLandlordSignup ? verificationDocumentPath : "",
          isLandlordSignup ? "pending" : "approved",
          isLandlordSignup ? new Date() : null,
          null,
          null,
          "",
          "",
          "",
          hashedPassword,
          resolvedRole
        ]
      );

      const user = {
        id: result.insertId,
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        whatsapp_number: isLandlordSignup ? normalizedWhatsAppNumber : "",
        property_address: isLandlordSignup ? normalizedPropertyAddress : "",
        verification_document: isLandlordSignup ? verificationDocumentPath : "",
        verification_status: isLandlordSignup ? "pending" : "approved",
        verification_submitted_at: isLandlordSignup ? new Date() : null,
        verified_at: null,
        verified_by: null,
        verification_notes: "",
        home_address: "",
        avatar_url: "",
        role: resolvedRole
      };

      if (resolvedRole === "technician") {
        await ensureTechnicianRecords(connection, user);
      }

      await connection.commit();

      if (isLandlordSignup) {
        await notifyAdminOfLandlordApplication({
          landlordId: user.id,
          landlordName: user.name,
          email: user.email,
          phone: user.phone,
          whatsappNumber: user.whatsapp_number,
          propertyAddress: user.property_address,
          verificationDocument: user.verification_document
        });

        return res.status(201).json({
          message: "Registration successful. Your landlord profile is pending verification.",
          requiresVerification: true,
          verificationStatus: "pending"
        });
      }

      return res.status(201).json(createAuthResponse(user));
    } catch (error) {
      await connection.rollback();
      await cleanupUploadedFile(req.file);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    await cleanupUploadedFile(req.file);
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const pool = getPool();
    const [users] = await pool.execute(
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
          home_address,
          avatar_url,
          password,
          role
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
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
      await pool.execute("UPDATE users SET role = ? WHERE id = ?", [
        resolvedRole,
        user.id
      ]);
      user.role = resolvedRole;
    }

    if (user.role === "landlord" && user.verification_status !== "approved") {
      return res.status(403).json({
        message: getLandlordVerificationMessage(user),
        verificationStatus: user.verification_status,
        supportContact: LANDLORD_SUPPORT_CONTACT
      });
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

    await pool.execute("DELETE FROM password_reset_codes WHERE user_id = ?", [
      user.id
    ]);
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
      return res.status(400).json({
        message: "New password must be at least 6 characters long."
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedResetCode = normalizeResetCode(resetCode);
    const pool = getPool();
    const [users] = await pool.execute(
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
          home_address,
          avatar_url,
          role
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
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
      await pool.execute("DELETE FROM password_reset_codes WHERE id = ?", [
        resetEntry.id
      ]);
      return res.status(401).json({
        message: "Reset code has expired. Please request another one."
      });
    }

    const receivedCodeHash = hashResetCode(
      normalizedEmail,
      normalizedResetCode
    );

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

    if (user.role === "landlord" && user.verification_status !== "approved") {
      return res.json({
        message: `Password reset successful. ${getLandlordVerificationMessage(user)}`,
        requiresVerification: true,
        verificationStatus: user.verification_status,
        supportContact: LANDLORD_SUPPORT_CONTACT
      });
    }

    return res.json(createAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    if (!googleClient) {
      return res.status(503).json({
        message: "Google sign-in is not configured on the server."
      });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Google credential is required."
      });
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
          home_address,
          avatar_url,
          password,
          role
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
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
            home_address,
            avatar_url,
            password,
            role
          )
          VALUES (?, ?, ?, ?, ?, ?, 'approved', NULL, NULL, NULL, '', ?, ?, ?, ?)
        `,
        [name, email, "", "", "", "", "", "", randomPasswordHash, resolvedRole]
      );

      user = {
        id: result.insertId,
        name,
        email,
        phone: "",
        whatsapp_number: "",
        property_address: "",
        verification_document: "",
        verification_status: "approved",
        verification_submitted_at: null,
        verified_at: null,
        verified_by: null,
        verification_notes: "",
        home_address: "",
        avatar_url: "",
        role: resolvedRole
      };
    } else if (user.role !== resolvedRole) {
      await pool.execute("UPDATE users SET role = ? WHERE id = ?", [
        resolvedRole,
        user.id
      ]);
      user.role = resolvedRole;
    }

    return res.json(createAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const pool = getPool();
    const user = await fetchUserById(pool, req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user: mapAuthUser(user) });
  } catch (error) {
    return next(error);
  }
};

exports.updateCurrentUser = async (req, res, next) => {
  try {
    const pool = getPool();
    const user = await fetchUserById(pool, req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const normalizedName = normalizeName(req.body.name);
    const normalizedEmail = normalizeEmail(req.body.email);
    const normalizedPhone = normalizePhone(req.body.phone);
    const normalizedAddress = normalizeAddress(req.body.home_address);

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    if (
      normalizedEmail === ADMIN_EMAIL &&
      normalizeEmail(user.email) !== ADMIN_EMAIL
    ) {
      return res.status(403).json({
        message: "This reserved admin email cannot be assigned to another account."
      });
    }

    const [emailConflict] = await pool.execute(
      "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
      [normalizedEmail, req.user.id]
    );

    if (emailConflict.length > 0) {
      return res.status(409).json({
        message: "Another account already uses this email."
      });
    }

    const avatarUrl = req.file
      ? buildUploadPath(req.file.filename)
      : String(req.body.avatar_url || user.avatar_url || "").trim();
    const nextRole = resolveRole(normalizedEmail, user.role);

    await pool.execute(
      `
        UPDATE users
        SET
          name = ?,
          email = ?,
          phone = ?,
          home_address = ?,
          avatar_url = ?,
          role = ?
        WHERE id = ?
      `,
      [
        normalizedName,
        normalizedEmail,
        normalizedPhone,
        normalizedAddress,
        avatarUrl,
        nextRole,
        req.user.id
      ]
    );

    const updatedUser = await fetchUserById(pool, req.user.id);

    return res.json({
      message: "Settings updated successfully.",
      ...createAuthResponse(updatedUser)
    });
  } catch (error) {
    return next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required."
      });
    }

    if (!isPasswordValid(newPassword)) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long."
      });
    }

    const pool = getPool();
    const user = await fetchUserById(pool, req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "Choose a different password from your current one."
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      req.user.id
    ]);

    const updatedUser = await fetchUserById(pool, req.user.id);

    return res.json({
      message: "Password updated successfully.",
      ...createAuthResponse(updatedUser)
    });
  } catch (error) {
    return next(error);
  }
};
