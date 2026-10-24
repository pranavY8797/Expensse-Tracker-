import React from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Database,
  Sparkles,
  Plus,
  KeyRound,
  FileSpreadsheet,
  HelpCircle,
  Calendar,
  LayoutDashboard
} from 'lucide-react';

export function Navbar({
  discreetMode,
  setDiscreetMode,
  activeView,
  setActiveView,
  onOpenQuickAdd,
  onOpenSqlExplorer,
  onOpenAura,
  onOpenCsvImporter,
  onOpenWhatIf,
  onOpenPinModal,
  isLocked
}) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 24px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(7, 10, 20, 0.9)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexWrap: 'wrap',
      gap: '12px'
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

      {/* Middle: Dashboard vs Calendar View Switcher */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '3px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          onClick={() => setActiveView('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeView === 'dashboard' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: activeView === 'dashboard' ? '#34d399' : '#94a3b8'
          }}
        >
          <LayoutDashboard size={14} /> Dashboard
        </button>

        <button
          onClick={() => setActiveView('calendar')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeView === 'calendar' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            color: activeView === 'calendar' ? '#38bdf8' : '#94a3b8'
          }}
        >
          <Calendar size={14} /> Cashflow Calendar
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* CSV Importer */}
        <button
          className="btn btn-secondary"
          onClick={onOpenCsvImporter}
          title="Import Bank Statement CSV"
          style={{ padding: '7px 12px', fontSize: '0.8rem' }}
        >
          <FileSpreadsheet size={15} color="#10b981" />
          <span>Import CSV</span>
        </button>

        {/* What-If Simulator */}
        <button
          className="btn btn-secondary"
          onClick={onOpenWhatIf}
          title="Test prospective purchases with What-If Simulator"
          style={{ padding: '7px 12px', fontSize: '0.8rem' }}
        >
          <Sparkles size={15} color="#c084fc" />
          <span>What If?</span>
        </button>

        {/* Discreet Mode Toggle */}
        <button
          className="btn btn-secondary"
          onClick={() => setDiscreetMode(!discreetMode)}
          title="Toggle privacy mask for numbers on screen"
          style={{ padding: '7px 10px', fontSize: '0.8rem' }}
        >
          {discreetMode ? <EyeOff size={15} color="#fbbf24" /> : <Eye size={15} />}
        </button>

        {/* SQL Explorer Button */}
        <button
          className="btn btn-secondary"
          onClick={onOpenSqlExplorer}
          title="Inspect & Query MySQL Database"
          style={{ padding: '7px 12px', fontSize: '0.8rem' }}
        >
          <Database size={15} color="#06b6d4" />
          <span>MySQL Console</span>
        </button>

        {/* Aura AI Coach Button */}
        <button
          className="btn btn-ai"
          onClick={onOpenAura}
          style={{ padding: '7px 14px', fontSize: '0.8rem' }}
        >
          <Sparkles size={15} />
          <span>Aura Coach</span>
        </button>

        {/* Quick Add Button */}
        <button
          className="btn btn-primary"
          onClick={onOpenQuickAdd}
          style={{ padding: '7px 16px', fontSize: '0.82rem' }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Log Expense</span>
        </button>

        {/* PIN Lock Trigger */}
        <button
          className="btn btn-secondary"
          onClick={onOpenPinModal}
          title="Vault Security & PIN Lock"
          style={{ padding: '7px 10px', borderRadius: '8px' }}
        >
          <KeyRound size={16} color={isLocked ? '#f43f5e' : '#94a3b8'} />
        </button>
      </div>
    </header>
  );
}
