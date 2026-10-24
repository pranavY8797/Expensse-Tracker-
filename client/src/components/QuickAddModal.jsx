import React, { useState } from 'react';
import { X, Sparkles, Receipt, PenLine, Check, ArrowRight, ShieldCheck, Tag, Calendar, DollarSign, Building } from 'lucide-react';
import confetti from 'canvas-confetti';

const SAMPLE_PROMPTS = [
  "Dinner with team at Chipotle $38.40 on Card #team",
  "Spent $65 at Shell for gas on Apple Pay",
  "Blue Bottle iced latte and croissant $14.50",
  "Received freelance client payout $850 #freelance #tax",
  "Equinox gym membership renewal 79 usd",
  "Bought USB-C hub at Amazon for office work $45.99 #tax"
];

const SAMPLE_RECEIPTS = [
  {
    label: 'Whole Foods Market ($74.20)',
    text: `WHOLE FOODS MARKET #1042
123 ORGANIC WAY, METROPOLIS
--------------------------------
ORGANIC ROLLED OATS       $ 5.99
ALMOND MILK UNSWEETENED   $ 3.89
AVOCADOS 4-PACK           $ 6.49
WILD ALASKAN SALMON      $ 28.50
DARK ROAST WHOLE BEAN    $ 14.99
GREEK YOGURT 32OZ         $ 7.20
SUBTOTAL                 $ 67.06
TAX (8.25%)              $  7.14
TOTAL                    $ 74.20
AUTH: MASTERCARD **** 4092`
  },
  {
    label: 'Uber Technologies Ride ($34.80)',
    text: `UBER TRIP RECEIPT
TRIP ID: 9482-A02-UBER
--------------------------------
AIRPORT DROP-OFF TRIP     $ 28.50
SURCHARGE TOLL            $  3.50
LOCAL ACCESS FEE          $  2.80
TOTAL CHARGED             $ 34.80
PAYMENT: APPLE PAY VISA`
  },
  {
    label: 'Home Depot Supplies ($118.45)',
    text: `THE HOME DEPOT #8410
HARDWARE & FASTENERS     $ 32.10
LED STRIP WORKLIGHTS     $ 45.00
ACRYLIC FINISH PRIMER    $ 28.90
SALES TAX                $ 12.45
TOTAL                    $ 118.45
CASH TENDERED`
  }
];

