import { useState, useMemo, Fragment } from 'react';
import { DATA, SORT_OPTIONS } from '../data.js';

const METRIC_COLS = [
  { key: 'rALE', chgKey: 'rALE', label: 'Residual ALE', fmt: v => '$' + v.toFixed(1) + 'M', isCurrency: true },
  { key: 'iALE', chgKey: 'iALE', label: 'Inherent ALE', fmt: v => '$' + v.toFixed(1) + 'M', isCurrency: true },
  { key: 'freq', chgKey: 'freq', label: 'Inherent Freq.', fmt: v => v.toFixed(2) + '/3yr' },
  { key: 'rF', chgKey: 'rF', label: 'Residual Freq.', fmt: v => v.toFixed(2) + '/3yr' },
  { key: 'mag', chgKey: 'mag', label: 'Loss Magnitude', fmt: v => '$' + v.toFixed(1) + 'M', isCurrency: true },
  { key: 'cLev', chgKey: 'cLev', label: 'Control Leverage', fmt: v => v.toFixed(0) + '%' },
];

function chgFmt(v, col) {
  const abs = Math.abs(v);
  const prefix = v >= 0 ? '+' : '−';
  return prefix + col.fmt(abs);
}

export default function ScenarioPortfolio() {
  const [sortKey, setSortKey] = useState('rALE');
  const [sortDir, setSortDir] = useState('desc');
  const [threshold, setThreshold] = useState(50);

  const sorted = useMemo(() => {
    return [...DATA].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [sortKey, sortDir]);

  const totalALE = DATA.reduce((a, s) => a + s.rALE, 0);

  // Loss exceedance staircase: for any magnitude L, exceedance freq = sum(rF) for scenarios with rM >= L
  // Build as sorted steps
  const exceedanceSteps = useMemo(() => {
    const byMag = [...DATA].sort((a, b) => a.rM - b.rM); // ascending magnitude
    // Total frequency across all scenarios
    const totalFreq = DATA.reduce((a, s) => a + s.rF, 0);
    // Walk from lowest to highest magnitude, subtracting each scenario's frequency
    let remainingFreq = totalFreq;
    const steps = [{ mag: 0, freq: totalFreq }]; // at $0, all events exceed
    byMag.forEach(s => {
      steps.push({ mag: s.rM, freq: remainingFreq }); // just before this scenario drops off
      remainingFreq -= s.rF;
      steps.push({ mag: s.rM, freq: remainingFreq }); // just after
    });
    return steps;
  }, []);

  // Scenarios above the ALE appetite curve: rF * rM >= threshold
  const scenariosAbove = DATA.filter(s => s.rF * s.rM >= threshold).length;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // SVG chart dimensions
  const chartW = 900;
  const chartH = 340;
  const padL = 70;
  const padR = 40;
  const padT = 24;
  const padB = 54;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  // Axis ranges
  const maxMag = Math.max(...DATA.map(s => s.rM)) * 1.15;
  const maxFreq = Math.max(...DATA.map(s => s.rF)) * 1.2;

  const scaleX = (mag) => padL + (mag / maxMag) * plotW;
  const scaleY = (freq) => padT + plotH - (freq / maxFreq) * plotH;

  // Build the exceedance staircase path
  const stairPath = useMemo(() => {
    if (exceedanceSteps.length === 0) return '';
    return exceedanceSteps.map((s, i) => {
      const x = scaleX(Math.min(s.mag, maxMag));
      const y = scaleY(Math.max(s.freq, 0));
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [exceedanceSteps, maxMag, maxFreq]);

  // Build the staircase area fill
  const stairArea = stairPath
    ? stairPath + ` L${scaleX(maxMag).toFixed(1)} ${scaleY(0).toFixed(1)} L${scaleX(0).toFixed(1)} ${scaleY(0).toFixed(1)} Z`
    : '';

  // ALE appetite curve: freq = threshold / mag (hyperbola)
  const appetitePath = useMemo(() => {
    if (threshold <= 0) return '';
    const pts = [];
    const step = maxMag / 80;
    for (let m = Math.max(step, threshold / maxFreq); m <= maxMag; m += step) {
      const f = threshold / m;
      if (f > maxFreq * 1.1) continue;
      if (f < 0) continue;
      pts.push(`${scaleX(m).toFixed(1)},${scaleY(f).toFixed(1)}`);
    }
    return pts.length > 1 ? `M${pts.join(' L')}` : '';
  }, [threshold, maxMag, maxFreq]);

  // Axis ticks
  const xTicks = useMemo(() => {
    const ticks = [];
    const step = Math.ceil(maxMag / 6 / 5) * 5;
    for (let v = 0; v <= maxMag; v += step) ticks.push(v);
    return ticks;
  }, [maxMag]);

  const yTicks = useMemo(() => {
    const ticks = [];
    const step = Math.ceil(maxFreq / 5 * 10) / 10;
    for (let v = 0; v <= maxFreq; v += step) ticks.push(Math.round(v * 100) / 100);
    return ticks;
  }, [maxFreq]);

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Scenarios', value: DATA.length, color: 'var(--navy)' },
          { label: 'Total residual ALE', value: '$' + totalALE.toFixed(1) + 'M', color: 'var(--coral)' },
          { label: 'Average residual ALE', value: '$' + (totalALE / DATA.length).toFixed(1) + 'M', color: 'var(--text)' },
          { label: 'Above threshold', value: scenariosAbove + ' of ' + DATA.length, color: threshold > 0 ? 'var(--coral)' : 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
            padding: '8px 14px', fontFamily: 'var(--mono)', flex: '1 1 140px',
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Scenario table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-header-title">All baseline scenarios</span>
          <span className="card-header-meta">Click column headers to sort</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 10,
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ ...thStyle, width: 36, textAlign: 'left' }}>ID</th>
                <th style={{ ...thStyle, textAlign: 'left', minWidth: 180 }}>Scenario</th>
                {METRIC_COLS.map(col => (
                  <th
                    key={col.key}
                    colSpan={2}
                    onClick={() => handleSort(col.key)}
                    style={{
                      ...thStyle, textAlign: 'center', cursor: 'pointer',
                      borderLeft: '1px solid var(--border-light)',
                      color: sortKey === col.key ? 'var(--navy)' : 'var(--text-muted)',
                      fontWeight: sortKey === col.key ? 700 : 600,
                    }}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span style={{ marginLeft: 4 }}>{sortDir === 'desc' ? '▼' : '▲'}</span>
                    )}
                  </th>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={subThStyle}></th>
                <th style={subThStyle}></th>
                {METRIC_COLS.map(col => (
                  <Fragment key={col.key}>
                    <th style={{ ...subThStyle, borderLeft: '1px solid var(--border-light)', textAlign: 'right' }}>Now</th>
                    <th style={{ ...subThStyle, textAlign: 'right' }}>Δ Chg</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)',
                  }}
                >
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--text-dim)' }}>{s.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 500, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </td>
                  {METRIC_COLS.map(col => {
                    const val = s[col.key];
                    const chgVal = s.chg?.[col.chgKey] ?? 0;
                    const isUp = chgVal > 0.001;
                    const isDown = chgVal < -0.001;
                    return (
                      <Fragment key={col.key}>
                        <td style={{
                          ...tdStyle, textAlign: 'right', fontWeight: 600,
                          borderLeft: '1px solid var(--border-light)',
                        }}>
                          {col.fmt(val)}
                        </td>
                        <td style={{
                          ...tdStyle, textAlign: 'right', fontSize: 9,
                          color: isUp ? 'var(--coral)' : isDown ? 'var(--teal)' : 'var(--text-dim)',
                        }}>
                          {chgFmt(chgVal, col)}
                        </td>
                      </Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            {/* Portfolio totals row */}
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-surface)' }}>
                <td style={{ ...tdStyle, fontWeight: 700 }}></td>
                <td style={{ ...tdStyle, fontWeight: 700, fontSize: 11 }}>Portfolio total / average</td>
                {METRIC_COLS.map(col => {
                  // Sum for ALE/freq/mag, average for leverage
                  const isAvg = col.key === 'cLev';
                  const total = DATA.reduce((a, s) => a + s[col.key], 0);
                  const display = isAvg ? total / DATA.length : total;
                  const chgTotal = DATA.reduce((a, s) => a + (s.chg?.[col.chgKey] ?? 0), 0);
                  const chgDisplay = isAvg ? chgTotal / DATA.length : chgTotal;
                  const isUp = chgDisplay > 0.001;
                  const isDown = chgDisplay < -0.001;
                  return (
                    <Fragment key={col.key}>
                      <td style={{
                        ...tdStyle, textAlign: 'right', fontWeight: 700, fontSize: 11,
                        borderLeft: '1px solid var(--border-light)',
                      }}>
                        {col.fmt(display)}
                      </td>
                      <td style={{
                        ...tdStyle, textAlign: 'right', fontSize: 9,
                        color: isUp ? 'var(--coral)' : isDown ? 'var(--teal)' : 'var(--text-dim)',
                        fontWeight: 600,
                      }}>
                        {chgFmt(chgDisplay, col)}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Loss exceedance curve — frequency × magnitude */}
      <div className="card">
        <div className="card-header">
          <span className="card-header-title">Loss exceedance curve — residual frequency × residual magnitude</span>
          <span className="card-header-value" style={{ color: 'var(--gold)' }}>
            ${totalALE.toFixed(1)}M portfolio residual ALE
          </span>
        </div>
        <div style={{ padding: '16px 12px 8px' }}>
          {/* ALE appetite slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
              ALE appetite
            </span>
            <input
              type="range"
              min={1}
              max={Math.ceil(Math.max(...DATA.map(s => s.rALE)) * 1.5)}
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              style={{ flex: 1, maxWidth: 300 }}
            />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, minWidth: 56 }}>
              ${threshold.toFixed(0)}M
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--coral)' }}>
              {scenariosAbove} scenario{scenariosAbove !== 1 ? 's' : ''} exceed appetite
            </span>
          </div>

          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            width="100%"
            style={{ display: 'block' }}
          >
            {/* Grid lines */}
            {yTicks.map(v => (
              <g key={`y-${v}`}>
                <line
                  x1={padL} y1={scaleY(v)} x2={chartW - padR} y2={scaleY(v)}
                  stroke="var(--border)" strokeWidth="0.5" opacity="0.2"
                />
                <text
                  x={padL - 8} y={scaleY(v) + 3}
                  textAnchor="end" fontSize="10" fontFamily="var(--mono)" fill="var(--text-muted)"
                >
                  {v.toFixed(1)}
                </text>
              </g>
            ))}
            {xTicks.map(v => (
              <g key={`x-${v}`}>
                <line
                  x1={scaleX(v)} y1={padT} x2={scaleX(v)} y2={padT + plotH}
                  stroke="var(--border)" strokeWidth="0.5" opacity="0.2"
                />
                <text
                  x={scaleX(v)} y={padT + plotH + 18}
                  textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill="var(--text-muted)"
                >
                  ${v.toFixed(0)}M
                </text>
              </g>
            ))}

            {/* Axes */}
            <line x1={padL} y1={padT + plotH} x2={chartW - padR} y2={padT + plotH} stroke="var(--text)" strokeWidth="0.5" opacity="0.4" />
            <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--text)" strokeWidth="0.5" opacity="0.4" />

            {/* Axis labels */}
            <text
              x={(padL + chartW - padR) / 2} y={chartH - 4}
              textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill="var(--text-muted)"
            >
              Residual loss magnitude ($M per event)
            </text>
            <text
              x={14} y={(padT + padT + plotH) / 2}
              textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill="var(--text-muted)"
              transform={`rotate(-90, 14, ${(padT + padT + plotH) / 2})`}
            >
              Residual frequency (events / 3yr)
            </text>

            {/* Exceedance staircase fill */}
            {stairArea && <path d={stairArea} fill="var(--navy)" opacity="0.06" />}

            {/* Exceedance staircase line */}
            {stairPath && <path d={stairPath} fill="none" stroke="var(--navy)" strokeWidth="1.5" opacity="0.4" />}

            {/* ALE appetite curve (hyperbola: freq = threshold / mag) */}
            {appetitePath && (
              <g>
                <path d={appetitePath} fill="none" stroke="#E24B4A" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
                <text
                  x={scaleX(maxMag * 0.92)} y={scaleY(threshold / (maxMag * 0.92)) - 8}
                  textAnchor="end" fontSize="10" fontFamily="var(--mono)" fill="#E24B4A" opacity="0.7"
                >
                  ${threshold}M ALE appetite
                </text>
              </g>
            )}

            {/* Scenario dots */}
            {DATA.map(s => {
              const cx = scaleX(s.rM);
              const cy = scaleY(s.rF);
              const aboveAppetite = s.rF * s.rM >= threshold;
              const r = Math.max(4, Math.min(14, Math.sqrt(s.rALE) * 1.8));
              return (
                <g key={s.id}>
                  <circle
                    cx={cx} cy={cy} r={r}
                    fill={aboveAppetite ? '#D85A30' : 'var(--navy)'}
                    stroke={aboveAppetite ? '#993C1D' : 'var(--navy)'}
                    strokeWidth="0.5"
                    opacity={aboveAppetite ? 0.6 : 0.4}
                  />
                  <text
                    x={cx + r + 3} y={cy + 3}
                    fontSize="8" fontFamily="var(--mono)"
                    fill="var(--text-muted)" opacity="0.7"
                  >
                    {s.id}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 16, marginTop: 6, fontFamily: 'var(--mono)', fontSize: 9,
            color: 'var(--text-muted)', flexWrap: 'wrap',
          }}>
            <span>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--navy)', opacity: 0.4, marginRight: 4, verticalAlign: 'middle' }} />
              Within appetite
            </span>
            <span>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#D85A30', opacity: 0.6, marginRight: 4, verticalAlign: 'middle' }} />
              Exceeds appetite (frequency × magnitude ≥ threshold)
            </span>
            <span>Dot size = residual ALE</span>
            <span>Staircase = aggregate exceedance frequency at each magnitude level</span>
            <span style={{ color: '#E24B4A' }}>Dashed curve = ALE appetite isoquant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared table styles
const thStyle = {
  padding: '6px 8px',
  fontSize: 9,
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  fontFamily: 'var(--mono)',
  whiteSpace: 'nowrap',
};

const subThStyle = {
  padding: '3px 8px',
  fontSize: 8,
  fontWeight: 500,
  color: 'var(--text-dim)',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  fontFamily: 'var(--mono)',
};

const tdStyle = {
  padding: '5px 8px',
  fontFamily: 'var(--mono)',
  fontSize: 10,
};
