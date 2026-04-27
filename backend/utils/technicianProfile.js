const { normalizePhone } = require("./contact");

function normalizeText(value = "") {
  return String(value).trim();
}

async function ensureTechnicianRecords(executor, user) {
  const normalizedName = normalizeText(user?.name);
  const normalizedPhone = normalizePhone(user?.phone);

  await executor.execute(
    `
      INSERT INTO technicians
        (user_id, category, name, description, office_address, phone, whatsapp, website)
      VALUES (?, '', ?, '', '', ?, ?, '')
      ON DUPLICATE KEY UPDATE
        name = COALESCE(NULLIF(technicians.name, ''), VALUES(name)),
        phone = COALESCE(NULLIF(technicians.phone, ''), VALUES(phone)),
        whatsapp = COALESCE(NULLIF(technicians.whatsapp, ''), VALUES(whatsapp))
    `,
    [user.id, normalizedName, normalizedPhone, normalizedPhone]
  );

  const [[technician]] = await executor.execute(
    "SELECT id FROM technicians WHERE user_id = ? LIMIT 1",
    [user.id]
  );

  if (!technician) {
    throw new Error("Failed to initialize technician profile.");
  }

  await executor.execute(
    `
      INSERT INTO technician_portfolios (technician_id, images, video_url)
      VALUES (?, '[]', '')
      ON DUPLICATE KEY UPDATE technician_id = VALUES(technician_id)
    `,
    [technician.id]
  );

  await executor.execute(
    `
      INSERT INTO technician_stats (technician_id, total_contacts, jobs_completed, total_earnings)
      VALUES (?, 0, 0, 0)
      ON DUPLICATE KEY UPDATE technician_id = VALUES(technician_id)
    `,
    [technician.id]
  );

  return technician.id;
}

module.exports = {
  ensureTechnicianRecords
};
