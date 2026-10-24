import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDbPool, initDatabase } from './db.js';
import { parseExpenseNLP, parseReceipt, generateAuraInsights, askAuraAdvisor } from './aiEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize MySQL schema & seed data
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

// Helper to format rows with numbers
function sanitizeTransaction(row) {
  return {
    ...row,
    amount: parseFloat(row.amount),
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date)
  };
}

// -------------------------------------------------------------
// TRANSACTIONS
// -------------------------------------------------------------
app.get('/api/transactions', async (req, res) => {
  try {
    const { type, category, search, limit = 100 } = req.query;
    let query = `SELECT * FROM transactions WHERE 1=1`;
    const params = [];

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
    const {
      type = 'expense',
      amount,
      currency = 'USD',
      category = 'Groceries & Dining',
      merchant = 'General Merchant',
      date = new Date().toISOString().split('T')[0],
      payment_method = 'Card',
      notes = '',
      tags = [],
      is_tax_deductible = 0,
      receipt_data = null
    } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'Valid numeric amount is required' });
    }

    const tagsJson = typeof tags === 'string' ? tags : JSON.stringify(tags || []);

    const [result] = await db.query(
      `INSERT INTO transactions (
        type, amount, currency, category, merchant, date, payment_method, notes, tags, is_tax_deductible, receipt_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type,
        parseFloat(amount),
        currency,
        category,
        merchant,
        date,
        payment_method,
        notes,
        tagsJson,
        is_tax_deductible ? 1 : 0,
        receipt_data
      ]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (action, details) VALUES (?, ?)`,
      ['TRANSACTION_CREATED', `Logged ${type} of $${parseFloat(amount).toFixed(2)} at ${merchant} (MySQL record #${result.insertId})`]
    );

    const [createdRows] = await db.query(`SELECT * FROM transactions WHERE id = ?`, [result.insertId]);
    res.status(201).json(sanitizeTransaction(createdRows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      amount,
      category,
      merchant,
      date,
      payment_method,
      notes,
      tags,
      is_tax_deductible
    } = req.body;

    const tagsJson = typeof tags === 'string' ? tags : JSON.stringify(tags || []);

    await db.query(
      `UPDATE transactions
       SET type = ?, amount = ?, category = ?, merchant = ?, date = ?, payment_method = ?, notes = ?, tags = ?, is_tax_deductible = ?
       WHERE id = ?`,
      [
        type,
        parseFloat(amount),
        category,
        merchant,
        date,
        payment_method,
        notes,
        tagsJson,
        is_tax_deductible ? 1 : 0,
        id
      ]
    );

    await db.query(
      `INSERT INTO audit_logs (action, details) VALUES (?, ?)`,
      ['TRANSACTION_UPDATED', `Updated transaction #${id} in MySQL`]
    );

    const [updated] = await db.query(`SELECT * FROM transactions WHERE id = ?`, [id]);
    res.json(sanitizeTransaction(updated[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [txRows] = await db.query(`SELECT * FROM transactions WHERE id = ?`, [id]);
    await db.query(`DELETE FROM transactions WHERE id = ?`, [id]);

    if (txRows.length > 0) {
      await db.query(
        `INSERT INTO audit_logs (action, details) VALUES (?, ?)`,
        ['TRANSACTION_DELETED', `Deleted transaction #${id} ($${txRows[0].amount} at ${txRows[0].merchant}) from MySQL`]
      );
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// BUDGETS
// -------------------------------------------------------------
app.get('/api/budgets', async (req, res) => {
  try {
    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7);

    const [budgets] = await db.query(`SELECT * FROM budgets ORDER BY category ASC`);
    const [spendByCategory] = await db.query(
      `SELECT category, SUM(amount) as total_spent
       FROM transactions
       WHERE type = 'expense' AND date LIKE ?
       GROUP BY category`,
      [`${currentMonthPrefix}%`]
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
    const { category, monthly_limit, alert_threshold = 0.85 } = req.body;
    await db.query(
      `INSERT INTO budgets (category, monthly_limit, alert_threshold)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         monthly_limit = VALUES(monthly_limit),
         alert_threshold = VALUES(alert_threshold)`,
      [category, parseFloat(monthly_limit), parseFloat(alert_threshold)]
    );

    await db.query(
      `INSERT INTO audit_logs (action, details) VALUES (?, ?)`,
      ['BUDGET_UPDATED', `Set MySQL budget for ${category} to $${parseFloat(monthly_limit).toFixed(2)}`]
    );

    res.json({ success: true, category, monthly_limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// SUBSCRIPTIONS
// -------------------------------------------------------------
app.get('/api/subscriptions', async (req, res) => {
  try {
    const [subs] = await db.query(`SELECT * FROM recurring_subscriptions ORDER BY next_billing_date ASC`);
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
    const { name, amount, billing_cycle = 'Monthly', category = 'Entertainment & Tech', next_billing_date } = req.body;
    const [result] = await db.query(
      `INSERT INTO recurring_subscriptions (name, amount, billing_cycle, category, next_billing_date)
       VALUES (?, ?, ?, ?, ?)`,
      [name, parseFloat(amount), billing_cycle, category, next_billing_date]
    );

    await db.query(
      `INSERT INTO audit_logs (action, details) VALUES (?, ?)`,
      ['SUBSCRIPTION_ADDED', `Added subscription ${name} ($${parseFloat(amount).toFixed(2)}) to MySQL`]
    );

    const [created] = await db.query(`SELECT * FROM recurring_subscriptions WHERE id = ?`, [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM recurring_subscriptions WHERE id = ?`, [id]);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// AI INTEGRATION
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
    const insights = await generateAuraInsights(db);
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await askAuraAdvisor(message, db);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// SECURITY & PRIVACY
// -------------------------------------------------------------
app.get('/api/security/profile', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM user_profile WHERE id = 1`);
    const profile = rows[0] || {};
    res.json({
      hasPin: Boolean(profile.vault_pin),
      privacyMode: Boolean(profile.privacy_mode),
      currencySymbol: profile.currency_symbol || '$',
      monthlyIncomeTarget: parseFloat(profile.monthly_income_target || 6500),
      databaseType: 'MySQL Server 8.0',
      databaseName: process.env.DB_NAME || 'safespend_vault',
      lastBackup: profile.last_backup
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/security/pin', async (req, res) => {
  try {
    const { pin, action = 'set' } = req.body;
    const [rows] = await db.query(`SELECT * FROM user_profile WHERE id = 1`);
    const profile = rows[0];

    if (action === 'verify') {
      const isMatch = profile && profile.vault_pin === pin;
      return res.json({ success: isMatch });
    }

    await db.query(`UPDATE user_profile SET vault_pin = ? WHERE id = 1`, [pin]);
    await db.query(
      `INSERT INTO audit_logs (action, details) VALUES (?, ?)`,
      ['VAULT_PIN_CHANGED', pin ? 'Vault 4-digit security PIN enabled' : 'Vault PIN removed']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/security/toggle-privacy', async (req, res) => {
  try {
    const { privacyMode } = req.body;
    await db.query(`UPDATE user_profile SET privacy_mode = ? WHERE id = 1`, [privacyMode ? 1 : 0]);
    res.json({ success: true, privacyMode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/audit-logs', async (req, res) => {
  try {
    const [logs] = await db.query(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50`);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// SQL DATABASE EXPLORER (Real MySQL Query Console)
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

// Full database backup export as JSON
app.get('/api/export/json', async (req, res) => {
  try {
    const [transactions] = await db.query(`SELECT * FROM transactions`);
    const [budgets] = await db.query(`SELECT * FROM budgets`);
    const [subscriptions] = await db.query(`SELECT * FROM recurring_subscriptions`);
    const [auditLogs] = await db.query(`SELECT * FROM audit_logs`);

    const payload = {
      app: 'SafeSpend AI MySQL Vault',
      databaseEngine: 'MySQL 8.0',
      databaseName: process.env.DB_NAME || 'safespend_vault',
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
      database: {
        transactions,
        budgets,
        subscriptions,
        auditLogs
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="safespend_mysql_backup.json"');
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🛡️ SafeSpend AI Backend running on http://localhost:${PORT}`);
  console.log(`🐬 MySQL Connected: ${process.env.DB_USER || 'root'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'safespend_vault'}`);
});
