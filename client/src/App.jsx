import React, { useState, useEffect } from 'react';
import { AuthView } from './components/AuthView';
import { QuickAddModal } from './components/QuickAddModal';
import { SqlExplorerModal } from './components/SqlExplorerModal';
import { AuraAdvisorDrawer } from './components/AuraAdvisorDrawer';
import { CsvImporterModal } from './components/CsvImporterModal';
import { WhatIfSimulatorModal } from './components/WhatIfSimulatorModal';
import { CashflowCalendarView } from './components/CashflowCalendarView';
import {
  Shield,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  LogOut,
  Database,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Search,
  Filter,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function App() {
  // Current authenticated user
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('safespend_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Active View Tab: 'ledger' | 'calendar'
  const [activeTab, setActiveTab] = useState('ledger');

  // Data states
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [discreetMode, setDiscreetMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSqlExplorerOpen, setIsSqlExplorerOpen] = useState(false);
  const [isAuraOpen, setIsAuraOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState(false);

  // Quick NLP inline bar
  const [inlinePrompt, setInlinePrompt] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-id': String(currentUser?.id || 0)
  });

  const fetchUserData = async () => {
    if (!currentUser?.id) return;
    try {
      const [txRes, insRes] = await Promise.all([
        fetch('/api/transactions', { headers: getHeaders() }),
        fetch('/api/ai/insights', { headers: getHeaders() })
      ]);

      const [txData, insData] = await Promise.all([
        txRes.json(),
        insRes.json()
      ]);

      setTransactions(Array.isArray(txData) ? txData : []);
      setInsights(insData);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const handleLoginSuccess = (user) => {
    localStorage.setItem('safespend_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('safespend_user');
    setCurrentUser(null);
    setTransactions([]);
    setInsights(null);
  };

  // Inline quick NLP logger
  const handleQuickInlineLog = async (e) => {
    e.preventDefault();
    if (!inlinePrompt.trim()) return;
    setIsExtracting(true);
    try {
      // 1. NLP Parse
      const parseRes = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ prompt: inlinePrompt })
      });
      const parsed = await parseRes.json();

      // 2. Insert into MySQL
      const txRes = await fetch('/api/transactions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(parsed)
      });
      if (!txRes.ok) throw new Error('Failed to save to MySQL');

      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      setInlinePrompt('');
      fetchUserData();
    } catch (err) {
      alert('Error logging expense: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction from your MySQL vault?')) return;
    try {
      await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchUserData();
    } catch (err) {
      alert('Error deleting transaction: ' + err.message);
    }
  };

  // If user is not signed in, show clean Auth screen
  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // Calculations
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.merchant?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div className={discreetMode ? 'discreet-mode' : ''} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Clean Streamlined Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(7, 10, 20, 0.95)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)'
          }}>
            <Shield size={20} color="#051b14" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                SafeSpend<span style={{ color: '#10b981' }}>.AI</span>
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                MySQL 8.0 Vault
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Zero Fake Data • Direct MySQL Storage
            </p>
          </div>
        </div>

        {/* User Greeting & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
            👤 {currentUser.name}
          </span>

          <button
            className="btn btn-secondary"
            onClick={() => setDiscreetMode(!discreetMode)}
            title="Privacy Mask (blur numbers on screen)"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
          >
            {discreetMode ? <EyeOff size={15} color="#fbbf24" /> : <Eye size={15} />}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setIsSqlExplorerOpen(true)}
            title="View Real Database Tables in MySQL"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Database size={15} color="#06b6d4" />
            <span>MySQL Explorer</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ padding: '6px 12px', fontSize: '0.78rem', color: '#fb7185' }}
            title="Sign out of account"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1080px', margin: '0 auto', width: '100%', padding: '28px 20px 80px 20px', flex: 1 }}>
        {/* 3 Clean KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {/* Card 1: Balance */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Net Balance
            </span>
            <div className="sensitive-value" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: '6px 0' }}>
              ${netBalance.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Current cashflow delta
            </span>
          </div>

          {/* Card 2: Income */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Total Income
            </span>
            <div className="sensitive-value" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', margin: '6px 0' }}>
              +${totalIncome.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {transactions.filter(t => t.type === 'income').length} deposits recorded
            </span>
          </div>

          {/* Card 3: Outflow */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Total Spent
            </span>
            <div className="sensitive-value" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', margin: '6px 0' }}>
              -${totalExpense.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {transactions.filter(t => t.type === 'expense').length} purchases recorded
            </span>
          </div>
        </div>

        {/* Big Prominent Fast Add Input Bar */}
        <div className="glass-panel" style={{ padding: '18px 20px', marginBottom: '24px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
          <form onSubmit={handleQuickInlineLog} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Log with AI in plain English: 'Dinner at Subway $12.50' or 'Gas 40 bucks' or 'Got paid 3000 salary'..."
                value={inlinePrompt}
                onChange={(e) => setInlinePrompt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(5, 8, 20, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isExtracting || !inlinePrompt.trim()}
              style={{ padding: '12px 20px', fontSize: '0.88rem' }}
            >
              <Sparkles size={16} />
              {isExtracting ? 'Saving to MySQL...' : 'Log with AI'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsQuickAddOpen(true)}
              title="Open full manual form or receipt scanner"
              style={{ padding: '12px 16px', fontSize: '0.88rem' }}
            >
              <Plus size={16} /> Full Form
            </button>
          </form>
        </div>

        {/* Clean Tools & View Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          {/* View Switcher Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('ledger')}
              style={{
                background: activeTab === 'ledger' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${activeTab === 'ledger' ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
                color: activeTab === 'ledger' ? '#34d399' : '#94a3b8',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📋 Transactions Ledger ({transactions.length})
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              style={{
                background: activeTab === 'calendar' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${activeTab === 'calendar' ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)'}`,
                color: activeTab === 'calendar' ? '#38bdf8' : '#94a3b8',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Calendar size={14} /> Cashflow Calendar
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setIsCsvModalOpen(true)}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <FileSpreadsheet size={14} color="#10b981" />
              <span>Import Bank CSV</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => setIsWhatIfModalOpen(true)}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <Sparkles size={14} color="#c084fc" />
              <span>"What If?" Simulator</span>
            </button>

            <button
              className="btn btn-ai"
              onClick={() => setIsAuraOpen(true)}
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              <Sparkles size={14} />
              <span>Aura Advisor</span>
            </button>
          </div>
        </div>

        {/* TAB 1: LEDGER VIEW */}
        {activeTab === 'ledger' && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            {/* Search filter */}
            {transactions.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                  Showing {filteredTransactions.length} of {transactions.length} records in MySQL
                </span>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                  <input
                    type="text"
                    placeholder="Search payee, memo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '6px 10px 6px 30px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* List */}
            {transactions.length === 0 ? (
              /* Clean, encouraging empty state */
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <Wallet size={26} color="#10b981" />
                </div>
                <h4 style={{ fontSize: '1.15rem', color: '#f8fafc', marginBottom: '8px' }}>
                  Your Ledger is Clean & Ready
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8', maxWidth: '420px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
                  No fake or demo data. Enter your real expenses using the quick AI bar above, or click below to fill the manual form.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsQuickAddOpen(true)}
                  style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                >
                  <Plus size={16} /> Log Your First Real Expense
                </button>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '0.85rem' }}>
                No records match your search filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredTransactions.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  return (
                    <div
                      key={tx.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.025)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
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
                            <span style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 600 }}>
                              {tx.merchant || 'Merchant'}
                            </span>
                            <span className="badge badge-emerald" style={{ fontSize: '0.66rem' }}>
                              {tx.category}
                            </span>
                            {Boolean(tx.is_tax_deductible) && (
                              <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>
                                Tax Deductible
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                            <span>{tx.date}</span> • <span>{tx.payment_method}</span>
                            {tx.notes && <span style={{ color: '#64748b' }}> — "{tx.notes}"</span>}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span className="sensitive-value" style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: isExpense ? '#f43f5e' : '#34d399'
                        }}>
                          {isExpense ? '-' : '+'}${tx.amount.toFixed(2)}
                        </span>

                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Delete from MySQL"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CALENDAR VIEW */}
        {activeTab === 'calendar' && (
          <CashflowCalendarView
            currency="$"
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          />
        )}
      </main>

      {/* MODALS */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onTransactionCreated={fetchUserData}
      />

      <CsvImporterModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportComplete={fetchUserData}
      />

      <WhatIfSimulatorModal
        isOpen={isWhatIfModalOpen}
        onClose={() => setIsWhatIfModalOpen(false)}
        onCommitPlannedPurchase={fetchUserData}
      />

      <SqlExplorerModal
        isOpen={isSqlExplorerOpen}
        onClose={() => setIsSqlExplorerOpen(false)}
      />

      <AuraAdvisorDrawer
        isOpen={isAuraOpen}
        onClose={() => setIsAuraOpen(false)}
        insights={insights}
        onRefresh={fetchUserData}
      />
    </div>
  );
}
export default App;
