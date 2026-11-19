/**
 * Charts — small, dependency-free SVG/HTML charts.
 *  AreaChart   change over time (sales)         ColumnChart  counts per period
 *  HBarChart   ranked comparison                Donut        parts of a whole
 *  SalesChart  AreaChart + Daily/Monthly buttons that reads real orders
 *  ChartCard   title + chart + "View as table" (so no value depends on colour or hover alone)
 * Every chart reacts to events: hovering/touching a point or slice shows a tooltip.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { money, monthKey } from './utils';

/* ---------- helpers ---------- */
function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    setW(ref.current.clientWidth);
    if (!('ResizeObserver' in window)) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Round the top of the axis to a clean number and return ticks (0, 500, 1000 …). */
function niceScale(max, count = 4) {
  if (max <= 0) return { top: 4, ticks: [0, 1, 2, 3, 4] };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  return { top, ticks };
}

const compact = (n) => (n >= 1_000_000 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : `${n}`);

function Tip({ x, y, w, children }) {
  if (x == null) return null;
  const flip = x > w * 0.6;
  return (
    <div className="viz-tip" style={{ left: x, top: y, transform: `translate(${flip ? 'calc(-100% - 12px)' : '12px'}, -50%)` }}>
      {children}
    </div>
  );
}

/* ---------- Area / line chart ---------- */
export function AreaChart({ data, format = money, tickFormat = (v) => compact(v), height = 240, label }) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  const m = { l: 46, r: 18, t: 18, b: 30 };
  const iw = Math.max(w - m.l - m.r, 10);
  const ih = height - m.t - m.b;
  const max = Math.max(...data.map((d) => d.value), 0);
  const { top, ticks } = niceScale(max);
  const n = data.length;
  const x = (i) => m.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => m.t + ih - (v / top) * ih;
  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = n ? `${line} L${x(n - 1)},${m.t + ih} L${x(0)},${m.t + ih} Z` : '';
  const every = Math.max(1, Math.ceil(n / Math.max(Math.floor(iw / 56), 1)));

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((px - m.l) / iw) * (n - 1)))));
  };
  const last = n - 1;

  return (
    <div className="viz" ref={ref} style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label={label}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={m.l + iw} y1={y(t)} y2={y(t)} className="viz-grid" />
              <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="viz-axis">{tickFormat(t)}</text>
            </g>
          ))}
          {data.map((d, i) => i % every === 0 && (
            <text key={d.label + i} x={x(i)} y={height - 8} textAnchor="middle" className="viz-axis">{d.label}</text>
          ))}
          {max > 0 && <path d={area} className="viz-area" />}
          <path d={line} className="viz-line" />
          {n <= 8 && pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" className="viz-dot" />)}
          {max > 0 && <text x={Math.min(x(last), m.l + iw - 2)} y={pts[last][1] - 12} textAnchor="end" className="viz-end">{format(data[last].value)}</text>}
          {hover != null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} className="viz-cross" />
              <circle cx={x(hover)} cy={y(data[hover].value)} r="5" className="viz-dot hot" />
            </g>
          )}
          <rect x={m.l} y={m.t} width={iw} height={ih} fill="transparent" onMouseMove={onMove} onTouchMove={onMove} onTouchStart={onMove} onMouseLeave={() => setHover(null)} onTouchEnd={() => setHover(null)} />
        </svg>
      )}
      {hover != null && w > 0 && (
        <Tip x={x(hover)} y={Math.max(y(data[hover].value), 34)} w={w}>
          <strong>{data[hover].tip || data[hover].label}</strong>
          <span>{format(data[hover].value)}</span>
          {data[hover].sub && <em>{data[hover].sub}</em>}
        </Tip>
      )}
      {max === 0 && <div className="viz-empty">No completed sales in this period yet</div>}
    </div>
  );
}

/* ---------- Column chart ---------- */
export function ColumnChart({ data, format = (v) => v, height = 220, label }) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  const m = { l: 36, r: 12, t: 22, b: 30 };
  const iw = Math.max(w - m.l - m.r, 10);
  const ih = height - m.t - m.b;
  const max = Math.max(...data.map((d) => d.value), 0);
  const { top, ticks } = niceScale(max, 4);
  const n = Math.max(data.length, 1);
  const band = iw / n;
  const bw = Math.min(24, band * 0.6);
  const y = (v) => m.t + ih - (v / top) * ih;
  const maxI = data.findIndex((d) => d.value === max);

  const round = (x0, y0, wd, h) => { // 4px rounded top, square at the baseline
    const r = Math.min(4, wd / 2, h);
    return `M${x0},${y0 + h} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} H${x0 + wd - r} Q${x0 + wd},${y0} ${x0 + wd},${y0 + r} V${y0 + h} Z`;
  };

  return (
    <div className="viz" ref={ref} style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label={label}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={m.l + iw} y1={y(t)} y2={y(t)} className="viz-grid" />
              <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="viz-axis">{compact(t)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = m.l + band * i + band / 2;
            const h = (d.value / top) * ih;
            return (
              <g key={d.label + i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onTouchStart={() => setHover(i)}>
                <rect x={m.l + band * i} y={m.t} width={band} height={ih} fill="transparent" />
                {d.value > 0 && <path d={round(cx - bw / 2, y(d.value), bw, h)} className={`viz-bar ${hover === i ? 'hot' : ''}`} />}
                <text x={cx} y={height - 8} textAnchor="middle" className="viz-axis">{d.label}</text>
                {i === maxI && max > 0 && <text x={cx} y={y(d.value) - 6} textAnchor="middle" className="viz-end">{format(d.value)}</text>}
              </g>
            );
          })}
        </svg>
      )}
      {hover != null && w > 0 && (
        <Tip x={m.l + band * hover + band / 2} y={Math.max(y(data[hover].value), 34)} w={w}>
          <strong>{data[hover].label}</strong><span>{format(data[hover].value)}</span>
        </Tip>
      )}
    </div>
  );
}

