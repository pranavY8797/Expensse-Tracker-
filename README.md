# 🛡️ SafeSpend AI — Privacy-First AI Expense Tracker & MySQL 8.0 Vault

SafeSpend AI is a next-generation personal expense tracker combining **Context-Aware AI Intelligence** with **Enterprise MySQL 8.0 Data Sovereignty**.

---

## ✨ Key Features & Unique Capabilities

### 1. 🛡️ Bank-Grade Privacy & Real MySQL 8.0 Sovereignty
- **Native MySQL 8.0 Connection Pool**: All records are stored directly on your local MySQL server (`localhost:3306`, database: `safespend_vault`) using secure connection pooling and parameterized SQL queries.
- **SQL Explorer & Transparent Query Runner**: Inspect raw database tables (`transactions`, `budgets`, `recurring_subscriptions`, `audit_logs`, `user_profile`), view schemas, and run read-only `SELECT` queries with instant execution timing.
- **Discreet Privacy Mode**: One-click screen balance masking that blurs financial numbers when working in public or shared spaces.
- **Vault PIN Lock**: 4-digit client-side PIN security for your financial dashboard.
- **Full Database Export**: Instant JSON/SQL backup export anytime.

### 2. 📁 Bank Statement CSV Bulk Importer *(NEW)*
- **Drag-and-Drop Statement Ingestion**: Upload bank CSV export statements (Chase, BoA, Revolut, Stripe, etc.) or select built-in sample presets.
- **Batch AI Auto-Categorization**: Simultaneously classifies transaction rows, detects merchants, tags deductible expenses, and calculates confidence scores.
- **Selective Batch Commit**: Review parsed records, toggle selections, and insert clean records in bulk directly into MySQL with an audit trail.

### 3. 🔮 "What If?" Financial Simulator *(NEW)*
- **Pre-Purchase Impact Analysis**: Test prospective large purchases (e.g. MacBook Pro, vacations, gym memberships) or monthly installment plans before spending.
- **Dynamic Cashflow Forecasting**: Calculates the exact impact on your **Daily Safe-to-Spend allowance**, **Financial Health Score**, and **Category Budget Burn**.
- **Aura AI Verdict**: Gives clear green/caution/stressed recommendations and actionable savings advice.
- **Planned Purchase Commitment**: One-click save to schedule approved simulations into your MySQL vault.

### 4. 📅 Cashflow Calendar & Subscription Renewal View *(NEW)*
- **Interactive Monthly Grid**: View your entire month with daily inflow badges (`+$3,200`), expense badges (`-$65`), and subscription renewal deadlines.
- **Recurring Renewal Alerts**: Visual pills showing exact billing dates for Netflix, Spotify, Gym, ChatGPT, and utility bills.
- **Day Inspector Drawer**: Click any calendar day to inspect every transaction and scheduled bill occurring on that date.

### 5. 🧠 Magic AI Quick Logger & OCR Scanner
- **Natural Language Parsing (NLP)**: Type plain conversational English (e.g. *"Dinner with team at Chipotle $38.40 on Card #team"* or *"35 bucks gas at Shell yesterday"*).
- **Smart Receipt / Bill Scanner**: Paste itemized receipt text or load preset receipts to parse line items, tax amount, and vendor total.

### 6. 🤖 Aura AI Financial Guardian
- **Daily Safe-to-Spend**: Real-time calculated daily allowance taking into account commitments and remaining days in the cycle.
- **Financial Health Score (0–100)**: Evaluates budget adherence, savings rate, and recurring subscription burdens.
- **Conversational Advisor**: Ask questions such as *"Can I afford a $280 weekend trip?"*, *"Where can I cut $150?"*, or *"Audit my subscriptions"*.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v22+
- **MySQL Server 8.0**: Running locally on `localhost:3306` (Default Database: `safespend_vault`)

### 2. Configuration (`.env`)
```ini
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=safespend_vault
```

### 3. Running Locally

The application is already running!
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API & MySQL Engine**: [http://localhost:5000](http://localhost:5000)

To start manually in the future:
```bash
# Start backend server
node server/index.js

# Start frontend (in a separate terminal)
npm --prefix client run dev
```

### 4. Inspect Data on MySQL Command Line
Run the included batch script or npm command:
```bash
npm run mysql
```
Or with `mysql.exe`:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot safespend_vault
```
```sql
SHOW TABLES;
SELECT * FROM transactions ORDER BY id DESC LIMIT 10;
```
