import React, { useRef, useEffect } from 'react';

/**
 * Donut Spending Breakdown Chart with canvas glowing arcs
 */
export function DonutChart({ data = [], total = 0, currency = '₹' }) {
  const canvasRef = useRef(null);

  const colors = [
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#8b5cf6', // violet
    '#f59e0b', // amber
    '#ec4899', // pink
    '#3b82f6', // blue
    '#14b8a6'  // teal
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;
    const innerRadius = radius * 0.65;

    ctx.clearRect(0, 0, width, height);

    if (data.length === 0 || total === 0) {
      // Empty state circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = radius - innerRadius;
      ctx.stroke();
      return;
    }

    let startAngle = -Math.PI / 2;

    data.forEach((item, index) => {
      const sliceAngle = (item.amount / total) * 2 * Math.PI;
      const color = colors[index % colors.length];

      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius + innerRadius) / 2, startAngle, startAngle + sliceAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = radius - innerRadius;
      ctx.lineCap = 'round';
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Inner glow
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0f1d';
    ctx.fill();

  }, [data, total]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: '170px', height: '170px', flexShrink: 0 }}>
        <canvas ref={canvasRef} width={170} height={170} style={{ width: '100%', height: '100%' }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spent</span>
          <div className="sensitive-value" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
            {currency}{total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.slice(0, 5).map((item, idx) => {
          const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;
          const color = colors[idx % colors.length];
          return (
            <div key={item.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></span>
                <span style={{ color: '#cbd5e1', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.category}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="sensitive-value" style={{ fontWeight: 600, color: '#f1f5f9' }}>{currency}{item.amount.toFixed(0)}</span>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 14-Day Spending & Cashflow Trend Bar Chart
 */
export function TrendChart({ transactions = [], currency = '$' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Group last 10 days
    const daysMap = {};
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      daysMap[str] = { expense: 0, income: 0, label: d.toLocaleDateString('en-US', { weekday: 'short' }) };
    }

    transactions.forEach(tx => {
      if (daysMap[tx.date]) {
        if (tx.type === 'expense') daysMap[tx.date].expense += tx.amount;
        else daysMap[tx.date].income += tx.amount;
      }
    });

    const entries = Object.entries(daysMap);
    let maxVal = 100;
    entries.forEach(([_, val]) => {
      if (val.expense > maxVal) maxVal = val.expense;
      if (val.income > maxVal) maxVal = val.income;
    });

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, bottom: 25, left: 10, right: 10 };
    const chartHeight = height - padding.top - padding.bottom;
    const colWidth = (width - padding.left - padding.right) / entries.length;
    const barWidth = Math.max(8, colWidth * 0.45);

    // Draw baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    entries.forEach(([dateStr, val], i) => {
      const x = padding.left + i * colWidth + colWidth / 2;
      const barH = (val.expense / maxVal) * chartHeight;
      const y = height - padding.bottom - barH;

      // Draw subtle background bar column
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(x - barWidth / 2, padding.top, barWidth, chartHeight);

      // Draw gradient expense bar
      if (val.expense > 0) {
        const grad = ctx.createLinearGradient(0, y, 0, height - padding.bottom);
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(1, '#8b5cf6');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x - barWidth / 2, y, barWidth, barH, [4, 4, 0, 0]);
        ctx.fill();
      } else {
        // Zero tick dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(x, height - padding.bottom - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // X Label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val.label, x, height - 8);
    });

  }, [transactions]);

  return (
    <div style={{ width: '100%', height: '140px', marginTop: '10px' }}>
      <canvas ref={canvasRef} width={450} height={140} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
