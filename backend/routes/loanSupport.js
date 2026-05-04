const router = require("express").Router();
const { getPool } = require("../config/db");

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

function normalizeLoanType(loanType = "") {
  if (loanType === "land_acquisition") {
    return "land_acquisition";
  }

  if (loanType === "building_project") {
    return "building_project";
  }

  if (loanType === "house_rent") {
    return "house_rent";
  }

  return "land_acquisition";
}

function mapLoanRequest(row) {
  return {
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
  };
}

// Public endpoint for submitting loan requests
router.post("/", async (req, res, next) => {
  try {
    const {
      loanType,
      name,
      phone,
      address = "",
      occupation = "",
      monthlyIncome = 0,
      landlordName = "",
      landlordPhone = ""
    } = req.body;

    const normalizedLoanType = normalizeLoanType(loanType);
    const normalizedName = String(name || "").trim();
    const normalizedPhone = normalizePhone(phone);
    const normalizedAddress = String(address || "").trim();
    const normalizedOccupation = String(occupation || "").trim();
    const normalizedMonthlyIncome = Number(monthlyIncome) || 0;
    const normalizedLandlordName = String(landlordName || "").trim();
    const normalizedLandlordPhone = normalizePhone(landlordPhone);

    if (!normalizedName || !normalizedPhone) {
      return res.status(400).json({
        message: "Name and phone number are required."
      });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      `
        INSERT INTO loan_support_requests
          (loan_type, name, phone, address, occupation, monthly_income, landlord_name, landlord_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        normalizedLoanType,
        normalizedName,
        normalizedPhone,
        normalizedAddress,
        normalizedOccupation,
        normalizedMonthlyIncome,
        normalizedLandlordName,
        normalizedLandlordPhone
      ]
    );

    return res.status(201).json({
      message: "Loan request submitted successfully.",
      requestId: result.insertId
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
