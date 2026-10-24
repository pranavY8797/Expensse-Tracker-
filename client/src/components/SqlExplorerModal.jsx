import React, { useState, useEffect } from 'react';
import { X, Database, Play, Download, Table, Terminal, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export function SqlExplorerModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'budgets' | 'recurring_subscriptions' | 'audit_logs' | 'custom'
  const [records, setRecords] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Custom SQL state
  const [customSql, setCustomSql] = useState('SELECT id, type, amount, category, merchant, date FROM transactions ORDER BY id DESC LIMIT 20;');
  const [customResult, setCustomResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'custom') {
        handleRunCustom();
      } else {
        fetchTableRecords(activeTab);
      }
    }
  }, [isOpen, activeTab]);

  const fetchTableRecords = async (tableName) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/sql/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `SELECT * FROM \`${tableName}\` ORDER BY id DESC LIMIT 50;` })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch table records');

      setRecords(data.rows || []);
      setColumns(data.columns || []);
    } catch (err) {
      setErrorMsg(err.message);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunCustom = async () => {
    if (!customSql.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/sql/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customSql })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute query');

      setCustomResult(data);
    } catch (err) {
      setErrorMsg(err.message);
      setCustomResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/export/json', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database size={20} color="#06b6d4" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                My Database Records
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>MySQL (safespend_vault)</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Transparent record viewer: Inspect your raw database tables stored on your computer.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleDownloadBackup}
              title="Download all database tables as JSON"
              style={{ padding: '7px 12px', fontSize: '0.78rem' }}
            >
              <Download size={14} /> Download Backup
            </button>
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
        </div>

        {/* Friendly Table Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'transactions', label: '💳 Transactions Ledger' },
            { id: 'budgets', label: '🎯 Category Budgets' },
            { id: 'recurring_subscriptions', label: '🔁 Subscriptions' },
            { id: 'audit_logs', label: '🛡️ Security Logs' },
            { id: 'custom', label: '⚙️ Custom SQL' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: activeTab === tab.id ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.03)',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                borderBottom: activeTab === tab.id ? '2px solid #06b6d4' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom Query Box (Only if activeTab === 'custom') */}
        {activeTab === 'custom' && (
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={customSql}
              onChange={(e) => setCustomSql(e.target.value)}
              placeholder="SELECT * FROM transactions LIMIT 10;"
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#040711',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem'
              }}
            />
            <button className="btn btn-primary" onClick={handleRunCustom} style={{ padding: '0 16px', fontSize: '0.82rem' }}>
              <Play size={14} fill="#ffffff" /> Run SQL
            </button>
          </div>
        )}

        {/* Content Table */}
        <div style={{
          flex: 1,
          marginTop: '16px',
          overflowY: 'auto',
          background: '#040711',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '12px'
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.84rem' }}>
              Loading database records...
            </div>
          ) : errorMsg ? (
            <div style={{ color: '#fb7185', fontSize: '0.82rem', padding: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> Error: {errorMsg}
            </div>
          ) : activeTab === 'custom' ? (
            customResult && customResult.rows ? (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.74rem', color: '#64748b' }}>
                  <span>Returned {customResult.rowCount} rows</span>
                  <span>Execution: {customResult.executionTimeMs}ms</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {customResult.columns.map(col => (
                        <th key={col} style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customResult.rows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        {customResult.columns.map(col => (
                          <td key={col} style={{ padding: '8px 12px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '0.84rem' }}>
              No records found in this table yet. Enter your expenses in the app to populate this table!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {columns.map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      {columns.map(col => (
                        <td key={col} style={{ padding: '8px 12px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                          {col === 'amount' ? `₹${parseFloat(row[col]).toFixed(2)}` : String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
