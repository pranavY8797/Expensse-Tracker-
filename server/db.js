import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

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
    // 1. Ensure database exists
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

    // 2. Create the connection pool connected to our database
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function initDatabase() {
  const db = await getDbPool();

  // Create tables
  await db.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
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
      receipt_data MEDIUMTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_date (date),
      INDEX idx_category (category),
      INDEX idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(100) NOT NULL UNIQUE,
      monthly_limit DECIMAL(10, 2) NOT NULL,
      alert_threshold DECIMAL(3, 2) DEFAULT 0.85
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS recurring_subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      billing_cycle ENUM('Monthly', 'Annual', 'Weekly') NOT NULL DEFAULT 'Monthly',
      category VARCHAR(100) NOT NULL,
      next_billing_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'active'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INT PRIMARY KEY,
      vault_pin VARCHAR(255) DEFAULT NULL,
      currency_symbol VARCHAR(10) DEFAULT '$',
      monthly_income_target DECIMAL(10, 2) DEFAULT 6500.00,
      privacy_mode TINYINT(1) DEFAULT 0,
      last_backup TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Default profile check
  const [profileRows] = await db.query('SELECT count(*) as cnt FROM user_profile');
  if (profileRows[0].cnt === 0) {
    await db.query(`
      INSERT INTO user_profile (id, vault_pin, currency_symbol, monthly_income_target, privacy_mode)
      VALUES (1, NULL, '$', 6500.00, 0)
    `);
  }

  // Default budgets
  const [budgetRows] = await db.query('SELECT count(*) as cnt FROM budgets');
  if (budgetRows[0].cnt === 0) {
    const defaultBudgets = [
      ['Housing & Utilities', 1800.00, 0.90],
      ['Groceries & Dining', 800.00, 0.80],
      ['Transportation', 350.00, 0.85],
      ['Entertainment & Tech', 300.00, 0.75],
      ['Health & Wellness', 250.00, 0.80],
      ['Shopping & Gear', 400.00, 0.80]
    ];
    await db.query(
      'INSERT INTO budgets (category, monthly_limit, alert_threshold) VALUES ?',
      [defaultBudgets]
    );
  }

  // Default seed transactions
  const [txRows] = await db.query('SELECT count(*) as cnt FROM transactions');
  if (txRows[0].cnt === 0) {
    await seedInitialData(db);
  }
}

async function seedInitialData(db) {
  const now = new Date();
  const formatDaysAgo = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const sampleTransactions = [
    ['income', 3250.00, 'USD', 'Salary & Earnings', 'Tech Corp Payroll', formatDaysAgo(2), 'Bank Transfer', 'Bi-weekly direct deposit', JSON.stringify(['payroll', 'primary']), 0],
    ['income', 650.00, 'USD', 'Freelance & Side Gig', 'Design Studio Client', formatDaysAgo(10), 'Stripe', 'UI Design sprint milestone', JSON.stringify(['freelance', 'side-income']), 0],
    ['expense', 1450.00, 'USD', 'Housing & Utilities', 'Aura Heights Apartments', formatDaysAgo(24), 'Bank Transfer', 'Monthly rent', JSON.stringify(['housing', 'fixed']), 0],
    ['expense', 124.50, 'USD', 'Housing & Utilities', 'CleanPower Grid', formatDaysAgo(14), 'Card', 'Electricity & heating', JSON.stringify(['utilities']), 0],
    ['expense', 84.60, 'USD', 'Groceries & Dining', 'Whole Foods Market', formatDaysAgo(1), 'Apple Pay', 'Organic groceries & fresh produce', JSON.stringify(['groceries', 'healthy']), 0],
    ['expense', 46.20, 'USD', 'Groceries & Dining', 'Artisan Bakery & Cafe', formatDaysAgo(3), 'Card', 'Brunch with colleagues', JSON.stringify(['dining', 'social']), 0],
    ['expense', 32.10, 'USD', 'Groceries & Dining', 'Blue Bottle Coffee', formatDaysAgo(5), 'Card', 'Single-origin espresso & beans', JSON.stringify(['coffee']), 0],
    ['expense', 55.00, 'USD', 'Transportation', 'Shell Mobility', formatDaysAgo(6), 'Card', 'Gas refill', JSON.stringify(['commute']), 0],
    ['expense', 24.50, 'USD', 'Transportation', 'Uber Technologies', formatDaysAgo(8), 'Card', 'Ride home from city center', JSON.stringify(['ride-share']), 0],
    ['expense', 21.99, 'USD', 'Entertainment & Tech', 'Netflix 4K Premium', formatDaysAgo(12), 'Card', 'Family streaming tier', JSON.stringify(['subscription']), 0],
    ['expense', 20.00, 'USD', 'Entertainment & Tech', 'OpenAI ChatGPT Plus', formatDaysAgo(15), 'Card', 'AI research assistant', JSON.stringify(['ai', 'work', 'deductible']), 1],
    ['expense', 79.00, 'USD', 'Health & Wellness', 'Equinox Fitness Club', formatDaysAgo(18), 'Card', 'Gym & recovery access', JSON.stringify(['fitness', 'health']), 0],
    ['expense', 145.00, 'USD', 'Shopping & Gear', 'Amazon Services', formatDaysAgo(4), 'Card', 'Ergonomic desk light & USB-C hub', JSON.stringify(['home-office', 'tech']), 1]
  ];

  await db.query(
    `INSERT INTO transactions (type, amount, currency, category, merchant, date, payment_method, notes, tags, is_tax_deductible) VALUES ?`,
    [sampleTransactions]
  );

  const sampleSubscriptions = [
    ['Netflix Premium', 21.99, 'Monthly', 'Entertainment & Tech', formatDaysAgo(-16)],
    ['ChatGPT Plus', 20.00, 'Monthly', 'Entertainment & Tech', formatDaysAgo(-13)],
    ['Spotify Duo', 14.99, 'Monthly', 'Entertainment & Tech', formatDaysAgo(-7)],
    ['Equinox Gym Pass', 79.00, 'Monthly', 'Health & Wellness', formatDaysAgo(-10)],
    ['GitHub Copilot', 10.00, 'Monthly', 'Entertainment & Tech', formatDaysAgo(-21)]
  ];

  await db.query(
    `INSERT INTO recurring_subscriptions (name, amount, billing_cycle, category, next_billing_date) VALUES ?`,
    [sampleSubscriptions]
  );

  await db.query(
    `INSERT INTO audit_logs (action, details) VALUES (?, ?)`,
    ['MYSQL_INITIALIZED', 'SafeSpend AI connected to MySQL 8.0 server on localhost:3306 (database: safespend_vault)']
  );
}
