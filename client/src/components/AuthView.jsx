import React, { useState } from 'react';
import { Shield, Lock, Mail, User, ArrowRight, CheckCircle2, AlertCircle, Database, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export function AuthView({ onLoginSuccess, initialIsRegister = false, onClose }) {
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: onClose ? 'fixed' : 'relative',
      inset: onClose ? 0 : 'auto',
      zIndex: onClose ? 1000 : 'auto',
      background: onClose ? 'rgba(5, 7, 15, 0.85)' : 'transparent',
      backdropFilter: onClose ? 'blur(16px)' : 'none',
      minHeight: onClose ? '100vh' : '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          animation: 'fadeIn 0.3s ease',
          position: 'relative'
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        )}
        {/* Logo and Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
          }}>
            <Shield size={28} color="#051b14" strokeWidth={2.5} />
          </div>

          <h2 style={{ fontSize: '1.6rem', color: '#f8fafc', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            SafeSpend<span style={{ color: '#10b981' }}>.AI</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            {isRegister
              ? 'Create a secure personal vault backed by MySQL 8.0'
              : 'Sign in to access your private MySQL financial ledger'}
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
            <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
              <Database size={11} /> MySQL 8.0 (safespend_vault)
            </span>
          </div>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '22px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: !isRegister ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: !isRegister ? '#ffffff' : '#94a3b8'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: isRegister ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: isRegister ? '#ffffff' : '#94a3b8'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Pranav"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {errorMsg && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#fb7185',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', padding: '12px', fontSize: '0.92rem', marginTop: '6px' }}
          >
            {isLoading
              ? 'Processing...'
              : isRegister
              ? 'Enroll & Start Clean Ledger'
              : 'Sign In to Safe Vault'}
            <ArrowRight size={16} />
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.74rem', color: '#64748b', marginTop: '20px' }}>
          Zero fake data • 100% private • Stored locally in your MySQL Server
        </p>
      </div>
    </div>
  );
}
