import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, Check, CheckCircle2, AlertCircle, ArrowDownRight, ArrowUpRight, Sparkles, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';

const SAMPLE_CSV_PRESETS = [
  {
    name: 'Chase Bank Checking Export',
    content: `Details,Posting Date,Description,Amount,Type,Balance
DEBIT,2026-10-22,WHOLE FOODS MKT 1042,-64.20,DEBIT,4820.10
DEBIT,2026-10-21,CHEVRON GAS STATION,-48.50,DEBIT,4884.30
CREDIT,2026-10-20,DIRECT DEPOSIT PAYROLL TECH CORP,3200.00,CREDIT,4932.80
DEBIT,2026-10-19,NETFLIX STREAMING SERVICES,-21.99,DEBIT,1732.80
DEBIT,2026-10-18,UBER TRIP SAN FRANCISCO,-34.50,DEBIT,1754.79
DEBIT,2026-10-16,OPENAI CHATGPT PLUS SUBSCRIPTION,-20.00,DEBIT,1789.29
DEBIT,2026-10-15,EQUINOX SPORTS CLUB MEMBERSHIP,-79.00,DEBIT,1809.29
CREDIT,2026-10-12,STRIPE PAYOUT FREELANCE DESIGN,650.00,CREDIT,1888.29`
  },
  {
    name: 'Bank of America Statement',
    content: `Date,Description,Amount,Running Bal.
2026-10-23,STARBUCKS STORE 08412,-6.85,3420.50
2026-10-21,TRADER JOE'S GROCERY,-78.40,3427.35
2026-10-19,SHELL OIL AUTO REFILL,-52.00,3505.75
2026-10-17,APPLE.COM/BILL ICLOUD STORAGE,-9.99,3557.75
2026-10-14,AMAZON.COM HOME OFFICE LIGHT,-84.50,3567.74
2026-10-11,BLUE BOTTLE COFFEE,-14.20,3652.24`
  }
];

export function CsvImporterModal({ isOpen, onClose, onImportComplete }) {
  const [csvContent, setCsvContent] = useState(SAMPLE_CSV_PRESETS[0].content);
  const [parsedData, setParsedData] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleParseCSV = async (contentToParse) => {
    const raw = contentToParse || csvContent;
    if (!raw.trim()) return;
    setIsParsing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/import/parse-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: raw })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse CSV');

      setParsedData(data);
      // Select all by default
      const allIdx = new Set(data.rows.map((_, i) => i));
      setSelectedIndices(allIdx);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvContent(text);
      handleParseCSV(text);
    };
    reader.readAsText(file);
  };

  const toggleSelectRow = (index) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === parsedData.rows.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parsedData.rows.map((_, i) => i)));
    }
  };

  const handleCommitBatch = async () => {
    if (!parsedData || selectedIndices.size === 0) return;
    setIsCommitting(true);
    try {
      const selectedRows = parsedData.rows.filter((_, idx) => selectedIndices.has(idx));
      const res = await fetch('/api/import/batch-commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: selectedRows })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to commit batch');

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      onImportComplete();
      onClose();
    } catch (err) {
      alert('Error committing batch to MySQL: ' + err.message);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '26px',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <FileSpreadsheet size={22} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Bank Statement CSV Bulk Importer
                <span className="badge badge-emerald">Batch AI Categorizer</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Upload or paste bank statements to batch-categorize and insert records into MySQL
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

        {/* Input / Preset Section */}
        {!parsedData ? (
          <div style={{ padding: '20px 0', overflowY: 'auto' }}>
            <div style={{
              border: '2px dashed rgba(16, 185, 129, 0.35)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              background: 'rgba(16, 185, 129, 0.03)',
              marginBottom: '16px'
            }}>
              <UploadCloud size={36} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '6px' }}>
                Drag and drop your Bank Statement CSV file here
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '14px' }}>
                Compatible with Chase, BoA, Wells Fargo, Revolut, Stripe, and generic CSV bank exports
              </p>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                Browse CSV File
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Presets */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Or try a realistic Bank Sample Preset:
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {SAMPLE_CSV_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCsvContent(p.content);
                      handleParseCSV(p.content);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.8rem',
                      color: '#38bdf8',
                      cursor: 'pointer'
                    }}
                  >
                    📂 {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Raw Text Box */}
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                Or paste raw CSV text:
              </span>
              <textarea
                rows={5}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#040711',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#34d399',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  resize: 'none'
                }}
              />
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleParseCSV()}
                  disabled={isParsing || !csvContent.trim()}
                >
                  <Sparkles size={16} /> {isParsing ? 'Analyzing CSV...' : 'Parse & Auto-Categorize with AI'}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{ marginTop: '12px', color: '#fb7185', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} /> {errorMsg}
              </div>
            )}
          </div>
        ) : (
          /* Preview & Review Table */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: '16px' }}>
            {/* KPI Summary Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '10px 16px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', gap: '18px', fontSize: '0.82rem' }}>
                <span style={{ color: '#cbd5e1' }}>
                  Total Extracted: <strong style={{ color: '#ffffff' }}>{parsedData.totalRows} rows</strong>
                </span>
                <span style={{ color: '#34d399' }}>
                  Inflow: <strong>+${parsedData.totalIncome.toFixed(2)}</strong>
                </span>
                <span style={{ color: '#f43f5e' }}>
                  Outflow: <strong>-${parsedData.totalExpense.toFixed(2)}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={toggleSelectAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {selectedIndices.size === parsedData.rows.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                  {selectedIndices.size} Selected
                </span>
              </div>
            </div>

            {/* Rows Table */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#040711', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ width: '40px', padding: '8px' }}></th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>Merchant / Payee</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>AI Category</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.map((row, idx) => {
                    const isSelected = selectedIndices.has(idx);
                    const isExpense = row.type === 'expense';
                    return (
                      <tr
                        key={idx}
                        onClick={() => toggleSelectRow(idx)}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                          opacity: isSelected ? 1 : 0.45
                        }}
                      >
                        <td style={{ textAlign: 'center', padding: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ accentColor: '#10b981', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {row.date}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#f8fafc', fontWeight: 600 }}>
                          {row.merchant}
                          {row.is_tax_deductible === 1 && (
                            <span className="badge badge-cyan" style={{ marginLeft: '6px', fontSize: '0.62rem', padding: '2px 6px' }}>
                              Tax Flag
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                            {row.category}
                          </span>
                        </td>
                        <td style={{
                          textAlign: 'right',
                          padding: '8px 12px',
                          fontWeight: 700,
                          color: isExpense ? '#f43f5e' : '#34d399',
                          whiteSpace: 'nowrap'
                        }}>
                          {isExpense ? '-' : '+'}${row.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Controls */}
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setParsedData(null)}
                style={{ fontSize: '0.8rem' }}
              >
                ← Back to CSV Input
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.8rem' }}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCommitBatch}
                  disabled={isCommitting || selectedIndices.size === 0}
                  style={{ fontSize: '0.85rem' }}
                >
                  <Check size={16} /> {isCommitting ? 'Writing to MySQL...' : `Commit ${selectedIndices.size} Rows to MySQL Vault`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
