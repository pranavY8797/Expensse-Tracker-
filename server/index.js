import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDbPool, initDatabase, hashPassword, verifyPassword } from './db.js';
import {
  parseExpenseNLP,
  parseReceipt,
  generateAuraInsights,
  askAuraAdvisor,
  batchCategorizeCSV,
  simulateWhatIfScenario
} from './aiEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let db;
(async () => {
  try {
    await initDatabase();
    db = await getDbPool();
    console.log(`🛡️ SafeSpend AI Backend connected to MySQL Server (database: ${process.env.DB_NAME || 'safespend_vault'})`);
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err);
  }
})();

// Helper to get userId from headers or query
function getUserId(req) {
  const headerId = req.headers['x-user-id'];
  const queryId = req.query.userId;
  const parsed = parseInt(headerId || queryId || '0', 10);
  return parsed > 0 ? parsed : null;
}

// Helper to format rows with numbers
function sanitizeTransaction(row) {
  return {
    ...row,
    amount: parseFloat(row.amount),
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date)
  };
}

// -------------------------------------------------------------
// 🔐 AUTHENTICATION & USER MANAGEMENT
// -------------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account already exists with this email. Please log in.' });
    }

    const { salt, hash } = hashPassword(password);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash, salt, monthly_income_target)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), cleanEmail, hash, salt, 5000.00]
    );

    const newUserId = result.insertId;

    // Create default category budgets for this new user
    const defaultBudgets = [
      [newUserId, 'Housing & Utilities', 1800.00, 0.90],
      [newUserId, 'Groceries & Dining', 800.00, 0.80],
      [newUserId, 'Transportation', 350.00, 0.85],
      [newUserId, 'Entertainment & Tech', 300.00, 0.75],
      [newUserId, 'Health & Wellness', 250.00, 0.80],
      [newUserId, 'Shopping & Gear', 400.00, 0.80]
    ];
    await db.query(
      'INSERT INTO budgets (user_id, category, monthly_limit, alert_threshold) VALUES ?',
      [defaultBudgets]
    );

    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [newUserId, 'USER_REGISTERED', `New user registered: ${name} (${cleanEmail})`]
    );

    res.status(201).json({
      success: true,
      user: {
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        monthly_income_target: 5000.00
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'No account found with this email. Please create an account.' });
    }

    const user = rows[0];
    const isMatch = verifyPassword(password, user.salt, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    await db.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'USER_LOGIN', `User logged in: ${user.name} (${user.email})`]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthly_income_target: parseFloat(user.monthly_income_target || 5000.00)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const [rows] = await db.query('SELECT id, name, email, monthly_income_target, created_at FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 💳 TRANSACTIONS (User Scoped)
// -------------------------------------------------------------
app.get('/api/transactions', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json([]); // Return empty array if not logged in

    const { type, category, search, limit = 100 } = req.query;
    let query = `SELECT * FROM transactions WHERE user_id = ?`;
    const params = [userId];

    if (type && type !== 'all') {
      query += ` AND type = ?`;
      params.push(type);
    }
    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }
    if (search) {
      query += ` AND (merchant LIKE ? OR notes LIKE ? OR tags LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY date DESC, id DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const [rows] = await db.query(query, params);
    res.json(rows.map(sanitizeTransaction));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Please log in to save transactions' });

    const {
      type = 'expense',
      amount,
      currency = 'INR',
      category = 'Groceries & Dining',
      merchant = 'General Merchant',
      date = new Date().toISOString().split('T')[0],
      payment_method = 'UPI',
      notes = '',
      tags = [],
      is_tax_deductible = 0
    } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'Valid numeric amount is required' });
    }

    const tagsJson = typeof tags === 'string' ? tags : JSON.stringify(tags || []);

    const [result] = await db.query(
      `INSERT INTO transactions (
        user_id, type, amount, currency, category, merchant, date, payment_method, notes, tags, is_tax_deductible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        type,
        parseFloat(amount),
        currency,
        category,
        merchant,
        date,
        payment_method,
        notes,
        tagsJson,
        is_tax_deductible ? 1 : 0
      ]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)`,
      [userId, 'TRANSACTION_CREATED', `Logged ${type} of $${parseFloat(amount).toFixed(2)} at ${merchant} (MySQL record #${result.insertId})`]
    );

    const [createdRows] = await db.query(`SELECT * FROM transactions WHERE id = ?`, [result.insertId]);
    res.status(201).json(sanitizeTransaction(createdRows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const [txRows] = await db.query(`SELECT * FROM transactions WHERE id = ? AND user_id = ?`, [id, userId]);
    await db.query(`DELETE FROM transactions WHERE id = ? AND user_id = ?`, [id, userId]);

    if (txRows.length > 0) {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)`,
        [userId, 'TRANSACTION_DELETED', `Deleted transaction #${id} ($${txRows[0].amount} at ${txRows[0].merchant}) from MySQL`]
      );
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 📊 BUDGETS (User Scoped)
// -------------------------------------------------------------
app.get('/api/budgets', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json([]);

    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7);

    const [budgets] = await db.query(`SELECT * FROM budgets WHERE user_id = ? ORDER BY category ASC`, [userId]);
    const [spendByCategory] = await db.query(
      `SELECT category, SUM(amount) as total_spent
       FROM transactions
       WHERE user_id = ? AND type = 'expense' AND date LIKE ?
       GROUP BY category`,
      [userId, `${currentMonthPrefix}%`]
    );

    const spendMap = {};
    for (const s of spendByCategory) {
      spendMap[s.category] = parseFloat(s.total_spent);
    }

    const merged = budgets.map(b => {
      const spent = spendMap[b.category] || 0;
      const limit = parseFloat(b.monthly_limit);
      return {
        ...b,
        monthly_limit: limit,
        spent: Math.round(spent * 100) / 100,
        percent: limit > 0 ? Math.min(200, Math.round((spent / limit) * 100)) : 0
      };
    });

    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { category, monthly_limit, alert_threshold = 0.85 } = req.body;
    await db.query(
      `INSERT INTO budgets (user_id, category, monthly_limit, alert_threshold)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         monthly_limit = VALUES(monthly_limit),
         alert_threshold = VALUES(alert_threshold)`,
      [userId, category, parseFloat(monthly_limit), parseFloat(alert_threshold)]
    );

    res.json({ success: true, category, monthly_limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 🔁 SUBSCRIPTIONS (User Scoped)
// -------------------------------------------------------------
app.get('/api/subscriptions', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json([]);

    const [subs] = await db.query(`SELECT * FROM recurring_subscriptions WHERE user_id = ? ORDER BY next_billing_date ASC`, [userId]);
    const sanitized = subs.map(s => ({
      ...s,
      amount: parseFloat(s.amount),
      next_billing_date: s.next_billing_date instanceof Date ? s.next_billing_date.toISOString().split('T')[0] : String(s.next_billing_date)
    }));
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscriptions', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, amount, billing_cycle = 'Monthly', category = 'Entertainment & Tech', next_billing_date } = req.body;
    const [result] = await db.query(
      `INSERT INTO recurring_subscriptions (user_id, name, amount, billing_cycle, category, next_billing_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, parseFloat(amount), billing_cycle, category, next_billing_date]
    );

    const [created] = await db.query(`SELECT * FROM recurring_subscriptions WHERE id = ?`, [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subscriptions/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    await db.query(`DELETE FROM recurring_subscriptions WHERE id = ? AND user_id = ?`, [id, userId]);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 🧠 AI ENDPOINTS (User Scoped)
// -------------------------------------------------------------
app.post('/api/ai/parse', (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Text prompt required' });
    const parsed = parseExpenseNLP(prompt);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/receipt', (req, res) => {
  try {
    const { rawText } = req.body;
    const parsed = parseReceipt(rawText);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai/insights', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.json({
        healthScore: 100,
        safeToSpendDaily: 0,
        totalExpenseMonth: 0,
        totalIncomeMonth: 0,
        totalMonthlySubs: 0,
        budgetAlerts: [],
        recommendations: [{ title: 'Welcome', desc: 'Please log in or enroll your first expense to begin.', tone: 'positive' }]
      });
    }

    const insights = await generateAuraInsights(db, userId);
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const userId = getUserId(req) || 1;
    const { message } = req.body;
    const response = await askAuraAdvisor(message, db, userId);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/simulate', async (req, res) => {
  try {
    const userId = getUserId(req) || 1;
    const simulationResult = await simulateWhatIfScenario(req.body, db, userId);
    res.json(simulationResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 📁 CSV IMPORTER (User Scoped)
// -------------------------------------------------------------
app.post('/api/import/parse-csv', (req, res) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) return res.status(400).json({ error: 'CSV file text is required' });
    const parsed = batchCategorizeCSV(csvContent);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/import/batch-commit', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Please log in to import statements' });

    const { transactions = [] } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'No transactions selected for import' });
    }

    const rows = transactions.map(t => [
      userId,
      t.type || 'expense',
      parseFloat(t.amount) || 0,
      'USD',
      t.category || 'Groceries & Dining',
      t.merchant || 'Bank Import',
      t.date || new Date().toISOString().split('T')[0],
      t.payment_method || 'Card',
      t.raw_desc || 'Imported via CSV statement',
      JSON.stringify(['csv-import', ...(t.is_tax_deductible ? ['tax'] : [])]),
      t.is_tax_deductible ? 1 : 0
    ]);

    await db.query(
      `INSERT INTO transactions (user_id, type, amount, currency, category, merchant, date, payment_method, notes, tags, is_tax_deductible)
       VALUES ?`,
      [rows]
    );

    await db.query(
      `INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)`,
      [userId, 'CSV_BULK_IMPORTED', `Batch imported ${rows.length} transactions from bank CSV into MySQL`]
    );

    res.json({ success: true, count: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 📅 CASHFLOW CALENDAR (User Scoped)
// -------------------------------------------------------------
app.get('/api/calendar/month', async (req, res) => {
  try {
    const userId = getUserId(req);
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const month = parseInt(req.query.month || (new Date().getMonth() + 1), 10);
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month, 0).getDate();

    const daysMap = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      daysMap[dateStr] = {
        date: dateStr,
        day,
        totalIncome: 0,
        totalExpense: 0,
        transactions: [],
        renewals: []
      };
    }

    if (userId) {
      const [txRows] = await db.query(
        `SELECT id, type, amount, category, merchant, date, notes
         FROM transactions
         WHERE user_id = ? AND date LIKE ?
         ORDER BY date ASC, id ASC`,
        [userId, `${monthPrefix}%`]
      );

      const [subRows] = await db.query(`SELECT * FROM recurring_subscriptions WHERE user_id = ? AND status = 'active'`, [userId]);

      for (const tx of txRows) {
        const dStr = tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : String(tx.date);
        if (daysMap[dStr]) {
          const amt = parseFloat(tx.amount);
          if (tx.type === 'expense') daysMap[dStr].totalExpense += amt;
          else daysMap[dStr].totalIncome += amt;
          daysMap[dStr].transactions.push({ ...tx, amount: amt });
        }
      }

      for (const sub of subRows) {
        const subDate = sub.next_billing_date instanceof Date ? sub.next_billing_date.toISOString().split('T')[0] : String(sub.next_billing_date);
        const subDay = parseInt(subDate.split('-')[2] || '1', 10);
        const targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(Math.min(subDay, daysInMonth)).padStart(2, '0')}`;
        if (daysMap[targetDateStr]) {
          daysMap[targetDateStr].renewals.push({ ...sub, amount: parseFloat(sub.amount) });
        }
      }
    }

    res.json({
      year,
      month,
      daysInMonth,
      calendarDays: Object.values(daysMap)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 🔍 SQL DATABASE EXPLORER (Read-Only)
// -------------------------------------------------------------
app.post('/api/sql/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'SQL query string is required' });
    }

    const trimmed = query.trim();
    const isSafeRead = /^(SELECT|SHOW|EXPLAIN|DESCRIBE)\b/i.test(trimmed);

    if (!isSafeRead) {
      return res.status(403).json({ error: 'SQL Explorer only permits read-only (SELECT / SHOW / DESCRIBE / EXPLAIN) queries for data safety.' });
    }

    const startTime = performance.now();
    const [rows] = await db.query(trimmed);
    const executionTimeMs = (performance.now() - startTime).toFixed(2);

    const safeRows = Array.isArray(rows) ? rows.map(r => {
      const copy = { ...r };
      for (const k of Object.keys(copy)) {
        if (copy[k] instanceof Date) {
          copy[k] = copy[k].toISOString().split('T')[0];
        }
      }
      return copy;
    }) : [];

    res.json({
      rows: safeRows,
      rowCount: safeRows.length,
      executionTimeMs,
      columns: safeRows.length > 0 ? Object.keys(safeRows[0]) : []
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/sql/tables', async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || 'safespend_vault';
    const [tables] = await db.query(`
      SELECT TABLE_NAME as name, TABLE_TYPE as type
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY TABLE_NAME ASC
    `, [dbName]);

    const tableStats = [];
    for (const t of tables) {
      const [countRows] = await db.query(`SELECT count(*) as cnt FROM \`${t.name}\``);
      tableStats.push({
        name: t.name,
        type: t.type,
        rowCount: countRows[0].cnt
      });
    }

    res.json(tableStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🛡️ SafeSpend AI Backend running on http://localhost:${PORT}`);
  console.log(`🐬 MySQL Connected: ${process.env.DB_USER || 'root'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'safespend_vault'}`);
});
