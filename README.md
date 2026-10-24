# 🛡️ SafeSpend AI — Privacy-First AI Expense Tracker & Local SQL Vault

SafeSpend AI is a next-generation personal expense tracker combining **Context-Aware AI Intelligence** with **Zero-Knowledge Data Sovereignty & Local SQLite Storage**.

---

## ✨ Key Features & Unique Capabilities

### 1. 🛡️ Bank-Grade Privacy & Local SQL Data Sovereignty
- **Native SQLite Database**: All records are stored directly in your local `server/data/vault.db` using Node's high-performance native `node:sqlite` engine.
- **SQL Explorer & Transparent Query Runner**: Inspect raw database tables (`transactions`, `budgets`, `recurring_subscriptions`, `audit_logs`), view schemas, and run read-only `SELECT` queries with instant execution timing.
- **Discreet Privacy Mode**: One-click screen balance masking that blurs financial numbers when working in public or shared spaces.
- **Vault PIN Lock**: 4-digit client-side PIN security for your financial dashboard.
- **Full Database Export**: Instant JSON backup export anytime.

### 2. 🧠 Magic AI Quick Logger & OCR Scanner
- **Natural Language Parsing (NLP)**: Type plain English sentences like:
  - *"Dinner with team at Chipotle $38.40 on Card #team"*
  - *"Spent $65 at Shell for gas on Apple Pay"*
  - *"Blue Bottle iced latte and croissant $14.50"*
  - *"Received freelance client payout $850 #freelance #tax"*
  - AI extracts amount, category, merchant, payment method, date, and tax deduction status automatically.
- **Smart Receipt / Bill Scanner**: Paste itemized receipt text or load preset receipts to parse line items, tax amount, and vendor total.

### 3. 🤖 Aura AI Financial Guardian
- **Daily Safe-to-Spend**: Real-time calculated daily allowance based on your monthly income target, existing commitments, and remaining days in the cycle.
- **Financial Health Score (0–100)**: Proactive score measuring your budget adherence, savings rate, and recurring subscription burden.
- **Conversational Advisor**: Ask questions such as *"Can I afford a $280 weekend trip?"*, *"Where can I cut $150?"*, or *"Audit my subscriptions"*.

### 4. 📊 High-Performance Visual Analytics
- **Donut Spending Breakdown**: Real-time category allocation.
- **10-Day Cashflow Velocity Trend**: Canvas-rendered bar chart showing spending patterns.
- **Budgets & Recurring Subscriptions Tracker**: Visual burn-up progress meters with warning thresholds and renewal countdowns.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v22+ (v26 recommended, includes built-in `node:sqlite`)
- **NPM**

### 2. Running Locally

The application is already running!
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API & SQLite Engine**: [http://localhost:5000](http://localhost:5000)

To start manually in the future:
```bash
# Start backend server
node server/index.js

# Start frontend (in a separate terminal)
npm --prefix client run dev
```

---

## 📂 Architecture Overview

```
├── server/
│   ├── db.js            # Native node:sqlite schema, tables & initial seeds
│   ├── aiEngine.js      # NLP parser, receipt parser & Aura financial advisor
│   ├── index.js         # Express REST API & SQL Explorer query execution
│   └── data/
│       └── vault.db     # Local SQLite database file
├── client/
│   ├── index.html       # HTML entry point with Outfit & JetBrains Mono typography
│   ├── src/
│   │   ├── App.jsx      # Main glassmorphic dashboard
│   │   ├── index.css    # Premium CSS design system, dark glassmorphism & neon glows
│   │   └── components/
│   │       ├── Navbar.jsx                   # Navigation, Discreet Mode & Lock toggles
│   │       ├── Charts.jsx                   # Canvas-powered Donut and Velocity trend charts
│   │       ├── QuickAddModal.jsx            # Magic AI NLP & Receipt Scanner modal
│   │       ├── SqlExplorerModal.jsx         # Transparent SQLite Table & Query Explorer
│   │       ├── AuraAdvisorDrawer.jsx        # Conversational AI Financial Coach chat
│   │       ├── VaultPinModal.jsx            # 4-Digit Security PIN Lock modal
│   │       └── BudgetSubscriptionsView.jsx  # Category budget meters & subscriptions
```