export function QuickAddModal({ isOpen, onClose, onTransactionCreated }) {
  const [activeTab, setActiveTab] = useState('nlp'); // 'nlp' | 'receipt' | 'manual'
  
  // NLP state
  const [nlpPrompt, setNlpPrompt] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);

  // Receipt state
  const [receiptText, setReceiptText] = useState(SAMPLE_RECEIPTS[0].text);
  const [parsedReceipt, setParsedReceipt] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Manual Form state
  const [manualType, setManualType] = useState('expense');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCategory, setManualCategory] = useState('Groceries & Dining');
  const [manualMerchant, setManualMerchant] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualPaymentMethod, setManualPaymentMethod] = useState('Card');
  const [manualNotes, setManualNotes] = useState('');
  const [manualTax, setManualTax] = useState(false);

  if (!isOpen) return null;

  // Handle NLP Parse
  const handleParseNLP = async (textToParse) => {
    const query = textToParse || nlpPrompt;
    if (!query.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query })
      });
      const data = await res.json();
      setParsedResult(data);
    } catch (err) {
      console.error('NLP Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Receipt Parse
  const handleScanReceipt = async (text) => {
    const raw = text || receiptText;
    setIsScanning(true);
    try {
      const res = await fetch('/api/ai/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: raw })
      });
      const data = await res.json();
      setParsedReceipt(data);
    } catch (err) {
      console.error('Receipt parse error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Save parsed NLP transaction
  const handleConfirmNLP = async () => {
    if (!parsedResult) return;
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedResult)
      });
      const saved = await res.json();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      onTransactionCreated(saved);
      onClose();
    } catch (err) {
      alert('Error saving transaction: ' + err.message);
    }
  };

  // Save parsed Receipt transaction
  const handleConfirmReceipt = async () => {
    if (!parsedReceipt) return;
    try {
      const payload = {
        type: 'expense',
        amount: parsedReceipt.total,
        category: parsedReceipt.category || 'Groceries & Dining',
        merchant: parsedReceipt.merchant || 'Store Merchant',
        date: parsedReceipt.date,
        payment_method: 'Card',
        notes: `Receipt scan: ${parsedReceipt.items?.length || 0} line items extracted.`,
        tags: ['receipt', 'scanned'],
        is_tax_deductible: 0
      };
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const saved = await res.json();
      confetti({ particleCount: 45, spread: 70, origin: { y: 0.7 } });
      onTransactionCreated(saved);
      onClose();
    } catch (err) {
      alert('Error saving receipt transaction: ' + err.message);
    }
  };

  // Save manual transaction
  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!manualAmount) return;
    try {
      const payload = {
        type: manualType,
        amount: parseFloat(manualAmount),
        category: manualCategory,
        merchant: manualMerchant || 'General Merchant',
        date: manualDate,
        payment_method: manualPaymentMethod,
        notes: manualNotes,
        tags: [],
        is_tax_deductible: manualTax ? 1 : 0
      };
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const saved = await res.json();
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      onTransactionCreated(saved);
      onClose();
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#10b981" /> Smart Expense Logger
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Natural language AI extraction, receipt scanner, or manual SQL entry
            </p>
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

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '4px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <button
            onClick={() => setActiveTab('nlp')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
              background: activeTab === 'nlp' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: activeTab === 'nlp' ? '#ffffff' : '#94a3b8'
            }}
          >
            <Sparkles size={15} /> Magic AI Log
          </button>

          <button
            onClick={() => {
              setActiveTab('receipt');
              if (!parsedReceipt) handleScanReceipt();
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
              background: activeTab === 'receipt' ? 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)' : 'transparent',
              color: activeTab === 'receipt' ? '#ffffff' : '#94a3b8'
            }}
          >
            <Receipt size={15} /> Smart Receipt Scan
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
              background: activeTab === 'manual' ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: activeTab === 'manual' ? '#ffffff' : '#94a3b8'
            }}
          >
            <PenLine size={15} /> Manual Entry
          </button>
        </div>

        {/* TAB 1: NLP QUICK LOG */}
        {activeTab === 'nlp' && (
          <div>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <textarea
                rows={3}
                value={nlpPrompt}
                onChange={(e) => setNlpPrompt(e.target.value)}
                placeholder="Type naturally: 'Dinner with client at Nobu $140 on Visa #business' or 'Gas 45 bucks yesterday'"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(10, 16, 30, 0.9)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-body)',
                  resize: 'none',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleParseNLP();
                  }
                }}
              />
              <button
                className="btn btn-primary"
                onClick={() => handleParseNLP()}
                disabled={isParsing || !nlpPrompt.trim()}
                style={{
                  position: 'absolute',
                  right: '10px',
                  bottom: '14px',
                  padding: '6px 14px',
                  fontSize: '0.8rem'
                }}
              >
                {isParsing ? 'Thinking...' : 'Extract with AI'}
              </button>
            </div>

            {/* Ready Sample Chips */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Try Examples:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {SAMPLE_PROMPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNlpPrompt(sample);
                      handleParseNLP(sample);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    "{sample.slice(0, 36)}..."
                  </button>
                ))}
              </div>
            </div>

            {/* Live Parsed Preview */}
            {parsedResult && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '20px',
                animation: 'fadeIn 0.25s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="badge badge-emerald">
                    <ShieldCheck size={13} /> AI Extracted ({Math.round(parsedResult.confidence * 100)}% Confidence)
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {parsedResult.ai_reasoning}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>AMOUNT</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: parsedResult.type === 'income' ? '#34d399' : '#f43f5e' }}>
                      {parsedResult.type === 'income' ? '+' : '-'}${parsedResult.amount.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>CATEGORY</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                      {parsedResult.category}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>MERCHANT</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                      {parsedResult.merchant}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>PAYMENT</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                      {parsedResult.payment_method}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => setParsedResult(null)} style={{ fontSize: '0.82rem' }}>
                    Discard
                  </button>
                  <button className="btn btn-primary" onClick={handleConfirmNLP} style={{ fontSize: '0.85rem' }}>
                    <Check size={16} /> Confirm & Insert into SQL Vault
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RECEIPT SCANNER */}
        {activeTab === 'receipt' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                  Select or Paste Itemized Receipt Text:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {SAMPLE_RECEIPTS.map((rec, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setReceiptText(rec.text);
                        handleScanReceipt(rec.text);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.7rem',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      Preset #{i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={7}
                value={receiptText}
                onChange={(e) => setReceiptText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(5, 8, 18, 0.95)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#a5f3fc',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  lineHeight: '1.4'
                }}
              />

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-ai"
                  onClick={() => handleScanReceipt()}
                  disabled={isScanning}
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  {isScanning ? 'Extracting Optical Data...' : 'Scan & Extract Line Items'}
                </button>
              </div>
            </div>

            {parsedReceipt && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '15px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#c084fc', textTransform: 'uppercase' }}>MERCHANT DETECTED</span>
                    <h4 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{parsedReceipt.merchant}</h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#c084fc', textTransform: 'uppercase' }}>TOTAL CHARGED</span>
                    <h4 style={{ fontSize: '1.25rem', color: '#f43f5e' }}>${parsedReceipt.total.toFixed(2)}</h4>
                  </div>
                </div>

                {parsedReceipt.items && parsedReceipt.items.length > 0 && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                    {parsedReceipt.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: '#cbd5e1' }}>{it.name}</span>
                        <span style={{ color: '#f1f5f9', fontWeight: 600 }}>${it.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => setParsedReceipt(null)} style={{ fontSize: '0.82rem' }}>
                    Discard
                  </button>
                  <button className="btn btn-ai" onClick={handleConfirmReceipt} style={{ fontSize: '0.85rem' }}>
                    <Check size={16} /> Save Receipt to Vault
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANUAL FORM */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSaveManual}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Entry Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setManualType('expense')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: manualType === 'expense' ? '#f43f5e' : 'rgba(255,255,255,0.06)',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('income')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: manualType === 'income' ? '#10b981' : 'rgba(255,255,255,0.06)',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0d1527',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="Groceries & Dining">Groceries & Dining</option>
                  <option value="Housing & Utilities">Housing & Utilities</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment & Tech">Entertainment & Tech</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Shopping & Gear">Shopping & Gear</option>
                  <option value="Salary & Earnings">Salary & Earnings</option>
                  <option value="Freelance & Side Gig">Freelance & Side Gig</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Merchant / Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. Trader Joe's"
                  value={manualMerchant}
                  onChange={(e) => setManualMerchant(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Date</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Payment Method</label>
                <select
                  value={manualPaymentMethod}
                  onChange={(e) => setManualPaymentMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0d1527',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="Card">Card</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Crypto">Crypto</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Notes</label>
              <input
                type="text"
                placeholder="Optional memo or description"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="taxDed"
                checked={manualTax}
                onChange={(e) => setManualTax(e.target.checked)}
                style={{ accentColor: '#10b981', cursor: 'pointer' }}
              />
              <label htmlFor="taxDed" style={{ fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                Tax Deductible Business Expense
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.82rem' }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                <Check size={16} /> Save to SQL Vault
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
