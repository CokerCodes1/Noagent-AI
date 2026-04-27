const { getPool } = require("../config/db");
const { buildWhatsAppLink, normalizePhone } = require("../utils/contact");

function normalizeText(value = "") {
  return String(value).trim();
}

function mapTenant(row) {
  const whatsapp = normalizePhone(row.whatsapp || row.phone);
  const expiryTime = new Date(row.rent_expiry_date).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    id: row.id,
    landlord_id: row.landlord_id,
    name: row.name,
    phone: row.phone || "",
    whatsapp,
    wa_link: buildWhatsAppLink(whatsapp),
    rent_start_date: row.rent_start_date,
    rent_expiry_date: row.rent_expiry_date,
    rent_amount: Number(row.rent_amount || 0),
    sanitation_date: row.sanitation_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_overdue: Number.isFinite(expiryTime) ? expiryTime < today.getTime() : false
  };
}

function mapFinanceRecord(row) {
  return {
    id: row.id,
    landlord_id: row.landlord_id,
    record_type: row.record_type,
    description: row.description,
    amount: Number(row.amount || 0),
    payment_date: row.payment_date,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function validateTenantPayload(payload) {
  const name = normalizeText(payload.name);
  const phone = normalizePhone(payload.phone);
  const whatsapp = normalizePhone(payload.whatsapp || payload.phone);
  const rentStartDate = normalizeText(payload.rent_start_date);
  const rentExpiryDate = normalizeText(payload.rent_expiry_date);
  const rentAmount = Number(payload.rent_amount || 0);
  const sanitationDate = normalizeText(payload.sanitation_date);

  if (!name || !phone || !rentStartDate || !rentExpiryDate) {
    return { error: "Name, phone, rent start date, and rent expiry date are required." };
  }

  if (!Number.isFinite(rentAmount) || rentAmount < 0) {
    return { error: "Rent amount must be a valid non-negative number." };
  }

  const rentStartTime = new Date(rentStartDate).getTime();
  const rentExpiryTime = new Date(rentExpiryDate).getTime();

  if (!Number.isFinite(rentStartTime) || !Number.isFinite(rentExpiryTime)) {
    return { error: "Rent start date and rent expiry date must be valid dates." };
  }

  if (rentExpiryTime < rentStartTime) {
    return { error: "Rent expiry date cannot be earlier than the rent start date." };
  }

  if (sanitationDate) {
    const sanitationTime = new Date(sanitationDate).getTime();

    if (!Number.isFinite(sanitationTime)) {
      return { error: "Sanitation date must be a valid date." };
    }
  }

  return {
    name,
    phone,
    whatsapp,
    rentStartDate,
    rentExpiryDate,
    rentAmount,
    sanitationDate: sanitationDate || null
  };
}

function validateFinancePayload(payload) {
  const recordType = payload.record_type === "sale" ? "sale" : "rent";
  const description = normalizeText(payload.description);
  const paymentDate = normalizeText(payload.payment_date);
  const amount = Number(payload.amount || 0);

  if (!description || !paymentDate) {
    return { error: "Description and payment date are required." };
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Amount must be a valid non-negative number." };
  }

  if (!Number.isFinite(new Date(paymentDate).getTime())) {
    return { error: "Payment date must be a valid date." };
  }

  return {
    recordType,
    description,
    paymentDate,
    amount
  };
}

exports.getLandlordOverview = async (req, res, next) => {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const [
      [tenantsCountRows],
      [rentedApartmentsRows],
      [soldPropertiesRows],
      [incomeRows]
    ] = await Promise.all([
      pool.execute("SELECT COUNT(*) AS total FROM landlord_tenants WHERE landlord_id = ?", [userId]),
      pool.execute(
        `
          SELECT COUNT(*) AS total
          FROM properties
          WHERE landlord_id = ? AND listing_purpose = 'rent' AND status = 'rented'
        `,
        [userId]
      ),
      pool.execute(
        `
          SELECT COUNT(*) AS total
          FROM properties
          WHERE landlord_id = ? AND listing_purpose = 'sale' AND status = 'sold'
        `,
        [userId]
      ),
      pool.execute(
        `
          SELECT
            COALESCE(SUM(CASE WHEN record_type = 'rent' THEN amount ELSE 0 END), 0) AS rent_income,
            COALESCE(SUM(CASE WHEN record_type = 'sale' THEN amount ELSE 0 END), 0) AS sales_income
          FROM landlord_finance_records
          WHERE landlord_id = ?
        `,
        [userId]
      )
    ]);

    return res.json({
      stats: {
        totalTenants: Number(tenantsCountRows[0].total || 0),
        totalApartmentsRented: Number(rentedApartmentsRows[0].total || 0),
        totalPropertiesSold: Number(soldPropertiesRows[0].total || 0),
        totalRentIncome: Number(incomeRows[0].rent_income || 0),
        totalSalesIncome: Number(incomeRows[0].sales_income || 0)
      }
    });
  } catch (error) {
    return next(error);
  }
};

exports.getTenants = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `
        SELECT *
        FROM landlord_tenants
        WHERE landlord_id = ?
        ORDER BY rent_expiry_date ASC, created_at DESC
      `,
      [req.user.id]
    );

    return res.json(rows.map(mapTenant));
  } catch (error) {
    return next(error);
  }
};

