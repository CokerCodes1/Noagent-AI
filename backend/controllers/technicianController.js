const bcrypt = require("bcryptjs");
const { getPool } = require("../config/db");
const { buildWhatsAppLink, normalizePhone } = require("../utils/contact");
const { ensureTechnicianRecords } = require("../utils/technicianProfile");

function parseImages(images) {
  try {
    const parsed = JSON.parse(images || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function normalizeText(value = "") {
  return String(value).trim();
}

function normalizeWebsite(website = "") {
  const normalizedWebsite = normalizeText(website);

  if (!normalizedWebsite) {
    return "";
  }

  if (/^https?:\/\//i.test(normalizedWebsite)) {
    return normalizedWebsite;
  }

  return `https://${normalizedWebsite}`;
}

function resolveCategory(category = "", customCategory = "") {
  const normalizedCategory = normalizeText(category);
  const normalizedCustomCategory = normalizeText(customCategory);

  if (normalizedCategory.toLowerCase() === "others") {
    return normalizedCustomCategory || "Others";
  }

  return normalizedCategory || normalizedCustomCategory;
}

function mapTechnicianRow(row) {
  const images = parseImages(row.images);
  const whatsappPhone = normalizePhone(row.whatsapp || row.phone);

  return {
    id: row.id,
    user_id: row.user_id,
    email: row.email || "",
    category: row.category || "",
    name: row.name || "",
    description: row.description || "",
    office_address: row.office_address || "",
    phone: row.phone || "",
    whatsapp: whatsappPhone || "",
    wa_link: buildWhatsAppLink(whatsappPhone),
    website: row.website || "",
    images,
    profile_image: images[0] || "",
    video_url: row.video_url || "",
    total_contacts: Number(row.total_contacts || 0),
    jobs_completed: Number(row.jobs_completed || 0),
    total_earnings: Number(row.total_earnings || 0),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function isMarketplaceReady(technician) {
  return Boolean(
    technician.category &&
      technician.name &&
      technician.description &&
      technician.office_address &&
      (technician.phone || technician.whatsapp)
  );
}

async function fetchTechnicianByUserId(pool, userId) {
  const [[row]] = await pool.execute(
    `
      SELECT
        t.*,
        u.email,
        COALESCE(portfolio.images, '[]') AS images,
        COALESCE(portfolio.video_url, '') AS video_url,
        COALESCE(stats.total_contacts, 0) AS total_contacts,
        COALESCE(stats.jobs_completed, 0) AS jobs_completed,
        COALESCE(stats.total_earnings, 0) AS total_earnings
      FROM technicians t
      INNER JOIN users u
        ON u.id = t.user_id
      LEFT JOIN technician_portfolios portfolio
        ON portfolio.technician_id = t.id
      LEFT JOIN technician_stats stats
        ON stats.technician_id = t.id
      WHERE t.user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  return row ? mapTechnicianRow(row) : null;
}

async function fetchTechnicianById(pool, technicianId) {
  const [[row]] = await pool.execute(
    `
      SELECT
        t.*,
        u.email,
        COALESCE(portfolio.images, '[]') AS images,
        COALESCE(portfolio.video_url, '') AS video_url,
        COALESCE(stats.total_contacts, 0) AS total_contacts,
        COALESCE(stats.jobs_completed, 0) AS jobs_completed,
        COALESCE(stats.total_earnings, 0) AS total_earnings
      FROM technicians t
      INNER JOIN users u
        ON u.id = t.user_id
      LEFT JOIN technician_portfolios portfolio
        ON portfolio.technician_id = t.id
      LEFT JOIN technician_stats stats
        ON stats.technician_id = t.id
      WHERE t.id = ?
      LIMIT 1
    `,
    [technicianId]
  );

  return row ? mapTechnicianRow(row) : null;
}

async function fetchAllTechnicians(pool, options = {}) {
  const [rows] = await pool.execute(
    `
      SELECT
        t.*,
        u.email,
        COALESCE(portfolio.images, '[]') AS images,
        COALESCE(portfolio.video_url, '') AS video_url,
        COALESCE(stats.total_contacts, 0) AS total_contacts,
        COALESCE(stats.jobs_completed, 0) AS jobs_completed,
        COALESCE(stats.total_earnings, 0) AS total_earnings
      FROM technicians t
      INNER JOIN users u
        ON u.id = t.user_id
      LEFT JOIN technician_portfolios portfolio
        ON portfolio.technician_id = t.id
      LEFT JOIN technician_stats stats
        ON stats.technician_id = t.id
      ORDER BY stats.total_contacts DESC, t.updated_at DESC, t.created_at DESC
    `
  );

  const technicians = rows.map(mapTechnicianRow);

  if (options.includeIncomplete) {
    return technicians;
  }

  return technicians.filter(isMarketplaceReady);
}

function validateTechnicianPayload(payload) {
  const category = resolveCategory(payload.category, payload.custom_category);
  const name = normalizeText(payload.name);
  const description = normalizeText(payload.description);
  const officeAddress = normalizeText(payload.office_address);
  const phone = normalizePhone(payload.phone);
  const whatsapp = normalizePhone(payload.whatsapp || payload.phone);
  const website = normalizeWebsite(payload.website);
  const jobsCompleted = Number(payload.jobs_completed || 0);
  const totalEarnings = Number(payload.total_earnings || 0);

  if (!category || !name || !description || !officeAddress || !phone) {
    return {
      error: "Category, name, description, office address, and phone are required."
    };
  }

  if (!Number.isFinite(jobsCompleted) || jobsCompleted < 0) {
    return { error: "Jobs completed must be a valid non-negative number." };
  }

  if (!Number.isFinite(totalEarnings) || totalEarnings < 0) {
    return { error: "Total earnings must be a valid non-negative number." };
  }

  return {
    category,
    name,
    description,
    officeAddress,
    phone,
    whatsapp,
    website,
    jobsCompleted: Math.floor(jobsCompleted),
    totalEarnings: Math.round(totalEarnings)
  };
}

function resolveVideoValue(existingValue, uploadedVideo, manualVideoValue) {
  if (uploadedVideo) {
    return uploadedVideo.filename;
  }

  const normalizedManualValue = normalizeText(manualVideoValue);
  if (normalizedManualValue) {
    return normalizedManualValue;
  }

  return existingValue || "";
}

async function saveTechnicianProfile(executor, technicianId, payload, files, existingPortfolio) {
  const validation = validateTechnicianPayload(payload);

  if (validation.error) {
    const error = new Error(validation.error);
    error.statusCode = 400;
    throw error;
  }

  const images = files?.images || [];
  const video = files?.video?.[0] || null;

  if (images.length > 5) {
    const error = new Error("You can upload a maximum of 5 images.");
    error.statusCode = 400;
    throw error;
  }

  const portfolioImages =
    images.length > 0
      ? JSON.stringify(images.map((file) => file.filename))
      : existingPortfolio?.images || "[]";

  const videoUrl = resolveVideoValue(
    existingPortfolio?.video_url || "",
    video,
    payload.video_url
  );

  await executor.execute(
    `
      UPDATE technicians
      SET
        category = ?,
        name = ?,
        description = ?,
        office_address = ?,
        phone = ?,
        whatsapp = ?,
        website = ?
      WHERE id = ?
    `,
    [
      validation.category,
      validation.name,
      validation.description,
      validation.officeAddress,
      validation.phone,
      validation.whatsapp,
      validation.website,
      technicianId
    ]
  );

  await executor.execute(
    `
      INSERT INTO technician_portfolios (technician_id, images, video_url)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        images = VALUES(images),
        video_url = VALUES(video_url)
    `,
    [technicianId, portfolioImages, videoUrl]
  );

  await executor.execute(
    `
      INSERT INTO technician_stats (technician_id, total_contacts, jobs_completed, total_earnings)
      VALUES (?, 0, ?, ?)
      ON DUPLICATE KEY UPDATE
        jobs_completed = VALUES(jobs_completed),
        total_earnings = VALUES(total_earnings)
    `,
    [technicianId, validation.jobsCompleted, validation.totalEarnings]
  );

  return validation;
}

exports.getMarketplaceTechnicians = async (req, res, next) => {
  try {
    const pool = getPool();
    const technicians = await fetchAllTechnicians(pool, { includeIncomplete: false });
    return res.json(technicians);
  } catch (error) {
    return next(error);
  }
};

exports.recordTechnicianContact = async (req, res, next) => {
  try {
    const technicianId = Number(req.params.id);

    if (!technicianId) {
      return res.status(400).json({ message: "A valid technician id is required." });
    }

    const pool = getPool();
    const technician = await fetchTechnicianById(pool, technicianId);

    if (!technician) {
      return res.status(404).json({ message: "Technician not found." });
    }

    if (req.user?.role === "technician" && technician.user_id === req.user.id) {
      return res.json({ message: "Self-contact events are not counted." });
    }

    await pool.execute(
      `
        INSERT INTO technician_stats (technician_id, total_contacts, jobs_completed, total_earnings)
        VALUES (?, 1, 0, 0)
        ON DUPLICATE KEY UPDATE total_contacts = technician_stats.total_contacts + 1
      `,
      [technicianId]
    );

    return res.json({ message: "Technician contact recorded." });
  } catch (error) {
    return next(error);
  }
};

exports.getMyTechnicianDashboard = async (req, res, next) => {
  try {
    const pool = getPool();
    const technician = await fetchTechnicianByUserId(pool, req.user.id);

    if (!technician) {
      return res.status(404).json({ message: "Technician profile not found." });
    }

    return res.json({
      stats: {
        totalContacts: technician.total_contacts,
        jobsDelivered: technician.jobs_completed,
        totalEarnings: technician.total_earnings
      },
      profile: technician
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMyTechnicianProfile = async (req, res, next) => {
  try {
    const pool = getPool();
    const technician = await fetchTechnicianByUserId(pool, req.user.id);

    if (!technician) {
      return res.status(404).json({ message: "Technician profile not found." });
    }

    return res.json(technician);
  } catch (error) {
    return next(error);
  }
};

exports.updateMyTechnicianProfile = async (req, res, next) => {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const technicianId = await ensureTechnicianRecords(connection, req.user);
      const [[existingPortfolio]] = await connection.execute(
        "SELECT images, video_url FROM technician_portfolios WHERE technician_id = ? LIMIT 1",
        [technicianId]
      );

      const validation = await saveTechnicianProfile(
        connection,
        technicianId,
        req.body,
        req.files,
        existingPortfolio
      );

      await connection.execute(
        "UPDATE users SET name = ?, phone = ? WHERE id = ?",
        [validation.name, validation.phone, req.user.id]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const technician = await fetchTechnicianByUserId(pool, req.user.id);

    return res.json({
      message: "Technician profile updated successfully.",
      technician
    });
  } catch (error) {
    return next(error);
  }
};

exports.getAdminTechnicians = async (req, res, next) => {
  try {
    const pool = getPool();
    const technicians = await fetchAllTechnicians(pool, { includeIncomplete: true });
    return res.json(technicians);
  } catch (error) {
    return next(error);
  }
};

exports.createAdminTechnician = async (req, res, next) => {
  try {
    const email = normalizeText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    const pool = getPool();
    let createdUserId = 0;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const validation = validateTechnicianPayload(req.body);
      if (validation.error) {
        const error = new Error(validation.error);
        error.statusCode = 400;
        throw error;
      }

      const [userResult] = await connection.execute(
        `
          INSERT INTO users (name, email, phone, password, role)
          VALUES (?, ?, ?, ?, 'technician')
        `,
        [
          validation.name,
          email,
          validation.phone,
          await bcrypt.hash(password, 10)
        ]
      );
      createdUserId = userResult.insertId;

      const technicianId = await ensureTechnicianRecords(connection, {
        id: createdUserId,
        name: validation.name,
        phone: validation.phone
      });

      await saveTechnicianProfile(connection, technicianId, req.body, req.files, null);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const createdTechnician = await fetchTechnicianByUserId(pool, createdUserId);

    return res.status(201).json({
      message: "Technician created successfully.",
      technician: createdTechnician
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateAdminTechnician = async (req, res, next) => {
  try {
    const technicianId = Number(req.params.id);

    if (!technicianId) {
      return res.status(400).json({ message: "A valid technician id is required." });
    }

    const pool = getPool();
    const [[existingTechnician]] = await pool.execute(
      `
        SELECT t.id, t.user_id, u.email
        FROM technicians t
        INNER JOIN users u
          ON u.id = t.user_id
        WHERE t.id = ?
        LIMIT 1
      `,
      [technicianId]
    );

    if (!existingTechnician) {
      return res.status(404).json({ message: "Technician not found." });
    }

    const email = normalizeText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const [emailConflict] = await pool.execute(
      "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
      [email, existingTechnician.user_id]
    );

    if (emailConflict.length > 0) {
      return res.status(409).json({ message: "Another account already uses this email." });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const [[existingPortfolio]] = await connection.execute(
        "SELECT images, video_url FROM technician_portfolios WHERE technician_id = ? LIMIT 1",
        [technicianId]
      );
      const validation = await saveTechnicianProfile(
        connection,
        technicianId,
        req.body,
        req.files,
        existingPortfolio
      );

      const updates = ["name = ?", "email = ?", "phone = ?", "role = 'technician'"];
      const values = [validation.name, email, validation.phone];

      if (password) {
        if (password.length < 6) {
          const error = new Error("Password must be at least 6 characters long.");
          error.statusCode = 400;
          throw error;
        }

        updates.push("password = ?");
        values.push(await bcrypt.hash(password, 10));
      }

      values.push(existingTechnician.user_id);

      await connection.execute(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const technician = await fetchTechnicianById(pool, technicianId);

    return res.json({
      message: "Technician updated successfully.",
      technician
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteAdminTechnician = async (req, res, next) => {
  try {
    const technicianId = Number(req.params.id);

    if (!technicianId) {
      return res.status(400).json({ message: "A valid technician id is required." });
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const [[technician]] = await connection.execute(
        `
          SELECT t.id, t.user_id, t.name
          FROM technicians t
          WHERE t.id = ?
          LIMIT 1
        `,
        [technicianId]
      );

      if (!technician) {
        await connection.rollback();
        return res.status(404).json({ message: "Technician not found." });
      }

      await connection.execute("DELETE FROM technician_portfolios WHERE technician_id = ?", [technicianId]);
      await connection.execute("DELETE FROM technician_stats WHERE technician_id = ?", [technicianId]);
      await connection.execute("DELETE FROM technicians WHERE id = ?", [technicianId]);
      await connection.execute("DELETE FROM users WHERE id = ?", [technician.user_id]);
      await connection.commit();

      return res.json({
        message: `${technician.name} was deleted successfully.`
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
};
