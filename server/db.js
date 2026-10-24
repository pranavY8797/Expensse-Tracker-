import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import crypto from 'node:crypto';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'safespend_vault',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
};

let pool = null;

export async function getDbPool() {
  if (!pool) {
    const initConn = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await initConn.query(`
      CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    await initConn.end();

    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Password hashing utilities using native crypto scrypt
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, storedHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

export async function initDatabase() {
  const db = await getDbPool();

  // 1. Users Table (Real authentication)
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      salt VARCHAR(64) NOT NULL,
      currency_symbol VARCHAR(10) DEFAULT '$',
      monthly_income_target DECIMAL(10, 2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. Transactions Table (Linked to real user)
  await db.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type ENUM('expense', 'income') NOT NULL DEFAULT 'expense',
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'USD',
      category VARCHAR(100) NOT NULL,
      merchant VARCHAR(150),
      date DATE NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'Card',
      notes TEXT,
      tags JSON,
      is_tax_deductible TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_date (user_id, date),
      INDEX idx_user_type (user_id, type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. Budgets Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      category VARCHAR(100) NOT NULL,
      monthly_limit DECIMAL(10, 2) NOT NULL,
      alert_threshold DECIMAL(3, 2) DEFAULT 0.85,
      UNIQUE KEY unique_user_category (user_id, category),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 4. Recurring Subscriptions Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS recurring_subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      billing_cycle ENUM('Monthly', 'Annual', 'Weekly') NOT NULL DEFAULT 'Monthly',
      category VARCHAR(100) NOT NULL,
      next_billing_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 5. Audit Logs Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // NOTE: Clean start - Zero fake transactions seeded.
  console.log('✅ MySQL schema initialized: Clean state, ready for real user enrollments.');
}
