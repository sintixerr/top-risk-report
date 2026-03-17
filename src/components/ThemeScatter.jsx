import { useState, useMemo, useRef } from 'react';
import { CUSTOM_THEMES, DATA, SORT_OPTIONS } from '../data.js';

const COLORS = {
  custom: { fill: '#D85A30', stroke: '#993C1D' },
  native: { fill: '#7F77DD', stroke: '#534AB7' },
};

export default function ThemeScatter({ activeCustomThemes, onThemeClick }) {
  const [tooltip, setTooltip] = useState(null);
  const [showAppetite, setShowAppetite] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [appetiteALE, setAppetiteALE] = useState(50);
  const svgRef = useRef(null);

  // Build theme data points
  const themes = useMemo(() => {
    const out = [];

    // Custom themes
    Object.entries(CUSTOM_THEMES).forEach(([name, filterFn]) => {
      if (!activeCustomThemes.includes(name)) return;
      const matched = DATA.filter(filterFn);
      if (matched.length === 0) return;
      const rF = matched.reduce((a, s) => a + s.rF, 0);
      const rM = matched.reduce((a, s) => a + s.rM, 0) / matched.length;
      const rALE = matched.reduce((a, s) => a + s.rALE, 0);
      const iF = matched.reduce((a, s) => a + s.freq, 0);
      const iM = matched.reduce((a, s) => a + s.mag, 0) / matched.length;
      // Simulated change
      const seed = name.length * 7 + name.charCodeAt(0);
      const delta = ((seed % 30) - 12) / 100;
      out.push({
        name, type: 'custom', count: matched.length,
        rF, rM, rALE,
        chgF: rF * delta * 0.5,
        chgM: rM * delta * 0.3,
        radius: Math.max(6, Math.min(28, Math.sqrt(rALE) * 2.2)),
      });
    });

    return out;
  }, [activeCustomThemes]);

  // Scale calculations
  const maxF = Math.max(...themes.map(t => t.rF + Math.abs(t.chgF || 0)), 5);
  const maxM = Math.max(...themes.map(t => t.rM + Math.abs(t.chgM || 0)), 40);

  const chartLeft = 80;
  const chartRight = 640;
  const chartTop = 40;
  const chartBottom = 400;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  const scaleX = f => chartLeft + (f / maxF) * chartW;
  const scaleY = m => chartBottom - (m / maxM) * chartH;

  // Appetite curve: ALE = F * M, so M = appetiteALE / F
  const appetitePts = useMemo(() => {
    if (!showAppetite) return '';
    const pts = [];
    for (let f = maxF * 0.08; f <= maxF; f += maxF / 60) {
      const m = appetiteALE / f;
      if (m > maxM * 1.1) continue;
      if (m < 0) continue;
      pts.push(`${scaleX(f).toFixed(1)},${scaleY(m).toFixed(1)}`);
    }
    return pts.length > 1 ? `M${pts.join(' L')}` : '';
  }, [showAppetite, appetiteALE, maxF, maxM]);

  const handleMouseMove = (e, theme) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top - 10,
      theme,
    });
  };

  return (
    <div>
      {/* Controls */}
      <div className="controls-bar">
        <button
          className={`btn ${showAppetite ? 'btn-active' : ''}`}
          onClick={() => setShowAppetite(!showAppetite)}
        >
          {showAppetite ? '✓' : '○'} Appetite boundary
        </button>
        <button
          className={`btn ${showVectors ? 'btn-active' : ''}`}
          onClick={() => setShowVectors(!showVectors)}
        >
          {showVectors ? '✓' : '○'} Quarter-over-quarter vectors
        </button>
        {showAppetite && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="select-label">ALE threshold</span>
            <input
              type="range"
              min={10}
              max={150}
              value={appetiteALE}
              onChange={e => setAppetiteALE(Number(e.target.value))}
              style={{ width: 120 }}
            />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, minWidth: 44 }}>${appetiteALE}M</span>
          </div>
        )}
      </div>

      <div className="scatter-container" style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 700 480`}
          width="100%"
          style={{ display: 'block' }}
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(pct => (
            <g key={`grid-${pct}`}>
              <line
                x1={chartLeft} y1={chartTop + chartH * pct}
                x2={chartRight} y2={chartTop + chartH * pct}
                stroke="var(--border)" strokeWidth="0.5" opacity="0.3"
              />
              <line
                x1={chartLeft + chartW * pct} y1={chartTop}
                x2={chartLeft + chartW * pct} y2={chartBottom}
                stroke="var(--border)" strokeWidth="0.5" opacity="0.3"
              />
            </g>
          ))}

          {/* Axes */}
          <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="var(--text)" strokeWidth="0.5" opacity="0.4" />
          <line x1={chartLeft} y1={chartBottom} x2={chartLeft} y2={chartTop} stroke="var(--text)" strokeWidth="0.5" opacity="0.4" />

          {/* Axis labels */}
          <text x={(chartLeft + chartRight) / 2} y={chartBottom + 36} textAnchor="middle" fontSize="11" fontFamily="var(--mono)" fill="var(--text-muted)">
            Residual frequency (loss events / 3yr)
          </text>
          <text
            x={20} y={(chartTop + chartBottom) / 2}
            textAnchor="middle" fontSize="11" fontFamily="var(--mono)" fill="var(--text-muted)"
            transform={`rotate(-90, 20, ${(chartTop + chartBottom) / 2})`}
          >
            Residual magnitude ($M per event)
          </text>

          {/* Tick labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => (
            <g key={`tick-${pct}`}>
              <text x={chartLeft + chartW * pct} y={chartBottom + 16} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill="var(--text-muted)">
                {(maxF * pct).toFixed(1)}
              </text>
              <text x={chartLeft - 8} y={chartBottom - chartH * pct + 4} textAnchor="end" fontSize="10" fontFamily="var(--mono)" fill="var(--text-muted)">
                ${(maxM * pct).toFixed(0)}M
              </text>
            </g>
          ))}

          {/* Appetite boundary */}
          {showAppetite && appetitePts && (
            <g>
              <path d={appetitePts} fill="none" stroke="#E24B4A" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
              <text
                x={chartRight - 4}
                y={scaleY(appetiteALE / maxF) + 14}
                textAnchor="end" fontSize="10" fontFamily="var(--mono)" fill="#E24B4A" opacity="0.7"
              >
                ${appetiteALE}M ALE appetite
              </text>
            </g>
          )}

          {/* Theme dots */}
          {themes.map(t => {
            const cx = scaleX(t.rF);
            const cy = scaleY(t.rM);
            const c = COLORS[t.type] || COLORS.custom;

            return (
              <g key={t.name}>
                {/* QoQ vector */}
                {showVectors && (Math.abs(t.chgF) > 0.01 || Math.abs(t.chgM) > 0.01) && (
                  <line
                    x1={cx} y1={cy}
                    x2={scaleX(t.rF + t.chgF)}
                    y2={scaleY(t.rM + t.chgM)}
                    stroke="#E24B4A" strokeWidth="1.5" opacity="0.6"
                    markerEnd="url(#arrowhead)"
                  />
                )}
                {/* Dot */}
                <circle
                  cx={cx} cy={cy} r={t.radius}
                  fill={c.fill} stroke={c.stroke} strokeWidth="0.5"
                  opacity="0.55"
                  style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseMove={e => handleMouseMove(e, t)}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => onThemeClick(t.name, 'detail')}
                />
                {/* Label */}
                <text
                  x={cx + t.radius + 4} y={cy + 4}
                  fontSize="10" fontFamily="var(--mono)" fill="var(--text-muted)"
                  style={{ pointerEvents: 'none' }}
                >
                  {t.name}
                </text>
              </g>
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" />
            </marker>
          </defs>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="scatter-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{tooltip.theme.name}</div>
            <div>{tooltip.theme.count} scenarios · Residual ALE: ${tooltip.theme.rALE.toFixed(1)}M</div>
            <div>Freq: {tooltip.theme.rF.toFixed(2)}/3yr · Mag: ${tooltip.theme.rM.toFixed(1)}M</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORS.custom.fill, opacity: 0.55, marginRight: 4, verticalAlign: 'middle' }} />
          Custom themes
        </span>
        <span>Dot size = residual ALE</span>
        {showVectors && <span style={{ color: '#E24B4A' }}>→ Quarter-over-quarter movement (red = worsening)</span>}
        {showAppetite && <span>Themes above the dashed curve exceed appetite</span>}
        <span>Click any dot to view theme detail</span>
      </div>
    </div>
  );
}
