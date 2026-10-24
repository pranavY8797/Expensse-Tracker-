import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Repeat, ArrowUpRight, ArrowDownRight, Sparkles, Clock, CheckCircle } from 'lucide-react';

export function CashflowCalendarView({ currency = '₹', onOpenQuickAdd }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    fetchCalendarData(year, month);
  }, [year, month]);

  const fetchCalendarData = async (y, m) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/calendar/month?year=${y}&month=${m}`);
      const data = await res.json();
      setCalendarData(data);

      // Select today if in current month
      const todayStr = new Date().toISOString().split('T')[0];
      const match = data.calendarDays.find(d => d.date === todayStr) || data.calendarDays[0];
      setSelectedDayData(match);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate day offset for 1st day of month
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sunday

  // Month totals
  const totalInflow = calendarData?.calendarDays.reduce((acc, d) => acc + d.totalIncome, 0) || 0;
  const totalOutflow = calendarData?.calendarDays.reduce((acc, d) => acc + d.totalExpense, 0) || 0;
  const totalRenewals = calendarData?.calendarDays.reduce((acc, d) => acc + d.renewals.length, 0) || 0;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Calendar Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalendarIcon size={20} color="#06b6d4" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', fontWeight: 700 }}>
              {monthNames[month - 1]} {year}
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              Cashflow & Subscription Renewal Timeline
            </p>
          </div>
        </div>

        {/* Navigation & Month Totals */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
            <span style={{ color: '#34d399' }}>
              Inflow: <strong>+{currency}{totalInflow.toFixed(0)}</strong>
            </span>
            <span style={{ color: '#f43f5e' }}>
              Outflow: <strong>-{currency}{totalOutflow.toFixed(0)}</strong>
            </span>
            <span style={{ color: '#38bdf8' }}>
              Bills Due: <strong>{totalRenewals}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn btn-secondary"
              onClick={handlePrevMonth}
              style={{ padding: '6px 10px', borderRadius: '8px' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentDate(new Date())}
              style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
            >
              Today
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleNextMonth}
              style={{ padding: '6px 10px', borderRadius: '8px' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar + Day Detail Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr', gap: '20px' }}>
        {/* Calendar Grid */}
        <div>
          {/* Day Names Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day} style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {day}
              </span>
            ))}
          </div>

          {/* Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {/* Empty offset padding cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: '80px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.01)' }} />
            ))}

            {/* Days in month */}
            {calendarData?.calendarDays.map((dayData) => {
              const isSelected = selectedDayData?.date === dayData.date;
              const hasActivity = dayData.totalIncome > 0 || dayData.totalExpense > 0 || dayData.renewals.length > 0;
              const isToday = new Date().toISOString().split('T')[0] === dayData.date;

              return (
                <div
                  key={dayData.date}
                  onClick={() => setSelectedDayData(dayData)}
                  style={{
                    minHeight: '82px',
                    borderRadius: '10px',
                    padding: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isSelected
                      ? 'rgba(6, 182, 212, 0.15)'
                      : hasActivity
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(255, 255, 255, 0.01)',
                    border: isSelected
                      ? '1px solid #06b6d4'
                      : isToday
                      ? '1px solid rgba(16, 185, 129, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = hasActivity ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: isToday ? 800 : 600,
                      color: isToday ? '#10b981' : '#cbd5e1'
                    }}>
                      {dayData.day}
                    </span>
                    {dayData.renewals.length > 0 && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4' }} title="Subscription Renewal" />
                    )}
                  </div>

                  {/* Day Badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    {dayData.totalIncome > 0 && (
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: '#34d399',
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: '4px',
                        padding: '1px 4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        +{currency}{dayData.totalIncome.toFixed(0)}
                      </span>
                    )}

                    {dayData.totalExpense > 0 && (
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: '#fb7185',
                        background: 'rgba(244, 63, 94, 0.15)',
                        borderRadius: '4px',
                        padding: '1px 4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        -{currency}{dayData.totalExpense.toFixed(0)}
                      </span>
                    )}

                    {dayData.renewals.map((r, ri) => (
                      <span
                        key={ri}
                        style={{
                          fontSize: '0.62rem',
                          color: '#38bdf8',
                          background: 'rgba(6, 182, 212, 0.15)',
                          borderRadius: '4px',
                          padding: '1px 4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ⚡ {r.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector Panel */}
        <div style={{
          background: 'rgba(4, 7, 18, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {selectedDayData ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
                    {selectedDayData.date}
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Daily Breakdown & Schedule
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: (selectedDayData.totalIncome - selectedDayData.totalExpense) >= 0 ? '#34d399' : '#fb7185' }}>
                    {(selectedDayData.totalIncome - selectedDayData.totalExpense) >= 0 ? '+' : '-'}
                    {currency}{Math.abs(selectedDayData.totalIncome - selectedDayData.totalExpense).toFixed(2)}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Net for day</span>
                </div>
              </div>

              {/* Subscriptions due section */}
              {selectedDayData.renewals.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Repeat size={12} /> Recurring Renewals Due:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedDayData.renewals.map((ren) => (
                      <div
                        key={ren.id}
                        style={{
                          background: 'rgba(6, 182, 212, 0.08)',
                          border: '1px solid rgba(6, 182, 212, 0.25)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <h5 style={{ fontSize: '0.82rem', color: '#f8fafc' }}>{ren.name}</h5>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{ren.category}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.85rem' }}>
                          {currency}{ren.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions on day */}
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Transactions ({selectedDayData.transactions.length}):
                </span>
                {selectedDayData.transactions.length === 0 ? (
                  <p style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', padding: '12px 0' }}>
                    No recorded transactions on this date.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                    {selectedDayData.transactions.map((t) => {
                      const isExp = t.type === 'expense';
                      return (
                        <div
                          key={t.id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <h5 style={{ fontSize: '0.82rem', color: '#f8fafc' }}>{t.merchant}</h5>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{t.category}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: isExp ? '#f43f5e' : '#34d399', fontSize: '0.85rem' }}>
                            {isExp ? '-' : '+'}{currency}{t.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Select a calendar day to inspect.</p>
          )}
        </div>
      </div>
    </div>
  );
}
