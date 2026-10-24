import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DonutChart, TrendChart } from './components/Charts';
import { QuickAddModal } from './components/QuickAddModal';
import { SqlExplorerModal } from './components/SqlExplorerModal';
import { AuraAdvisorDrawer } from './components/AuraAdvisorDrawer';
import { VaultPinModal } from './components/VaultPinModal';
import { BudgetSubscriptionsView } from './components/BudgetSubscriptionsView';
import {
  ShieldCheck,
  TrendingUp,
  Wallet,
  Sparkles,
  Search,
  Filter,
  Trash2,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Database
} from 'lucide-react';

export function App() {
  // Data states
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [profile, setProfile] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Modals & Panels
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSqlExplorerOpen, setIsSqlExplorerOpen] = useState(false);
  const [isAuraOpen, setIsAuraOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Security
  const [discreetMode, setDiscreetMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [txRes, bRes, subRes, insRes, secRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/budgets'),
        fetch('/api/subscriptions'),
        fetch('/api/ai/insights'),
        fetch('/api/security/profile')
      ]);

      const [txData, bData, subData, insData, secData] = await Promise.all([
        txRes.json(),
        bRes.json(),
        subRes.json(),
        insRes.json(),
        secRes.json()
      ]);

      setTransactions(txData);
      setBudgets(bData);
      setSubscriptions(subData);
      setInsights(insData);
      setProfile(secData);

      if (secData.hasPin && secData.privacyMode) {
        setIsLocked(true);
      }
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    }
  };

  const handleTransactionCreated = () => {
    fetchAllData();
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction from your local SQL vault?')) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      fetchAllData();
    } catch (err) {
      alert('Error deleting transaction: ' + err.message);
    }
  };

  const handleUpdateBudget = async (category, monthly_limit) => {
    try {
      await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, monthly_limit })
      });
      fetchAllData();
    } catch (err) {
      alert('Error updating budget: ' + err.message);
    }
  };

  const handleAddSubscription = async (sub) => {
    try {
      await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });
      fetchAllData();
    } catch (err) {
      alert('Error adding subscription: ' + err.message);
    }
  };

  const handleDeleteSubscription = async (id) => {
    try {
      await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      fetchAllData();
    } catch (err) {
      alert('Error removing subscription: ' + err.message);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = !searchQuery ||
      t.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesType = selectedType === 'all' || t.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Calculate totals
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Spending by category for Donut chart
  const categorySpendMap = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categorySpendMap[t.category] = (categorySpendMap[t.category] || 0) + t.amount;
  });
  const donutData = Object.entries(categorySpendMap).map(([category, amount]) => ({ category, amount }));

  return (
    <div className={discreetMode ? 'discreet-mode' : ''} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        discreetMode={discreetMode}
        setDiscreetMode={setDiscreetMode}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenSqlExplorer={() => setIsSqlExplorerOpen(true)}
        onOpenAura={() => setIsAuraOpen(true)}
        onOpenPinModal={() => setIsPinModalOpen(true)}
        isLocked={isLocked}
        healthScore={insights?.healthScore}
      />

      <main className="app-container">
        {/* Safety & Local Sovereignty Guarantee Ribbon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(16, 185, 129, 0.07)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '14px',
          padding: '12px 18px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="#10b981" />
            <div>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc' }}>
                Bank-Grade Privacy & Local SQL Storage Active
              </span>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                All transaction ledgers are stored directly in your local MySQL database: <code>safespend_vault</code>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
              <CheckCircle2 size={12} /> MySQL 8.0 Server
            </span>
            <button
              onClick={() => setIsSqlExplorerOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '0.74rem',
                color: '#38bdf8',
                cursor: 'pointer'
              }}
            >
              Verify DB Tables
            </button>
          </div>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid-kpis">
          {/* Card 1: Net Vault Balance */}
          <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Vault Net Balance
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={16} color="#10b981" />
              </div>
            </div>
            <div className="sensitive-value" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
              ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={14} /> Total Income: ${totalIncome.toFixed(0)}
            </div>
          </div>

          {/* Card 2: Monthly Outflow */}
          <div className="glass-panel" style={{ padding: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Recorded Outflow
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowDownRight size={16} color="#f43f5e" />
              </div>
            </div>
            <div className="sensitive-value" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
              ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              Across {transactions.filter(t => t.type === 'expense').length} logged purchases
            </div>
          </div>

          {/* Card 3: Safe-to-Spend Daily Allowance */}
          <div className="glass-panel" style={{ padding: '20px', position: 'relative', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Safe-to-Spend Today
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="#06b6d4" />
              </div>
            </div>
            <div className="sensitive-value" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
              ${insights ? insights.safeToSpendDaily.toFixed(2) : '---'}
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>/day</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
              AI calculated for {insights?.daysRemaining || 7} days left
            </div>
          </div>

          {/* Card 4: Aura Financial Health Score */}
          <div className="glass-panel" style={{ padding: '20px', position: 'relative', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Financial Health Score
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color="#8b5cf6" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc' }}>
                {insights ? insights.healthScore : 90}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 100</span>
              <span className="badge badge-emerald" style={{ marginLeft: 'auto', fontSize: '0.72rem' }}>
                Optimal
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              {insights?.budgetAlerts?.length ? `${insights.budgetAlerts.length} budget warnings` : 'No budget overruns detected'}
            </div>
          </div>
        </div>

        {/* AI Recommendations Pulse */}
        {insights?.recommendations && insights.recommendations.length > 0 && (
          <div style={{
            background: 'rgba(139, 92, 246, 0.07)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} color="#ffffff" />
              </div>
              <div>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                  Aura Pulse: {insights.recommendations[0].title}
                </span>
                <p style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                  {insights.recommendations[0].desc}
                </p>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setIsAuraOpen(true)}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              Consult Aura AI →
            </button>
          </div>
        )}

        {/* Main 2-Column Dashboard Grid */}
        <div className="grid-main">
          {/* LEFT COLUMN: Visuals & Transactions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Visual Analytics Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#f8fafc' }}>Cashflow & Spending Breakdown</h3>
                  <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Real-time distribution across active categories</p>
                </div>
              </div>

              {/* Donut Chart */}
              <DonutChart data={donutData} total={totalExpense} currency="$" />

              {/* Trend Chart */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                  10-Day Spending Outflow Velocity
                </span>
                <TrendChart transactions={transactions} currency="$" />
              </div>
            </div>

            {/* Transactions Ledger Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>Local SQL Ledger</h3>
                  <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                    Showing {filteredTransactions.length} of {transactions.length} entries
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      placeholder="Search memo, vendor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        padding: '7px 12px 7px 30px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      padding: '7px 10px',
                      background: '#0d1326',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value="all">All Categories</option>
                    <option value="Groceries & Dining">Groceries & Dining</option>
                    <option value="Housing & Utilities">Housing & Utilities</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Entertainment & Tech">Entertainment & Tech</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Shopping & Gear">Shopping & Gear</option>
                    <option value="Salary & Earnings">Salary & Earnings</option>
                  </select>

                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{
                      padding: '7px 10px',
                      background: '#0d1326',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value="all">All Types</option>
                    <option value="expense">Expenses Only</option>
                    <option value="income">Income Only</option>
                  </select>
                </div>
              </div>

              {/* Transactions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                {filteredTransactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>No transactions found for current filter.</p>
                    <button className="btn btn-primary" onClick={() => setIsQuickAddOpen(true)} style={{ fontSize: '0.8rem' }}>
                      + Log a Transaction
                    </button>
                  </div>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    let parsedTags = [];
                    try {
                      parsedTags = typeof tx.tags === 'string' ? JSON.parse(tx.tags) : (tx.tags || []);
                    } catch (e) {
                      parsedTags = [];
                    }

                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          background: 'rgba(255, 255, 255, 0.025)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: isExpense ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {isExpense ? (
                              <ArrowDownRight size={18} color="#f43f5e" />
                            ) : (
                              <ArrowUpRight size={18} color="#10b981" />
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4 style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 600 }}>
                                {tx.merchant || 'General Merchant'}
                              </h4>
                              {Boolean(tx.is_tax_deductible) && (
                                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                                  Tax Deductible
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                              <span>{tx.category}</span> • <span>{tx.date}</span> • <span>{tx.payment_method}</span>
                              {tx.notes && <span style={{ color: '#64748b' }}>— "{tx.notes}"</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div className="sensitive-value" style={{
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            color: isExpense ? '#f43f5e' : '#34d399',
                            textAlign: 'right'
                          }}>
                            {isExpense ? '-' : '+'}${tx.amount.toFixed(2)}
                          </div>

                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            title="Delete transaction"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Budgets, Subscriptions, AI Fast Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quick AI Trigger Card */}
            <div className="glass-panel" style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Sparkles size={18} color="#10b981" />
                <h4 style={{ fontSize: '0.98rem', color: '#f8fafc', fontWeight: 700 }}>Magic Fast Log</h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '14px' }}>
                Natural language parsing automatically structures amount, category, and tax flags into your local SQLite vault.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsQuickAddOpen(true)}
                  style={{ flex: 1, fontSize: '0.82rem', padding: '8px 12px' }}
                >
                  <Sparkles size={14} /> Open Magic Logger
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsSqlExplorerOpen(true)}
                  style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                >
                  <Database size={14} /> SQL Console
                </button>
              </div>
            </div>

            {/* Budgets & Subscriptions Component */}
            <BudgetSubscriptionsView
              budgets={budgets}
              subscriptions={subscriptions}
              onUpdateBudget={handleUpdateBudget}
              onAddSubscription={handleAddSubscription}
              onDeleteSubscription={handleDeleteSubscription}
              currency="$"
            />
          </div>
        </div>
      </main>

      {/* MODALS */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onTransactionCreated={handleTransactionCreated}
      />

      <SqlExplorerModal
        isOpen={isSqlExplorerOpen}
        onClose={() => setIsSqlExplorerOpen(false)}
      />

      <AuraAdvisorDrawer
        isOpen={isAuraOpen}
        onClose={() => setIsAuraOpen(false)}
        insights={insights}
        onRefresh={fetchAllData}
      />

      <VaultPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        hasPin={profile?.hasPin}
        isLocked={isLocked}
        onUnlock={() => setIsLocked(false)}
        onPinUpdated={fetchAllData}
      />
    </div>
  );
}
export default App;
