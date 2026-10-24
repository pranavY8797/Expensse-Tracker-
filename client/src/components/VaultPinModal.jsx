import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldCheck, Check, AlertCircle } from 'lucide-react';

export function VaultPinModal({ isOpen, onClose, hasPin, isLocked, onUnlock, onPinUpdated }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleDigitClick = (digit) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleAction = async () => {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    try {
      if (isLocked) {
        // Verify PIN
        const res = await fetch('/api/security/pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin, action: 'verify' })
        });
        const data = await res.json();
        if (data.success) {
          onUnlock();
          onClose();
        } else {
          setError('Incorrect PIN. Access denied.');
          setPin('');
        }
      } else {
        // Set new PIN
        const res = await fetch('/api/security/pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin, action: 'set' })
        });
        const data = await res.json();
        if (data.success) {
          setSuccess('Vault PIN updated successfully!');
          onPinUpdated();
          setTimeout(() => {
            onClose();
            setSuccess(null);
          }, 1200);
        }
      }
    } catch (err) {
      setError('Security error: ' + err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '28px',
          textAlign: 'center',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
        }}
      >
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '16px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <KeyRound size={26} color="#10b981" />
        </div>

        <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: '6px' }}>
          {isLocked ? 'Unlock Safe Vault' : (hasPin ? 'Update Vault PIN' : 'Set 4-Digit Security PIN')}
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '20px' }}>
          {isLocked
            ? 'Enter your 4-digit master PIN to view sensitive balances'
            : 'Protect financial privacy with a client-side vault lock'}
        </p>

        {/* PIN indicator circles */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '24px' }}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: pin.length > idx ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                border: `2px solid ${pin.length > idx ? '#34d399' : 'rgba(255, 255, 255, 0.2)'}`,
                boxShadow: pin.length > idx ? '0 0 12px rgba(16, 185, 129, 0.6)' : 'none',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>

        {/* Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          maxWidth: '260px',
          margin: '0 auto 20px auto'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitClick(String(num))}
              style={{
                height: '52px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                fontSize: '1.25rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            style={{
              height: '52px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            style={{
              height: '52px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              fontSize: '1.25rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            style={{
              height: '52px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            ⌫
          </button>
        </div>

        {error && (
          <div style={{ color: '#fb7185', fontSize: '0.82rem', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {success && (
          <div style={{ color: '#34d399', fontSize: '0.82rem', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Check size={15} /> {success}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleAction} style={{ flex: 1 }} disabled={pin.length !== 4}>
            {isLocked ? 'Unlock' : 'Save PIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
