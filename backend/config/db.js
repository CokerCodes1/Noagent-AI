const mysql = require("mysql2/promise");

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
      role ENUM('admin', 'landlord', 'renter') NOT NULL DEFAULT 'renter',
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
      description TEXT NOT NULL,
      location VARCHAR(255) NOT NULL,
      price DECIMAL(12, 2) NOT NULL,
      phone VARCHAR(25) NOT NULL,
      wa_link VARCHAR(255) NOT NULL,
      images JSON NOT NULL,
      video VARCHAR(255) NOT NULL,
      status ENUM('available', 'rented') NOT NULL DEFAULT 'available',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_properties_landlord_id (landlord_id),
      INDEX idx_properties_status (status)
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
    MODIFY COLUMN role ENUM('admin', 'landlord', 'renter') NOT NULL DEFAULT 'renter'
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
    MODIFY COLUMN phone VARCHAR(25) NOT NULL,
    MODIFY COLUMN status ENUM('available', 'rented') NOT NULL DEFAULT 'available'
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
