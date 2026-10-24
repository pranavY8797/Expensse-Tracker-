import React, { useState } from 'react';
import { Target, Repeat, Plus, Trash2, AlertCircle, CheckCircle, Calendar, Sparkles } from 'lucide-react';

export function BudgetSubscriptionsView({
  budgets = [],
  subscriptions = [],
  onUpdateBudget,
  onAddSubscription,
  onDeleteSubscription,
  currency = '$'
}) {
  const [activeTab, setActiveTab] = useState('budgets'); // 'budgets' | 'subscriptions'
  
  // Budget modal
  const [editingBudget, setEditingBudget] = useState(null);
  const [newLimit, setNewLimit] = useState('');

  // Sub modal
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCycle, setSubCycle] = useState('Monthly');
  const [subCategory, setSubCategory] = useState('Entertainment & Tech');
  const [subDate, setSubDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddSub, setShowAddSub] = useState(false);

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (!editingBudget || !newLimit) return;
    onUpdateBudget(editingBudget.category, parseFloat(newLimit));
    setEditingBudget(null);
    setNewLimit('');
  };

  const handleSaveSub = (e) => {
    e.preventDefault();
    if (!subName || !subAmount) return;
    onAddSubscription({
      name: subName,
      amount: parseFloat(subAmount),
      billing_cycle: subCycle,
      category: subCategory,
      next_billing_date: subDate
    });
    setSubName('');
    setSubAmount('');
    setShowAddSub(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('budgets')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'budgets' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'budgets' ? '#34d399' : '#94a3b8',
              borderBottom: activeTab === 'budgets' ? '2px solid #10b981' : 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <Target size={16} /> Category Budgets ({budgets.length})
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'subscriptions' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: activeTab === 'subscriptions' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'subscriptions' ? '2px solid #06b6d4' : 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <Repeat size={16} /> Recurring Subscriptions ({subscriptions.length})
          </button>
        </div>

        {activeTab === 'subscriptions' && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddSub(true)}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Plus size={14} /> Add Subscription
          </button>
        )}
      </div>

      {/* BUDGETS LIST */}
      {activeTab === 'budgets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {budgets.map((b) => {
            const isOver = b.percent >= 100;
            const isWarning = b.percent >= (b.alert_threshold * 100) && !isOver;
            const barColor = isOver ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981';

            return (
              <div
                key={b.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>{b.category}</span>
                    {isOver && <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>Exceeded</span>}
                    {isWarning && <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>Caution</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="sensitive-value" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      <strong style={{ color: '#f8fafc' }}>{currency}{b.spent.toFixed(2)}</strong> / {currency}{b.monthly_limit.toFixed(0)}
                    </span>
                    <button
                      onClick={() => {
                        setEditingBudget(b);
                        setNewLimit(b.monthly_limit);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, b.percent)}%`,
                      height: '100%',
                      background: barColor,
                      boxShadow: `0 0 10px ${barColor}`,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBSCRIPTIONS LIST */}
      {activeTab === 'subscriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {subscriptions.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '12px 16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Repeat size={16} color="#06b6d4" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 600 }}>{s.name}</h4>
                  <p style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{s.category}</span> • <Calendar size={11} /> Next: {s.next_billing_date}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div className="sensitive-value" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>
                    {currency}{s.amount.toFixed(2)}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.billing_cycle}</span>
                </div>
                <button
                  onClick={() => onDeleteSubscription(s.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title="Remove subscription"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Budget Mini Modal */}
      {editingBudget && (
        <div className="modal-overlay" onClick={() => setEditingBudget(null)}>
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '360px', width: '100%', padding: '24px' }}
          >
            <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Adjust Budget: {editingBudget.category}</h4>
            <form onSubmit={handleSaveBudget}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Monthly Target ($)</label>
              <input
                type="number"
                step="10"
                required
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  marginBottom: '16px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingBudget(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddSub && (
        <div className="modal-overlay" onClick={() => setShowAddSub(false)}>
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', width: '100%', padding: '24px' }}
          >
            <h4 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>Track New Subscription</h4>
            <form onSubmit={handleSaveSub}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spotify, Notion, Gym"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ffffff'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="14.99"
                    value={subAmount}
                    onChange={(e) => setSubAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ffffff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Cycle</label>
                  <select
                    value={subCycle}
                    onChange={(e) => setSubCycle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#0e1628',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ffffff'
                    }}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Annual">Annual</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Next Renewal Date</label>
                <input
                  type="date"
                  value={subDate}
                  onChange={(e) => setSubDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ffffff'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSub(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
