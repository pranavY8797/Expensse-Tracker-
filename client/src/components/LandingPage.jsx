import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  ArrowRight,
  Database,
  Calendar,
  Layers,
  Lock,
  CheckCircle2,
  TrendingUp,
  Wallet,
  Zap,
  ChevronRight,
  EyeOff
} from 'lucide-react';
import heroImg from '../assets/hero_finance.jpg';

export function LandingPage({ onOpenAuth }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
      {/* 1. Sleek Public Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 36px',
        background: 'rgba(7, 10, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}>
            <Shield size={22} color="#051b14" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                SafeSpend<span style={{ color: '#10b981' }}>.AI</span>
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                ₹ INR Edition
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Private MySQL Financial Intelligence
            </p>
          </div>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', fontSize: '0.86rem', color: '#94a3b8' }}>
          <a href="#features" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Features</a>
          <a href="#how-it-works" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>How It Works</a>
          <a href="#security" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Privacy Guarantee</a>
        </div>

        {/* Auth CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onOpenAuth(false)}
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
          >
            Sign In
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onOpenAuth(true)}
            style={{ padding: '8px 18px', fontSize: '0.84rem' }}
          >
            Get Started Free <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px 40px 24px',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        gap: '40px',
        alignItems: 'center'
      }}>
        <div>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '9999px',
            padding: '6px 14px',
            fontSize: '0.78rem',
            color: '#34d399',
            marginBottom: '20px'
          }}>
            <Sparkles size={14} color="#10b981" />
            <span>AI Natural Language + Indian Rupees (₹) + Private MySQL</span>
          </div>

          <h1 style={{ fontSize: '2.8rem', lineHeight: '1.15', fontWeight: 800, marginBottom: '18px', color: '#f8fafc' }}>
            Intelligent Expense Tracking in <span className="gradient-text-emerald">Indian Rupees (₹)</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '28px', maxWidth: '520px' }}>
            Log daily spends naturally in plain English (UPI, Swiggy, Auto, Bills). SafeSpend AI extracts details automatically and keeps your financial records <strong>100% private</strong> in your local MySQL database.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <button
              className="btn btn-primary"
              onClick={() => onOpenAuth(true)}
              style={{ padding: '14px 28px', fontSize: '0.98rem' }}
            >
              Start Clean Ledger Now <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onOpenAuth(false)}
              style={{ padding: '14px 24px', fontSize: '0.95rem' }}
            >
              Sign In to Vault
            </button>
          </div>

          {/* Quick Perks */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#10b981" /> No fake data
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#10b981" /> Real MySQL 8.0
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#10b981" /> Zero cloud ad-tracking
            </span>
          </div>
        </div>

        {/* Hero Visual Image Card */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            inset: '-10px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.2) 100%)',
            borderRadius: '24px',
            filter: 'blur(30px)',
            zIndex: 0
          }} />

          <div
            className="glass-panel"
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              zIndex: 1
            }}
          >
            <img
              src={heroImg}
              alt="SafeSpend AI Indian Rupee Dashboard"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />

            {/* Floating Banner */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              right: '16px',
              padding: '12px 18px',
              background: 'rgba(5, 8, 20, 0.88)',
              backdropFilter: 'blur(16px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>Daily Safe-to-Spend Meter</span>
                  <p style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Dynamic budget calculated in Indian Rupees (₹)</p>
                </div>
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>
                ₹1,450<span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>/day</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature Showcase Section */}
      <section id="features" style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <h2 style={{ fontSize: '2rem', color: '#f8fafc', fontWeight: 800, marginBottom: '10px' }}>
            Why SafeSpend AI is Simpler & Better
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '580px', margin: '0 auto' }}>
            Built specifically to eliminate financial stress without complex jargon or complicated spreadsheets.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '22px' }}>
          {/* Feature 1 */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Sparkles size={22} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '8px' }}>Magic AI Quick-Log</h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5' }}>
              Just type: <em>"Swiggy dinner ₹450"</em> or <em>"Auto rickshaw ₹60 via UPI"</em>. The AI automatically classifies the amount, vendor, category, and date into your ledger.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Database size={22} color="#06b6d4" />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '8px' }}>Your Private MySQL Vault</h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5' }}>
              Unlike cloud apps that harvest and sell your banking habits, all records live right on your own computer in standard MySQL 8.0. You own 100% of your data.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Zap size={22} color="#8b5cf6" />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '8px' }}>"What If?" Purchase Simulator</h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5' }}>
              Wondering if you can afford a new ₹45,000 phone or a ₹12,000 vacation? Test it in the simulator before spending to see how it affects your daily buffer.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Calendar size={22} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '8px' }}>Cashflow & Bill Renewals</h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5' }}>
              An intuitive monthly calendar that highlights your paydays, daily UPI spending clusters, and upcoming recurring renewal alerts (Netflix, Gym, JioFiber).
            </p>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#f8fafc', fontWeight: 800, marginBottom: '8px' }}>
            Get Started in 3 Simple Steps
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>No complex setup or bank linking required.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '22px', textAlign: 'center' }}>
            <span style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', color: '#051b14', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', marginBottom: '12px' }}>1</span>
            <h4 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '6px' }}>Create Your Free Account</h4>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sign up in 5 seconds with name and email. Your ledger starts clean with zero mock data.</p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '22px', textAlign: 'center' }}>
            <span style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#06b6d4', color: '#051b14', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', marginBottom: '12px' }}>2</span>
            <h4 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '6px' }}>Log Daily Spends Naturally</h4>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Type in plain English: "₹450 Swiggy" or upload your bank statement CSV to auto-categorize in bulk.</p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '22px', textAlign: 'center' }}>
            <span style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#8b5cf6', color: '#051b14', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', marginBottom: '12px' }}>3</span>
            <h4 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '6px' }}>Spend with Absolute Clarity</h4>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Always know your daily Safe-to-Spend limit and watch your savings accumulate in real time.</p>
          </div>
        </div>
      </section>

      {/* 5. Modern Footer */}
      <footer style={{
        marginTop: 'auto',
        background: 'rgba(4, 7, 15, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '36px 36px 28px 36px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#051b14" />
            </div>
            <div>
              <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1rem' }}>SafeSpend.AI</span>
              <p style={{ fontSize: '0.72rem', color: '#64748b' }}>Privacy-First Personal Financial Management • Indian Rupees (₹)</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <span>MySQL 8.0 Engine</span>
            <span>•</span>
            <span>Zero Data Harvesting</span>
            <span>•</span>
            <span>100% Local Sovereignty</span>
          </div>

          <div>
            <button
              className="btn btn-primary"
              onClick={() => onOpenAuth(true)}
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            >
              Get Started Free →
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '20px auto 0 auto', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center', fontSize: '0.72rem', color: '#64748b' }}>
          © 2026 SafeSpend AI. Crafted for privacy, financial clarity, and effortless expense tracking.
        </div>
      </footer>
    </div>
  );
}
