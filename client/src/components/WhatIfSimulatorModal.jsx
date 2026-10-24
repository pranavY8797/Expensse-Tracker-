import React, { useState, useEffect } from 'react';
import { X, Sparkles, TrendingDown, CheckCircle, AlertTriangle, HelpCircle, ArrowRight, DollarSign, Calendar, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

const PRESET_SCENARIOS = [
  { desc: 'Apple iPhone 16 Pro', amount: 119900, category: 'Shopping & Gear', recurring: false },
  { desc: 'Cult.fit Annual Gym Pass', amount: 14500, category: 'Health & Wellness', recurring: true, monthly: 1200 },
  { desc: 'Goa Weekend Getaway', amount: 18000, category: 'Transportation', recurring: false },
  { desc: 'Bose QuietComfort Headphones', amount: 35900, category: 'Entertainment & Tech', recurring: false }
];

export function WhatIfSimulatorModal({ isOpen, onClose, onCommitPlannedPurchase }) {
  const [description, setDescription] = useState('Apple iPhone 16 Pro');
  const [amount, setAmount] = useState(119900);
  const [category, setCategory] = useState('Shopping & Gear');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringMonthly, setRecurringMonthly] = useState(9990);
  const [simulation, setSimulation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      runSimulation();
    }
  }, [isOpen, amount, category, isRecurring, recurringMonthly]);

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseAmount: parseFloat(amount) || 0,
          isRecurring,
          recurringMonthly: parseFloat(recurringMonthly) || 0,
          category,
          description
        })
      });
      const data = await res.json();
      setSimulation(data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setDescription(preset.desc);
    setAmount(preset.amount);
    setCategory(preset.category);
    setIsRecurring(Boolean(preset.recurring));
    if (preset.monthly) setRecurringMonthly(preset.monthly);
  };

  const handleCommitToDatabase = async () => {
    if (!simulation) return;
    try {
      const payload = {
        type: 'expense',
        amount: isRecurring ? recurringMonthly : amount,
        category,
        merchant: description,
        date: new Date().toISOString().split('T')[0],
        payment_method: 'Card',
        notes: `Simulated & approved via Aura What-If Simulator: ${description}`,
        tags: ['simulated', 'planned'],
        is_tax_deductible: 0
      };
      const user = JSON.parse(localStorage.getItem('safespend_user') || '{}');
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user.id || 1)
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to insert planned purchase');

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      onCommitPlannedPurchase();
      onClose();
    } catch (err) {
      alert('Error committing to MySQL: ' + err.message);
    }
  };

  if (!isOpen) return null;

  const isGreen = simulation?.verdict?.type === 'APPROVED';
  const isYellow = simulation?.verdict?.type === 'CAUTION';
  const isRed = simulation?.verdict?.type === 'STRESSED';

  const verdictBorderColor = isGreen ? 'rgba(16, 185, 129, 0.4)' : isYellow ? 'rgba(245, 158, 11, 0.4)' : 'rgba(244, 63, 94, 0.4)';
  const verdictBgColor = isGreen ? 'rgba(16, 185, 129, 0.08)' : isYellow ? 'rgba(245, 158, 11, 0.08)' : 'rgba(244, 63, 94, 0.08)';
  const verdictTextColor = isGreen ? '#34d399' : isYellow ? '#fbbf24' : '#fb7185';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '26px',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
            }}>
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                "What If?" Financial Simulator
                <span className="badge badge-violet">Aura Predictive Engine</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Test potential purchases and financing plans before spending your hard-earned rupees
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#94a3b8'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Preset Chips */}
        <div style={{ margin: '14px 0 18px 0' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
            Try Ready Scenarios:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_SCENARIOS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleApplyPreset(p)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  color: '#c084fc',
                  cursor: 'pointer'
                }}
              >
                {p.desc} (₹{p.amount.toLocaleString('en-IN')})
              </button>
            ))}
          </div>
        </div>

        {/* Inputs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Purchase Item</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.86rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: '#0d1326',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.86rem'
              }}
            >
              <option value="Shopping & Gear">Shopping & Gear</option>
              <option value="Groceries & Dining">Groceries & Dining</option>
              <option value="Housing & Utilities">Housing & Utilities</option>
              <option value="Transportation">Transportation</option>
              <option value="Entertainment & Tech">Entertainment & Tech</option>
              <option value="Health & Wellness">Health & Wellness</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>
              {isRecurring ? 'Monthly Installment (₹)' : 'Total Lump-Sum Price (₹)'}
            </label>
            <input
              type="number"
              step="100"
              value={isRecurring ? recurringMonthly : amount}
              onChange={(e) => isRecurring ? setRecurringMonthly(e.target.value) : setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 600
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Payment Mode</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsRecurring(false)}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: !isRecurring ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: !isRecurring ? '#c084fc' : '#94a3b8'
                }}
              >
                One-Time
              </button>
              <button
                type="button"
                onClick={() => setIsRecurring(true)}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isRecurring ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: isRecurring ? '#38bdf8' : '#94a3b8'
                }}
              >
                Monthly Installment
              </button>
            </div>
          </div>
        </div>

        {/* Aura AI Verdict Banner */}
        {simulation?.verdict && (
          <div style={{
            background: verdictBgColor,
            border: `1px solid ${verdictBorderColor}`,
            borderRadius: '16px',
            padding: '18px',
            marginBottom: '20px',
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isGreen && <CheckCircle size={20} color="#10b981" />}
                {isYellow && <AlertTriangle size={20} color="#f59e0b" />}
                {isRed && <AlertTriangle size={20} color="#f43f5e" />}
                <h4 style={{ fontSize: '1.05rem', color: verdictTextColor, fontWeight: 700 }}>
                  Aura Verdict: {simulation.verdict.title}
                </h4>
              </div>
              <span className={`badge ${isGreen ? 'badge-emerald' : isYellow ? 'badge-amber' : 'badge-rose'}`}>
                {simulation.verdict.type}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.5' }}>
              {simulation.verdict.message}
            </p>
          </div>
        )}

        {/* Before vs After Metric Comparison */}
        {simulation && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            {/* Tile 1: Safe to Spend Daily */}
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Daily Safe-to-Spend</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>
                  ₹{simulation.simulated.safeToSpendDaily.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  from ₹{simulation.baseline.safeToSpendDaily.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: simulation.difference.safeBufferDrop > 0 ? '#fb7185' : '#34d399' }}>
                {simulation.difference.safeBufferDrop > 0 ? `-₹${simulation.difference.safeBufferDrop.toFixed(0)}/day buffer reduction` : 'No buffer change'}
              </div>
            </div>

            {/* Tile 2: Financial Health Score */}
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Health Score</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
                  {simulation.simulated.healthScore}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  / 100 (was {simulation.baseline.healthScore})
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: simulation.difference.scoreChange < 0 ? '#fbbf24' : '#34d399' }}>
                {simulation.difference.scoreChange < 0 ? `${simulation.difference.scoreChange} points delta` : 'Health score intact'}
              </div>
            </div>

            {/* Tile 3: Category Limit Burn */}
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                {category} Budget Burn
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: simulation.simulated.categoryPercent > 100 ? '#f43f5e' : '#f8fafc' }}>
                  {simulation.simulated.categoryPercent}%
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  (₹{simulation.simulated.categorySpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / ₹{simulation.simulated.categoryLimit.toLocaleString('en-IN')})
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, simulation.simulated.categoryPercent)}%`,
                  height: '100%',
                  background: simulation.simulated.categoryPercent > 100 ? '#f43f5e' : '#10b981'
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.82rem' }}>
            Close
          </button>
          <button
            className="btn btn-ai"
            onClick={handleCommitToDatabase}
            style={{ fontSize: '0.85rem' }}
          >
            <CheckCircle size={16} /> Save as Planned Transaction in Database
          </button>
        </div>
      </div>
    </div>
  );
}