exports.createTenant = async (req, res, next) => {
  try {
    const validation = validateTenantPayload(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      `
        INSERT INTO landlord_tenants
          (landlord_id, name, phone, whatsapp, rent_start_date, rent_expiry_date, rent_amount, sanitation_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        validation.name,
        validation.phone,
        validation.whatsapp,
        validation.rentStartDate,
        validation.rentExpiryDate,
        validation.rentAmount,
        validation.sanitationDate
      ]
    );

    const [[tenant]] = await pool.execute(
      "SELECT * FROM landlord_tenants WHERE id = ? LIMIT 1",
      [result.insertId]
    );

    return res.status(201).json({
      message: "Tenant added successfully.",
      tenant: mapTenant(tenant)
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateTenant = async (req, res, next) => {
  try {
    const tenantId = Number(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ message: "A valid tenant id is required." });
    }

    const validation = validateTenantPayload(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const pool = getPool();
    const [[tenant]] = await pool.execute(
      "SELECT id FROM landlord_tenants WHERE id = ? AND landlord_id = ? LIMIT 1",
      [tenantId, req.user.id]
    );

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    await pool.execute(
      `
        UPDATE landlord_tenants
        SET
          name = ?,
          phone = ?,
          whatsapp = ?,
          rent_start_date = ?,
          rent_expiry_date = ?,
          rent_amount = ?,
          sanitation_date = ?
        WHERE id = ? AND landlord_id = ?
      `,
      [
        validation.name,
        validation.phone,
        validation.whatsapp,
        validation.rentStartDate,
        validation.rentExpiryDate,
        validation.rentAmount,
        validation.sanitationDate,
        tenantId,
        req.user.id
      ]
    );

    const [[updatedTenant]] = await pool.execute(
      "SELECT * FROM landlord_tenants WHERE id = ? LIMIT 1",
      [tenantId]
    );

    return res.json({
      message: "Tenant updated successfully.",
      tenant: mapTenant(updatedTenant)
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteTenant = async (req, res, next) => {
  try {
    const tenantId = Number(req.params.id);

    if (!tenantId) {
      return res.status(400).json({ message: "A valid tenant id is required." });
    }

    const pool = getPool();
    const [[tenant]] = await pool.execute(
      "SELECT id, name FROM landlord_tenants WHERE id = ? AND landlord_id = ? LIMIT 1",
      [tenantId, req.user.id]
    );

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    await pool.execute(
      "DELETE FROM landlord_tenants WHERE id = ? AND landlord_id = ?",
      [tenantId, req.user.id]
    );

    return res.json({ message: `${tenant.name} was removed successfully.` });
  } catch (error) {
    return next(error);
  }
};

exports.getFinanceRecords = async (req, res, next) => {
  try {
    const pool = getPool();
    const [[summary]] = await pool.execute(
      `
        SELECT
          COALESCE(SUM(CASE WHEN record_type = 'rent' THEN amount ELSE 0 END), 0) AS rent_income,
          COALESCE(SUM(CASE WHEN record_type = 'sale' THEN amount ELSE 0 END), 0) AS sales_income
        FROM landlord_finance_records
        WHERE landlord_id = ?
      `,
      [req.user.id]
    );
    const [rows] = await pool.execute(
      `
        SELECT *
        FROM landlord_finance_records
        WHERE landlord_id = ?
        ORDER BY payment_date DESC, created_at DESC
      `,
      [req.user.id]
    );

    return res.json({
      summary: {
        rentIncome: Number(summary.rent_income || 0),
        salesIncome: Number(summary.sales_income || 0),
        totalIncome: Number(summary.rent_income || 0) + Number(summary.sales_income || 0)
      },
      records: rows.map(mapFinanceRecord)
    });
  } catch (error) {
    return next(error);
  }
};

exports.createFinanceRecord = async (req, res, next) => {
  try {
    const validation = validateFinancePayload(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      `
        INSERT INTO landlord_finance_records
          (landlord_id, record_type, description, amount, payment_date)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        validation.recordType,
        validation.description,
        validation.amount,
        validation.paymentDate
      ]
    );

    const [[record]] = await pool.execute(
      "SELECT * FROM landlord_finance_records WHERE id = ? LIMIT 1",
      [result.insertId]
    );

    return res.status(201).json({
      message: "Finance record created successfully.",
      record: mapFinanceRecord(record)
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateFinanceRecord = async (req, res, next) => {
  try {
    const recordId = Number(req.params.id);

    if (!recordId) {
      return res.status(400).json({ message: "A valid finance record id is required." });
    }

    const validation = validateFinancePayload(req.body);

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const pool = getPool();
    const [[record]] = await pool.execute(
      "SELECT id FROM landlord_finance_records WHERE id = ? AND landlord_id = ? LIMIT 1",
      [recordId, req.user.id]
    );

    if (!record) {
      return res.status(404).json({ message: "Finance record not found." });
    }

    await pool.execute(
      `
        UPDATE landlord_finance_records
        SET
          record_type = ?,
          description = ?,
          amount = ?,
          payment_date = ?
        WHERE id = ? AND landlord_id = ?
      `,
      [
        validation.recordType,
        validation.description,
        validation.amount,
        validation.paymentDate,
        recordId,
        req.user.id
      ]
    );

    const [[updatedRecord]] = await pool.execute(
      "SELECT * FROM landlord_finance_records WHERE id = ? LIMIT 1",
      [recordId]
    );

    return res.json({
      message: "Finance record updated successfully.",
      record: mapFinanceRecord(updatedRecord)
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteFinanceRecord = async (req, res, next) => {
  try {
    const recordId = Number(req.params.id);

    if (!recordId) {
      return res.status(400).json({ message: "A valid finance record id is required." });
    }

    const pool = getPool();
    const [[record]] = await pool.execute(
      "SELECT id, description FROM landlord_finance_records WHERE id = ? AND landlord_id = ? LIMIT 1",
      [recordId, req.user.id]
    );

    if (!record) {
      return res.status(404).json({ message: "Finance record not found." });
    }

    await pool.execute(
      "DELETE FROM landlord_finance_records WHERE id = ? AND landlord_id = ?",
      [recordId, req.user.id]
    );

    return res.json({ message: `${record.description} was deleted successfully.` });
  } catch (error) {
    return next(error);
  }
};
