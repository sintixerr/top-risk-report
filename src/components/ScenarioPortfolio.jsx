import { useState, useMemo, Fragment } from 'react';
import { DATA } from '../data.js';
import { ScreenHeader, Legend } from './HelpPanel.jsx';
import { SCREENS, QUANTITIES, fmt } from '../terminology.js';

const METRIC_COLS = [
  { key: 'rALE', chgKey: 'rALE', label: QUANTITIES.rALE.label, fmt: fmt.dollars, isCurrency: true },
  { key: 'iALE', chgKey: 'iALE', label: QUANTITIES.iALE.label, fmt: fmt.dollars, isCurrency: true },
  { key: 'freq', chgKey: 'freq', label: QUANTITIES.freq.label, fmt: v => v.toFixed(2) + '/3yr' },
  { key: 'rF', chgKey: 'rF', label: QUANTITIES.rF.label, fmt: v => v.toFixed(2) + '/3yr' },
  { key: 'mag', chgKey: 'mag', label: QUANTITIES.mag.label, fmt: fmt.dollars, isCurrency: true },
  { key: 'cLev', chgKey: 'cLev', label: QUANTITIES.cLev.label, fmt: v => v.toFixed(0) + '%' },
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
      const va = a[sortKey] ?? 0, vb = b[sortKey] ?? 0;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [sortKey, sortDir]);

  const totalALE = DATA.reduce((a, s) => a + s.rALE, 0);

  const exceedanceSteps = useMemo(() => {
    const byMag = [...DATA].sort((a, b) => a.rM - b.rM);
    const totalFreq = DATA.reduce((a, s) => a + s.rF, 0);
    let remainingFreq = totalFreq;
    const steps = [{ mag: 0, freq: totalFreq }];
    byMag.forEach(s => {
      steps.push({ mag: s.rM, freq: remainingFreq });
      remainingFreq -= s.rF;
      steps.push({ mag: s.rM, freq: remainingFreq });
    });
    return steps;
  }, []);

  const scenariosAbove = DATA.filter(s => s.rF * s.rM >= threshold).length;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const chartW = 900, chartH = 340, padL = 70, padR = 40, padT = 24, padB = 54;
  const plotW = chartW - padL - padR, plotH = chartH - padT - padB;
  const maxMag = Math.max(...DATA.map(s => s.rM)) * 1.15;
  const maxFreq = Math.max(...DATA.map(s => s.rF)) * 1.2;
  const scaleX = (mag) => padL + (mag / maxMag) * plotW;
  const scaleY = (freq) => padT + plotH - (freq / maxFreq) * plotH;

  const stairPath = useMemo(() => {
    if (exceedanceSteps.length === 0) return '';
    return exceedanceSteps.map((s, i) => {
      const x = scaleX(Math.min(s.mag, maxMag)), y = scaleY(Math.max(s.freq, 0));
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [exceedanceSteps, maxMag, maxFreq]);

  const stairArea = stairPath
    ? stairPath + ` L${scaleX(maxMag).toFixed(1)} ${scaleY(0).toFixed(1)} L${scaleX(0).toFixed(1)} ${scaleY(0).toFixed(1)} Z`
    : '';

  const appetitePath = useMemo(() => {
    if (threshold <= 0) return '';
    const pts = [];
    const step = maxMag / 80;
    for (let m = Math.max(step, threshold / maxFreq); m <= maxMag; m += step) {
      const f = threshold / m;
      if (f > maxFreq * 1.1 || f < 0) continue;
      pts.push(`${scaleX(m).toFixed(1)},${scaleY(f).toFixed(1)}`);
    }
    return pts.length > 1 ? `M${pts.join(' L')}` : '';
  }, [threshold, maxMag, maxFreq]);

  const xTicks = useMemo(() => {
    const ticks = [], step = Math.ceil(maxMag / 6 / 5) * 5;
    for (let v = 0; v <= maxMag; v += step) ticks.push(v);
    return ticks;
  }, [maxMag]);

  const yTicks = useMemo(() => {
    const ticks = [], step = Math.ceil(maxFreq / 5 * 10) / 10;
    for (let v = 0; v <= maxFreq; v += step) ticks.push(Math.round(v * 100) / 100);
    return ticks;
  }, [maxFreq]);

  return (
    <div>
      <ScreenHeader
        title={SCREENS.portfolio.title}
        subtitle={SCREENS.portfolio.subtitle}
        help={SCREENS.portfolio.help}
      />

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Attack scenarios', value: DATA.length, color: 'var(--navy)' },
          { label: `Total ${QUANTITIES.rALE.label.toLowerCase()}`, value: fmt.dollars(totalALE), color: 'var(--coral)' },
          { label: `Average ${QUANTITIES.rALE.label.toLowerCase()}`, value: fmt.dollars(totalALE / DATA.length), color: 'var(--text)' },
          { label: 'Exceed tolerance', value: scenariosAbove + ' of ' + DATA.length, color: threshold > 0 ? 'var(--coral)' : 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
            padding: '8px 14px', fontFamily: 'var(--mono)', flex: '1 1 140px',
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Scenario table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-header-title">All baseline attack scenarios</span>
          <span className="card-header-meta">Click column headers to sort · All reports derive from this same data</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 10 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ ...thStyle, width: 36, textAlign: 'left' }}>ID</th>
                <th style={{ ...thStyle, textAlign: 'left', minWidth: 180 }}>Scenario</th>
                {METRIC_COLS.map(col => (
                  <th key={col.key} colSpan={2} onClick={() => handleSort(col.key)}
                    title={QUANTITIES[col.key]?.tip || ''}
                    style={{ ...thStyle, textAlign: 'center', cursor: 'pointer',
                      borderLeft: '1px solid var(--border-light)',
                      color: sortKey === col.key ? 'var(--navy)' : 'var(--text-muted)',
                      fontWeight: sortKey === col.key ? 700 : 600 }}>
                    {col.label}
                    {sortKey === col.key && <span style={{ marginLeft: 4 }}>{sortDir === 'desc' ? '▼' : '▲'}</span>}
                  </th>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={subThStyle}></th><th style={subThStyle}></th>
                {METRIC_COLS.map(col => (
                  <Fragment key={col.key}>
                    <th style={{ ...subThStyle, borderLeft: '1px solid var(--border-light)', textAlign: 'right' }}>Current</th>
                    <th style={{ ...subThStyle, textAlign: 'right' }}>Δ Chg</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.id} style={{
                  borderBottom: '1px solid var(--border-light)',
                  background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)',
                }}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--text-dim)' }}>{s.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 500, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</td>
                  {METRIC_COLS.map(col => {
                    const val = s[col.key], chgVal = s.chg?.[col.chgKey] ?? 0;
                    const isUp = chgVal > 0.001, isDown = chgVal < -0.001;
                    return (
                      <Fragment key={col.key}>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, borderLeft: '1px solid var(--border-light)' }}>
                          {col.fmt(val)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontSize: 9,
                          color: isUp ? 'var(--coral)' : isDown ? 'var(--teal)' : 'var(--text-dim)' }}>
                          {chgFmt(chgVal, col)}
                        </td>
                      </Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-surface)' }}>
                <td style={{ ...tdStyle, fontWeight: 700 }}></td>
                <td style={{ ...tdStyle, fontWeight: 700, fontSize: 11 }}>Portfolio total / average</td>
                {METRIC_COLS.map(col => {
                  const isAvg = col.key === 'cLev';
                  const total = DATA.reduce((a, s) => a + s[col.key], 0);
                  const display = isAvg ? total / DATA.length : total;
                  const chgTotal = DATA.reduce((a, s) => a + (s.chg?.[col.chgKey] ?? 0), 0);
                  const chgDisplay = isAvg ? chgTotal / DATA.length : chgTotal;
                  const isUp = chgDisplay > 0.001, isDown = chgDisplay < -0.001;
                  return (
                    <Fragment key={col.key}>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, fontSize: 11, borderLeft: '1px solid var(--border-light)' }}>
                        {col.fmt(display)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontSize: 9, fontWeight: 600,
                        color: isUp ? 'var(--coral)' : isDown ? 'var(--teal)' : 'var(--text-dim)' }}>
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

      {/* Loss exceedance chart */}
      <div className="card">
        <div className="card-header">
          <span className="card-header-title">Risk landscape — likelihood vs. financial impact per scenario</span>
          <span className="card-header-value" style={{ color: 'var(--gold)' }}>
            {fmt.dollars(totalALE)} portfolio net annual exposure
          </span>
        </div>
        <div style={{ padding: '16px 12px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
              Risk tolerance
            </span>
            <input type="range" min={1}
              max={Math.ceil(Math.max(...DATA.map(s => s.rALE)) * 1.5)}
              value={threshold} onChange={e => setThreshold(Number(e.target.value))}
              style={{ flex: 1, maxWidth: 300 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, minWidth: 56 }}>${threshold.toFixed(0)}M</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--coral)' }}>
              {scenariosAbove} scenario{scenariosAbove !== 1 ? 's' : ''} exceed tolerance
            </span>
          </div>

          <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" style={{ display: 'block' }}>
            {yTicks.map(v => (
              <g key={`y-${v}`}>
                <line x1={padL} y1={scaleY(v)} x2={chartW - padR} y2={scaleY(v)} stroke="var(--border)" strokeWidth="0.5" opacity="0.2" />
                <text x={padL - 8} y={scaleY(v) + 3} textAnchor="end" fontSize="10" fontFamily="var(--mono)" fill="var(--text-muted)">{v.toFixed(1)}</text>
              </g>
            ))}
            {xTicks.map(v => (
              <g key={`x-${v}`}>
                <line x1={scaleX(v)} y1={padT} x2={scaleX(v)} y2={padT + plotH} stroke="var(--border)" strokeWidth="0.5" opacity="0.2" />
                <text x={scaleX(v)} y={padT + plotH + 18} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill="var(--text-muted)">${v.toFixed(0)}M</text>
              </g>
            ))}
            <line x1={padL} y1={padT + plotH} x2={chartW - padR} y2={padT + plotH} stroke="var(--text)" strokeWidth="0.5" opacity="0.4" />
            <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--text)" strokeWidth="0.5" opacity="0.4" />
            <text x={(padL + chartW - padR) / 2} y={chartH - 4} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill="var(--text-muted)">
              {QUANTITIES.rM.label} ($M per incident)
            </text>
            <text x={14} y={(padT + padT + plotH) / 2} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill="var(--text-muted)"
              transform={`rotate(-90, 14, ${(padT + padT + plotH) / 2})`}>
              {QUANTITIES.rF.label} (incidents / 3yr)
            </text>
            {stairArea && <path d={stairArea} fill="var(--navy)" opacity="0.06" />}
            {stairPath && <path d={stairPath} fill="none" stroke="var(--navy)" strokeWidth="1.5" opacity="0.4" />}
            {appetitePath && (
              <g>
                <path d={appetitePath} fill="none" stroke="#E24B4A" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
                <text x={scaleX(maxMag * 0.92)} y={scaleY(threshold / (maxMag * 0.92)) - 8}
                  textAnchor="end" fontSize="10" fontFamily="var(--mono)" fill="#E24B4A" opacity="0.7">
                  ${threshold}M tolerance
                </text>
              </g>
            )}
            {DATA.map(s => {
              const cx = scaleX(s.rM), cy = scaleY(s.rF);
              const aboveAppetite = s.rF * s.rM >= threshold;
              const r = Math.max(4, Math.min(14, Math.sqrt(s.rALE) * 1.8));
              return (
                <g key={s.id}>
                  <circle cx={cx} cy={cy} r={r}
                    fill={aboveAppetite ? '#D85A30' : 'var(--navy)'}
                    stroke={aboveAppetite ? '#993C1D' : 'var(--navy)'}
                    strokeWidth="0.5" opacity={aboveAppetite ? 0.6 : 0.4} />
                  <text x={cx + r + 3} y={cy + 3} fontSize="8" fontFamily="var(--mono)"
                    fill="var(--text-muted)" opacity="0.7">{s.id}</text>
                </g>
              );
            })}
          </svg>

          <Legend items={[
            { color: 'var(--navy)', shape: 'circle', opacity: 0.4, label: 'Within tolerance' },
            { color: '#D85A30', shape: 'circle', opacity: 0.6, label: 'Exceeds tolerance (likelihood × impact ≥ threshold)' },
            { color: 'var(--navy)', opacity: 0.15, label: 'Shaded area = aggregate exceedance frequency' },
            { color: '#E24B4A', label: '- - Dashed curve = tolerance boundary' },
          ]} />
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '6px 8px', fontSize: 9, fontWeight: 600, color: 'var(--text-muted)',
  letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
};
const subThStyle = {
  padding: '3px 8px', fontSize: 8, fontWeight: 500, color: 'var(--text-dim)',
  letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--mono)',
};
const tdStyle = { padding: '5px 8px', fontFamily: 'var(--mono)', fontSize: 10 };