/* ---------- Horizontal bars (ranked) ---------- */
export function HBarChart({ data, format = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (!data.length) return <p className="muted">Nothing to show yet.</p>;
  return (
    <div className="hbars">
      {data.map((d) => (
        <div className="hbar" key={d.label} title={`${d.label}: ${format(d.value)}`}>
          <span className="hbar-label">{d.label}</span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%` }} />
          </span>
          <span className="hbar-value">{format(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Donut ---------- */
export function Donut({ data, format = (v) => v, center = 'Total' }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 62, C = 2 * Math.PI * R, GAP = 3;
  let acc = 0;
  const shown = hover != null ? data[hover] : null;
  return (
    <div className="donut">
      <svg viewBox="0 0 170 170" role="img" aria-label={data.map((d) => `${d.label} ${d.value}`).join(', ')}>
        <circle cx="85" cy="85" r={R} className="donut-track" />
        {total > 0 && data.map((d, i) => {
          const len = (d.value / total) * C;
          const seg = (
            <circle key={d.label} cx="85" cy="85" r={R} fill="none" stroke={d.color} strokeWidth={hover === i ? 24 : 20}
              strokeDasharray={`${Math.max(len - (data.filter((x) => x.value > 0).length > 1 ? GAP : 0), 0)} ${C}`}
              strokeDashoffset={-acc} transform="rotate(-90 85 85)"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onTouchStart={() => setHover(i)} />
          );
          acc += len;
          return seg;
        })}
        <text x="85" y="82" textAnchor="middle" className="donut-num">{shown ? format(shown.value) : format(total)}</text>
        <text x="85" y="101" textAnchor="middle" className="viz-axis">{shown ? shown.label : center}</text>
      </svg>
      <ul className="legend">
        {data.map((d, i) => (
          <li key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={hover === i ? 'on' : ''}>
            <i style={{ background: d.color }} />
            <span>{d.label}</span>
            <b>{format(d.value)}</b>
            <small>{total ? Math.round((d.value / total) * 100) : 0}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Card wrapper with the table view ---------- */
export function ChartCard({ title, sub, actions, table, children, className = '' }) {
  return (
    <div className={`card pad chart-card ${className}`}>
      <div className="chart-head">
        <div><h3>{title}</h3>{sub && <p className="muted small-text m">{sub}</p>}</div>
        {actions}
      </div>
      {children}
    </div>
  );
}

/* ---------- Sales over time, built from real orders ---------- */
const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; };

export function buildSales(orders, mode, sellerId) {
  const now = new Date();
  const buckets = [];
  if (mode === 'month') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: monthKey(d), label: d.toLocaleDateString('en-US', { month: 'short' }), full: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), value: 0, count: 0 });
    }
  } else {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({ key: dayKey(d), label: `${d.getDate()}`, full: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: 0, count: 0 });
    }
  }
  const keyOf = mode === 'month' ? monthKey : dayKey;
  orders.filter((o) => o.status === 'completed').forEach((o) => {
    const b = buckets.find((x) => x.key === keyOf(o.createdAt));
    if (!b) return;
    b.value += sellerId ? o.items.filter((i) => i.sellerId === sellerId).reduce((s, i) => s + i.price * i.qty, 0) : o.total;
    b.count += 1;
  });
  return buckets.map((b) => ({ label: b.label, tip: b.full, value: b.value, count: b.count, sub: `${b.count} completed order${b.count === 1 ? '' : 's'}` }));
}

export function SalesChart({ orders, sellerId, title = 'Sales', sub = 'Completed orders only' }) {
  const [mode, setMode] = useState('month');
  const data = buildSales(orders, mode, sellerId);
  const total = data.reduce((s, d) => s + d.value, 0);
  const count = data.reduce((s, d) => s + d.count, 0);
  return (
    <ChartCard
      title={title}
      sub={`${sub} · ${money(total)} from ${count} order${count === 1 ? '' : 's'} in this period`}
      actions={(
        <div className="seg" role="group" aria-label="Time range">
          <button className={mode === 'month' ? 'on' : ''} onClick={() => setMode('month')}>6 months</button>
          <button className={mode === 'day' ? 'on' : ''} onClick={() => setMode('day')}>14 days</button>
        </div>
      )}
      table={{ cols: ['Period', 'Sales', 'Orders'], rows: data.map((d) => [d.tip, money(d.value), d.count]) }}
    >
      <AreaChart data={data} label={`${title} chart`} />
    </ChartCard>
  );
}
