import React, { useState, useEffect } from 'react';
import { X, Database, Play, Download, Table, Terminal, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const PRESET_QUERIES = [
  {
    title: 'Top 5 Largest Expenses',
    sql: 'SELECT id, merchant, amount, category, date FROM transactions WHERE type = "expense" ORDER BY amount DESC LIMIT 5;'
  },
  {
    title: 'Monthly Spend By Category',
    sql: 'SELECT category, count(*) as count, round(sum(amount), 2) as total_spent FROM transactions WHERE type = "expense" GROUP BY category ORDER BY total_spent DESC;'
  },
  {
    title: 'Upcoming Subscriptions Due',
    sql: 'SELECT name, amount, billing_cycle, next_billing_date FROM recurring_subscriptions ORDER BY next_billing_date ASC;'
  },
  {
    title: 'Audit Logs & Security Trail',
    sql: 'SELECT id, action, details, timestamp FROM audit_logs ORDER BY id DESC LIMIT 10;'
  }
];

export function SqlExplorerModal({ isOpen, onClose }) {
  const [tables, setTables] = useState([]);
  const [activeQuery, setActiveQuery] = useState(PRESET_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchTables();
      handleRunQuery(PRESET_QUERIES[0].sql);
    }
  }, [isOpen]);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/sql/tables');
      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  const handleRunQuery = async (customSql) => {
    const q = customSql || activeQuery;
    if (!q.trim()) return;
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/sql/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute query');
      }
      setQueryResult(data);
    } catch (err) {
      setErrorMsg(err.message);
      setQueryResult(null);
    } finally {
      setIsRunning(false);
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
          maxWidth: '920px',
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
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                MySQL 8.0 Database Explorer
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>safespend_vault (Live SQL)</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Full data sovereignty: Verify raw SQL tables and export complete backups anytime.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleDownloadBackup}
              title="Download Full Database JSON Export"
              style={{ padding: '7px 12px', fontSize: '0.78rem' }}
            >
              <Download size={14} /> Export Backup
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

        {/* Tables & Presets Bar */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Table size={14} color="#64748b" />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>SQL Tables:</span>
            {tables.map(t => (
              <button
                key={t.name}
                onClick={() => {
                  const q = `SELECT * FROM ${t.name} LIMIT 25;`;
                  setActiveQuery(q);
                  handleRunQuery(q);
                }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  color: '#38bdf8',
                  cursor: 'pointer'
                }}
              >
                {t.name} ({t.rowCount})
              </button>
            ))}
          </div>
        </div>

        {/* Presets Chips */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
          {PRESET_QUERIES.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveQuery(p.sql);
                handleRunQuery(p.sql);
              }}
              style={{
                background: activeQuery === p.sql ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${activeQuery === p.sql ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.73rem',
                color: activeQuery === p.sql ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {p.title}
            </button>
          ))}
        </div>

        {/* Query Editor Bar */}
        <div style={{ marginTop: '14px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Terminal size={14} color="#06b6d4" />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Execute SQL Command:</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              rows={2}
              value={activeQuery}
              onChange={(e) => setActiveQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: '#040711',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.84rem',
                resize: 'none',
                outline: 'none'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleRunQuery();
                }
              }}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleRunQuery()}
              disabled={isRunning}
              style={{ padding: '0 20px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <Play size={15} fill="#ffffff" /> Run
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div style={{
          flex: 1,
          marginTop: '16px',
          overflowY: 'auto',
          background: '#040711',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '12px'
        }}>
          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fb7185', fontSize: '0.82rem', padding: '12px' }}>
              <AlertTriangle size={18} />
              <span>Query Error: {errorMsg}</span>
            </div>
          )}

          {queryResult && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} color="#10b981" /> Returned {queryResult.rowCount} rows
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> Executed in {queryResult.executionTimeMs}ms
                </span>
              </div>

              {queryResult.rows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.85rem' }}>
                  No matching records found.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {queryResult.columns.map(col => (
                          <th key={col} style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontWeight: 600 }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}>
                          {queryResult.columns.map(col => (
                            <td key={col} style={{ padding: '8px 12px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                              {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
