const mysql = require("mysql2/promise");
const { RENT_CONTACT_FEE_KOBO, SALE_CONTACT_FEE_KOBO } = require("../utils/propertyListing");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "property_app";

let pool;

const poolConfig = {
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await connection.end();
}

async function createPool() {
  if (!pool) {
    await ensureDatabaseExists();
    pool = mysql.createPool(poolConfig);
  }

  return pool;
}

async function initDatabase() {
  const activePool = await createPool();

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(120) NOT NULL,
      phone VARCHAR(25) NOT NULL DEFAULT '',
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'landlord', 'renter', 'technician') NOT NULL DEFAULT 'renter',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_users_email (email)
    )
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      landlord_id INT NOT NULL,
      type VARCHAR(100) NOT NULL,
      listing_purpose ENUM('rent', 'sale') NOT NULL DEFAULT 'rent',
      description TEXT NOT NULL,
      location VARCHAR(255) NOT NULL,
      price DECIMAL(12, 2) NOT NULL,
      phone VARCHAR(25) NOT NULL,
      wa_link VARCHAR(255) NOT NULL,
      images JSON NOT NULL,
      video VARCHAR(255) NOT NULL,
      status ENUM('available', 'rented', 'sold') NOT NULL DEFAULT 'available',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_properties_landlord_id (landlord_id),
      INDEX idx_properties_status (status)
    )
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS technicians (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      category VARCHAR(120) NOT NULL DEFAULT '',
      name VARCHAR(120) NOT NULL,
      description TEXT NOT NULL,
      office_address VARCHAR(255) NOT NULL,
      phone VARCHAR(25) NOT NULL DEFAULT '',
      whatsapp VARCHAR(25) NOT NULL DEFAULT '',
      website VARCHAR(255) NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_technicians_user_id (user_id),
      INDEX idx_technicians_category (category)
    )
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS technician_portfolios (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      technician_id INT NOT NULL,
      images JSON NOT NULL,
      video_url VARCHAR(255) NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_technician_portfolio (technician_id)
    )
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS technician_stats (
      technician_id INT NOT NULL PRIMARY KEY,
      total_contacts INT NOT NULL DEFAULT 0,
      jobs_completed INT NOT NULL DEFAULT 0,
      total_earnings INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS landlord_tenants (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      landlord_id INT NOT NULL,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(25) NOT NULL DEFAULT '',
      whatsapp VARCHAR(25) NOT NULL DEFAULT '',
      rent_start_date DATE NOT NULL,
      rent_expiry_date DATE NOT NULL,
      rent_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      sanitation_date DATE NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_landlord_tenants_landlord (landlord_id),
      INDEX idx_landlord_tenants_expiry (rent_expiry_date)
    )
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS landlord_finance_records (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      landlord_id INT NOT NULL,
      record_type ENUM('rent', 'sale') NOT NULL DEFAULT 'rent',
      description VARCHAR(255) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      payment_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_landlord_finance_landlord (landlord_id),
      INDEX idx_landlord_finance_type (record_type),
      INDEX idx_landlord_finance_date (payment_date)
    )
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS property_contact_unlocks (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      property_id INT NOT NULL,
      renter_id INT NOT NULL,
      reference VARCHAR(150) NOT NULL,
      email VARCHAR(120) NOT NULL,
      amount_paid INT NOT NULL,
      status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
      paid_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_unlock_reference (reference),
      UNIQUE KEY uniq_unlock_property_renter (property_id, renter_id),
      INDEX idx_unlock_renter_status (renter_id, status),
      INDEX idx_unlock_property_status (property_id, status)
    )
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      email VARCHAR(120) NOT NULL,
      code_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      consumed_at DATETIME NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_password_reset_user (user_id),
      INDEX idx_password_reset_email (email),
      INDEX idx_password_reset_expires (expires_at),
      CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await activePool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(25) NOT NULL DEFAULT '' AFTER email
  `);

  await activePool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER role
  `);

  await activePool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
  `);

  await activePool.query(`
    ALTER TABLE users
    MODIFY COLUMN email VARCHAR(120) NOT NULL,
    MODIFY COLUMN phone VARCHAR(25) NOT NULL DEFAULT '',
    MODIFY COLUMN role ENUM('admin', 'landlord', 'renter', 'technician') NOT NULL DEFAULT 'renter'
  `);

  await activePool.query(`
    ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS listing_purpose ENUM('rent', 'sale') NOT NULL DEFAULT 'rent' AFTER type
  `);

  await activePool.query(`
    UPDATE properties
    SET listing_purpose = 'rent'
    WHERE listing_purpose IS NULL OR listing_purpose NOT IN ('rent', 'sale')
  `);

  await activePool.query(`
    ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS phone VARCHAR(25) NOT NULL DEFAULT '' AFTER price
  `);

  await activePool.query(`
    ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
  `);

  await activePool.query(`
    UPDATE properties
    SET status = 'available'
    WHERE status IS NULL OR status = 'pending'
  `);

  await activePool.query(`
    ALTER TABLE properties
    MODIFY COLUMN listing_purpose ENUM('rent', 'sale') NOT NULL DEFAULT 'rent',
    MODIFY COLUMN phone VARCHAR(25) NOT NULL,
    MODIFY COLUMN status ENUM('available', 'rented', 'sold') NOT NULL DEFAULT 'available'
  `);

  await activePool.query(`
    ALTER TABLE property_contact_unlocks
    MODIFY COLUMN amount_paid INT NOT NULL COMMENT 'Stored in kobo. Rent: ${RENT_CONTACT_FEE_KOBO}, Sale: ${SALE_CONTACT_FEE_KOBO}'
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      role ENUM('landlord', 'renter', 'technician') NOT NULL,
      video_url VARCHAR(255) NOT NULL DEFAULT '',
      avatar_url VARCHAR(255) NOT NULL DEFAULT '',
      rating INT NOT NULL DEFAULT 5,
      text_content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  return activePool;
}

function getPool() {
  if (!pool) {
    throw new Error("Database pool has not been initialized. Call initDatabase() first.");
  }

  return pool;
}

module.exports = {
  DB_NAME,
  getPool,
  initDatabase
};
