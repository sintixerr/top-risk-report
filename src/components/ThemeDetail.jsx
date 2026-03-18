import { useMemo } from 'react';
import { getThemeScenarios, SORT_OPTIONS } from '../data.js';

function MetricCell({ label, value, sub, className }) {
  return (
    <div className={`detail-cell ${className}`}>
      {label && <div className="detail-cell-label">{label}</div>}
      <div className="detail-cell-value">{value}</div>
      {sub && <div className="detail-cell-sub">{sub}</div>}
    </div>
  );
}

function GridPanel({ title, rows, isChange }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-title">{title}</span>
      </div>
      <div className="detail-grid">
        {/* Column headers */}
        <div />
        <MetricCell label="" value="Frequency" className="bg-gray" />
        <MetricCell label="" value="Value at risk" className="bg-gray" />
        <MetricCell label="" value="Ann. expected loss" className="bg-gray" />

        {rows.map((row, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div className={`detail-row-label ${row.labelClass}`}>{row.label}</div>
            {row.cells.map((cell, j) => (
              <MetricCell
                key={j}
                value={cell.value}
                sub={cell.sub}
                className={cell.className}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ThemeDetail({ themeName, onDeepDive, userThemes = [] }) {
  const scenarios = useMemo(() => getThemeScenarios(themeName, userThemes), [themeName, userThemes]);

  const agg = useMemo(() => {
    if (scenarios.length === 0) return null;
    const iFreq = scenarios.reduce((a, s) => a + s.freq, 0);
    const iMag = scenarios.reduce((a, s) => a + s.mag, 0);
    const iALE = scenarios.reduce((a, s) => a + s.iALE, 0);
    const rFreq = scenarios.reduce((a, s) => a + s.rF, 0);
    const rMag = scenarios.reduce((a, s) => a + s.rM, 0);
    const rALE = scenarios.reduce((a, s) => a + s.rALE, 0);
    const avgSF = scenarios.reduce((a, s) => a + s.sF, 0) / scenarios.length;
    const avgSM = scenarios.reduce((a, s) => a + s.sM, 0) / scenarios.length;
    const leverage = iALE > 0 ? (1 - rALE / iALE) * 100 : 0;

    // Simulated change
    const chgFreq = iFreq * 0.107;
    const chgMag = iMag * -0.024;
    const chgALE = iALE * 0.08;
    const chgSF = avgSF * -0.02;
    const chgSM = 0;
    const chgLev = 1.0;
    const chgRFreq = rFreq * 0.08;
    const chgRMag = rMag * -0.026;
    const chgRALE = rALE * 0.08;

    return {
      iFreq, iMag, iALE, rFreq, rMag, rALE, avgSF, avgSM, leverage,
      chgFreq, chgMag, chgALE, chgSF, chgSM, chgLev, chgRFreq, chgRMag, chgRALE,
    };
  }, [scenarios]);

  if (!agg || scenarios.length === 0) {
    return <div className="empty-state">No scenarios match theme "{themeName}"</div>;
  }

  const fmt = (v, prefix = '$', suffix = 'M') => `${prefix}${v.toFixed(1)}${suffix}`;
  const fmtF = v => v.toFixed(1);
  const fmtS = v => v.toFixed(2);
  const fmtChg = (v, fn) => {
    const s = fn(Math.abs(v));
    return (v >= 0 ? '+' : '−') + s;
  };
  const chgClass = v => v > 0.001 ? 'color-up' : v < -0.001 ? 'color-down' : 'color-stable';
  const chgBg = v => v > 0.001 ? 'bg-coral' : v < -0.001 ? 'bg-teal' : 'bg-gray';

  const nowRows = [
    {
      label: 'Inherent', labelClass: 'bg-blue',
      cells: [
        { value: fmtF(agg.iFreq), sub: 'events / 3yr', className: 'bg-blue' },
        { value: fmt(agg.iMag), sub: 'aggregate', className: 'bg-blue' },
        { value: fmt(agg.iALE), className: 'bg-blue' },
      ]
    },
    {
      label: 'Control', labelClass: 'bg-teal',
      cells: [
        { value: fmtS(agg.avgSF), sub: 'susceptibility', className: 'bg-teal' },
        { value: fmtS(agg.avgSM), sub: 'mag. reduction', className: 'bg-teal' },
        { value: `${agg.leverage.toFixed(0)}%`, sub: 'leverage', className: 'bg-teal' },
      ]
    },
    {
      label: 'Residual', labelClass: 'bg-coral',
      cells: [
        { value: fmtF(agg.rFreq), sub: 'events / 3yr', className: 'bg-coral' },
        { value: fmt(agg.rMag), sub: 'aggregate', className: 'bg-coral' },
        { value: fmt(agg.rALE), className: 'bg-coral' },
      ]
    },
  ];

  const chgRows = [
    {
      label: 'Inherent Δ', labelClass: 'bg-blue',
      cells: [
        { value: fmtChg(agg.chgFreq, fmtF), sub: `${(agg.chgFreq / agg.iFreq * 100).toFixed(1)}%`, className: chgBg(agg.chgFreq) },
        { value: fmtChg(agg.chgMag, v => fmt(v)), sub: `${(agg.chgMag / agg.iMag * 100).toFixed(1)}%`, className: chgBg(agg.chgMag) },
        { value: fmtChg(agg.chgALE, v => fmt(v)), className: chgBg(agg.chgALE) },
      ]
    },
    {
      label: 'Control Δ', labelClass: 'bg-blue',
      cells: [
        { value: fmtChg(agg.chgSF, fmtS), sub: 'improving', className: chgBg(agg.chgSF) },
        { value: fmtChg(agg.chgSM, fmtS), sub: 'stable', className: 'bg-gray' },
        { value: `+${agg.chgLev.toFixed(0)}%`, sub: 'leverage', className: 'bg-teal' },
      ]
    },
    {
      label: 'Residual Δ', labelClass: 'bg-blue',
      cells: [
        { value: fmtChg(agg.chgRFreq, fmtF), sub: `${(agg.chgRFreq / agg.rFreq * 100).toFixed(1)}%`, className: chgBg(agg.chgRFreq) },
        { value: fmtChg(agg.chgRMag, v => fmt(v)), sub: `${(agg.chgRMag / agg.rMag * 100).toFixed(1)}%`, className: chgBg(agg.chgRMag) },
        { value: fmtChg(agg.chgRALE, v => fmt(v)), className: chgBg(agg.chgRALE) },
      ]
    },
  ];

  // Sort scenarios by rALE contribution
  const sorted = [...scenarios].sort((a, b) => b.rALE - a.rALE);
  const totalRALE = agg.rALE;

  // Determine key driver
  const drivers = [];
  if (agg.chgFreq > 0) drivers.push(`inherent frequency rise (+${(agg.chgFreq / agg.iFreq * 100).toFixed(1)}%)`);
  if (agg.chgMag < 0) drivers.push(`slight magnitude decrease (${(agg.chgMag / agg.iMag * 100).toFixed(1)}%)`);
  if (agg.chgLev > 0) drivers.push(`control leverage improved marginally (+${agg.chgLev.toFixed(0)}%)`);
  const driverText = drivers.length > 0
    ? `Residual ALE changed ${fmtChg(agg.chgRALE, v => fmt(v))} quarter-over-quarter, primarily from ${drivers.join('. ')}. The threat is growing faster than defenses are strengthening.`
    : 'No significant changes this quarter.';

  return (
    <div>
      {/* Theme name and scenario count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div className="section-title">{themeName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
            {sorted.map(s => `${s.id} ${s.name}`).join(' · ')}
          </div>
        </div>
        <button className="btn" onClick={onDeepDive} style={{ whiteSpace: 'nowrap' }}>
          Deep dive →
        </button>
      </div>

      {/* Two side-by-side panels */}
      <div className="detail-panels">
        <GridPanel title="Risk forecast now" rows={nowRows} />
        <GridPanel title="Risk change (Q4 → Q1)" rows={chgRows} isChange />
      </div>

      {/* Scenario contribution bar */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">
          <span className="card-header-title">Scenario contribution to theme residual ALE ({fmt(totalRALE)})</span>
        </div>
        <div style={{ padding: 12 }}>
          <div className="scenario-bar">
            {sorted.map((s, i) => {
              const pct = totalRALE > 0 ? (s.rALE / totalRALE) * 100 : 0;
              const opacity = 0.8 - (i * 0.12);
              return (
                <div
                  key={s.id}
                  className="scenario-bar-segment"
                  style={{
                    width: `${pct}%`,
                    background: `var(--coral)`,
                    opacity: Math.max(opacity, 0.3),
                    minWidth: pct > 5 ? 0 : 40,
                  }}
                  title={`${s.id} ${s.name}: ${fmt(s.rALE)} (${pct.toFixed(0)}%)`}
                >
                  {pct > 12 ? `${s.id} ${fmt(s.rALE)} (${pct.toFixed(0)}%)` : pct > 6 ? s.id : ''}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            {sorted.map(s => {
              const pct = totalRALE > 0 ? (s.rALE / totalRALE) * 100 : 0;
              return (
                <div key={s.id} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text)' }}>{s.id}</strong> {s.name} — {fmt(s.rALE)} ({pct.toFixed(0)}%)
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key driver callout */}
      <div className="callout bg-amber">
        <div className="callout-title">Key driver</div>
        {driverText}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', lineHeight: 1.8 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 1, background: 'var(--blue-bg)', marginRight: 4, verticalAlign: 'middle' }} /> Inherent = threat picture (before controls)</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 1, background: 'var(--teal-bg)', marginRight: 4, verticalAlign: 'middle' }} /> Control = how much controls reduce risk</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 1, background: 'var(--coral-bg)', marginRight: 4, verticalAlign: 'middle' }} /> Residual = what we're carrying</span>
        </div>
        Control leverage = 1 − (residual ALE / inherent ALE). {agg.leverage.toFixed(0)}% means controls reduce this theme's expected cost by {agg.leverage.toFixed(0)}%.
      </div>
    </div>
  );
}
