import React from 'react';
import { Shield, Lock, Eye, EyeOff, Database, Sparkles, Plus, KeyRound } from 'lucide-react';

export function Navbar({
  discreetMode,
  setDiscreetMode,
  onOpenQuickAdd,
  onOpenSqlExplorer,
  onOpenAura,
  onOpenPinModal,
  isLocked,
  healthScore = 92
}) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(7, 10, 20, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand & Safety Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)'
        }}>
          <Shield size={22} color="#051b14" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              SafeSpend<span style={{ color: '#10b981' }}>.AI</span>
            </span>
            <span className="badge badge-emerald">
              <Shield size={12} /> MySQL 8.0 Vault
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            Zero Cloud Tracking • 100% Encrypted Sovereignty
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Discreet Mode Toggle */}
        <button
          className="btn btn-secondary"
          onClick={() => setDiscreetMode(!discreetMode)}
          title="Toggle privacy mask for numbers on screen"
          style={{ padding: '8px 12px', fontSize: '0.82rem' }}
        >
          {discreetMode ? <EyeOff size={16} color="#fbbf24" /> : <Eye size={16} />}
          <span>{discreetMode ? 'Discreet On' : 'Discreet Off'}</span>
        </button>

        {/* SQL Explorer Button */}
        <button
          className="btn btn-secondary"
          onClick={onOpenSqlExplorer}
          title="Inspect & Query Raw SQLite Database"
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
        >
          <Database size={16} color="#06b6d4" />
          <span>SQL Explorer</span>
        </button>

        {/* Aura AI Coach Button */}
        <button
          className="btn btn-ai"
          onClick={onOpenAura}
          style={{ padding: '8px 16px', fontSize: '0.82rem' }}
        >
          <Sparkles size={16} />
          <span>Aura AI Coach</span>
        </button>

        {/* Quick Add Button */}
        <button
          className="btn btn-primary"
          onClick={onOpenQuickAdd}
          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Log Expense</span>
        </button>

        {/* PIN Lock Trigger */}
        <button
          className="btn btn-secondary"
          onClick={onOpenPinModal}
          title="Vault Security & PIN Lock"
          style={{ padding: '8px 10px', borderRadius: '10px' }}
        >
          <KeyRound size={17} color={isLocked ? '#f43f5e' : '#94a3b8'} />
        </button>
      </div>
    </header>
  );
}
