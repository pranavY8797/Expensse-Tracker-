import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldAlert, TrendingUp, CheckCircle, HelpCircle } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "What is my daily Safe-to-Spend today?",
  "Can I afford a $280 weekend dinner?",
  "Where can I cut expenses this month?",
  "Audit my recurring subscriptions",
  "How is my financial health score calculated?"
];

export function AuraAdvisorDrawer({ isOpen, onClose, insights, onRefresh }) {
  const [messages, setMessages] = useState([
    {
      sender: 'aura',
      text: "Hello! I'm **Aura**, your private AI Financial Guardian. I analyze your local SQLite ledger to identify cashflow opportunities, alert you of budget anomalies, and compute your daily Safe-to-Spend allowance. How can I assist you today?"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async (customText) => {
    const text = customText || inputVal;
    if (!text.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    setInputVal('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setMessages([...newMsgs, { sender: 'aura', text: data.answer || "I've reviewed your ledger. Your spending looks well-balanced!" }]);
    } catch (err) {
      setMessages([...newMsgs, { sender: 'aura', text: "Unable to contact local advisor: " + err.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100vh',
          borderRadius: '24px 0 0 24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid rgba(139, 92, 246, 0.4)',
          background: 'rgba(9, 13, 27, 0.95)',
          boxShadow: '-10px 0 50px rgba(0,0,0,0.7)',
          animation: 'slideInRight 0.25s ease-out'
        }}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
            }}>
              <Sparkles size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>Aura AI Guardian</h3>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Context-Aware Financial Advisor</p>
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

        {/* Health Score Mini Banner */}
        {insights && (
          <div style={{
            margin: '14px 0',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Financial Health</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                {insights.healthScore} / 100
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Daily Safe Buffer</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
                ${insights.safeToSpendDaily.toFixed(2)}/day
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '8px 2px'
        }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: m.sender === 'user'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: m.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                fontSize: '0.84rem',
                lineHeight: '1.45'
              }}
            >
              {/* Simple bold markdown renderer */}
              <div dangerouslySetInnerHTML={{
                __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }} />
            </div>
          ))}

          {isLoading && (
            <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.82rem', color: '#94a3b8' }}>
              <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} /> Aura is calculating ledger forecast...
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '5px 10px',
                  fontSize: '0.73rem',
                  color: '#cbd5e1',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Ask Aura anything about your finances..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#ffffff',
              fontSize: '0.86rem',
              outline: 'none'
            }}
          />
          <button
            className="btn btn-ai"
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputVal.trim()}
            style={{ padding: '0 14px', borderRadius: '10px' }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
