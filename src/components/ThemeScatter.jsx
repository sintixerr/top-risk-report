import { useState, useMemo, useRef } from 'react';
import { CUSTOM_THEMES, DATA, buildDimensionData, buildUserThemeFilter } from '../data.js';
import { ScreenHeader, Legend } from './HelpPanel.jsx';
import { QUANTITIES, fmt } from '../terminology.js';

const GROUPINGS = [
  { key: 'custom',     label: 'Risk Themes',        dimKey: 'custom' },
  { key: 'controls',   label: 'Control Objectives',  dimKey: 'controls' },
  { key: 'ttps',       label: 'Attack Methods',      dimKey: 'ttps' },
  { key: 'weaknesses', label: 'Vulnerabilities',     dimKey: 'weaknesses' },
  { key: 'assets',     label: 'Systems Targeted',    dimKey: 'assets' },
  { key: 'motiveObj',  label: 'Attacker Motivation', dimKey: 'motiveObj' },
];

const TYPE_COLORS = {
  custom:     { fill: '#D85A30', stroke: '#993C1D' },
  controls:   { fill: '#7F77DD', stroke: '#534AB7' },
  ttps:       { fill: '#BA7517', stroke: '#7A4C0D' },
  weaknesses: { fill: '#E24B4A', stroke: '#A12E2D' },
  assets:     { fill: '#378ADD', stroke: '#1A5FA0' },
  motiveObj:  { fill: '#1D9E75', stroke: '#0F6E56' },
};

export default function ThemeScatter({ activeCustomThemes, onThemeClick, userThemes = [] }) {
  const [tooltip, setTooltip] = useState(null);
  const [showAppetite, setShowAppetite] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [appetiteALE, setAppetiteALE] = useState(50);
  const [grouping, setGrouping] = useState('custom');
  const svgRef = useRef(null);

  const groupOpt = GROUPINGS.find(g => g.key === grouping);
  const dotColor = TYPE_COLORS[grouping] || TYPE_COLORS.custom;

  const dots = useMemo(() => {
    // Build dimension data to get elements with their scenarios
    const dimData = buildDimensionData(groupOpt.dimKey, 'rALE', false, activeCustomThemes, userThemes);

    return dimData.map(d => {
      const rF = d.scenarios.reduce((a, s) => a + s.rF, 0);
      const rM = d.scenarios.length > 0
        ? d.scenarios.reduce((a, s) => a + s.rM, 0) / d.scenarios.length : 0;
      const rALE = d.scenarios.reduce((a, s) => a + s.rALE, 0);

      // Deterministic QoQ simulation
      const seed = d.name.length * 7 + d.name.charCodeAt(0) + (d.name.charCodeAt(1) || 0) * 3;
      const delta = ((seed % 40) - 18) / 100;

      return {
        name: d.name,
        count: d.count,
        rF, rM, rALE,
        chgF: rF * delta * 0.4,
        chgM: rM * delta * 0.25,
        radius: Math.max(5, Math.min(26, Math.sqrt(rALE) * 2.2)),
      };
    }).filter(d => d.rALE > 0);
  }, [groupOpt, activeCustomThemes, userThemes]);

  const maxF = Math.max(...dots.map(t => t.rF + Math.abs(t.chgF || 0)), 3);
  const maxM = Math.max(...dots.map(t => t.rM + Math.abs(t.chgM || 0)), 20);
  const chartLeft = 80, chartRight = 640, chartTop = 40, chartBottom = 400;
  const chartW = chartRight - chartLeft, chartH = chartBottom - chartTop;
  const scaleX = f => chartLeft + (f / maxF) * chartW;
  const scaleY = m => chartBottom - (m / maxM) * chartH;

  const appetitePts = useMemo(() => {
    if (!showAppetite) return '';
    const pts = [];
    for (let f = maxF * 0.08; f <= maxF; f += maxF / 60) {
      const m = appetiteALE / f;
      if (m > maxM * 1.1 || m < 0) continue;
      pts.push(`${scaleX(f).toFixed(1)},${scaleY(m).toFixed(1)}`);
    }
    return pts.length > 1 ? `M${pts.join(' L')}` : '';
  }, [showAppetite, appetiteALE, maxF, maxM]);

  const handleMouseMove = (e, dot) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10, dot });
  };

  return (
    <div>
      <ScreenHeader
        title="Risk Landscape"
        subtitle={`${groupOpt?.label} positioned by likelihood vs. financial impact. Dot size shows total annual exposure. The dashed curve marks the risk tolerance boundary.`}
        help="Elements above and to the right of the tolerance curve exceed the organization's stated risk appetite. Arrows show quarter-over-quarter movement direction. Click any dot to see its detail view. Switch the grouping to see the same baseline data sliced by different vocabulary dimensions."
      />

      <div className="controls-bar">
        <div>
          <span style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginRight: 6, fontFamily: 'var(--mono)' }}>
            Plot by
          </span>
          <select value={grouping} onChange={e => setGrouping(e.target.value)}
            style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 8px', borderRadius: 2, border: '1px solid var(--border)' }}>
            {GROUPINGS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </div>
        <button className={`btn ${showAppetite ? 'btn-active' : ''}`}
          onClick={() => setShowAppetite(!showAppetite)}>
          {showAppetite ? '✓' : '○'} Tolerance boundary
        </button>
        <button className={`btn ${showVectors ? 'btn-active' : ''}`}
          onClick={() => setShowVectors(!showVectors)}>
          {showVectors ? '✓' : '○'} Quarterly movement
        </button>
        {showAppetite && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="select-label">Threshold</span>
            <input type="range" min={10} max={150} value={appetiteALE}
              onChange={e => setAppetiteALE(Number(e.target.value))} style={{ width: 120 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, minWidth: 44 }}>${appetiteALE}M</span>
          </div>
        )}
      </div>

      <div className="scatter-container" style={{ position: 'relative' }}>
        <svg ref={svgRef} viewBox="0 0 700 480" width="100%" style={{ display: 'block' }}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(pct => (
            <g key={`grid-${pct}`}>
              <line x1={chartLeft} y1={chartTop + chartH * pct} x2={chartRight} y2={chartTop + chartH * pct}
                stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
              <line x1={chartLeft + chartW * pct} y1={chartTop} x2={chartLeft + chartW * pct} y2={chartBottom}
                stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
            </g>
          ))}
          {/* Axes */}
          <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="var(--text)" strokeWidth="0.5" opacity="0.4" />
          <line x1={chartLeft} y1={chartBottom} x2={chartLeft} y2={chartTop} stroke="var(--text)" strokeWidth="0.5" opacity="0.4" />

          {/* Axis labels */}
          <text x={(chartLeft + chartRight) / 2} y={chartBottom + 36} textAnchor="middle" fontSize="11" fontFamily="var(--mono)" fill="var(--text-muted)">
            {QUANTITIES.rF.label} (successful attacks / 3yr)
          </text>
          <text x={20} y={(chartTop + chartBottom) / 2} textAnchor="middle" fontSize="11" fontFamily="var(--mono)" fill="var(--text-muted)"
            transform={`rotate(-90, 20, ${(chartTop + chartBottom) / 2})`}>
            {QUANTITIES.rM.label} ($M per incident)
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

          {/* Appetite curve */}
          {showAppetite && appetitePts && (
            <g>
              <path d={appetitePts} fill="none" stroke="#E24B4A" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
              <text x={chartRight - 4} y={scaleY(appetiteALE / maxF) + 14}
                textAnchor="end" fontSize="10" fontFamily="var(--mono)" fill="#E24B4A" opacity="0.7">
                ${appetiteALE}M tolerance
              </text>
            </g>
          )}

          {/* Dots */}
          {dots.map(d => {
            const cx = scaleX(d.rF), cy = scaleY(d.rM);
            return (
              <g key={d.name}>
                {showVectors && (Math.abs(d.chgF) > 0.01 || Math.abs(d.chgM) > 0.01) && (
                  <line x1={cx} y1={cy} x2={scaleX(d.rF + d.chgF)} y2={scaleY(d.rM + d.chgM)}
                    stroke="#E24B4A" strokeWidth="1.5" opacity="0.6" markerEnd="url(#arrowhead)" />
                )}
                <circle cx={cx} cy={cy} r={d.radius}
                  fill={dotColor.fill} stroke={dotColor.stroke} strokeWidth="0.5"
                  opacity="0.55" style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseMove={e => handleMouseMove(e, d)} onMouseLeave={() => setTooltip(null)}
                  onClick={() => onThemeClick && onThemeClick(d.name, 'detail')} />
                {d.radius > 8 && (
                  <text x={cx + d.radius + 4} y={cy + 4} fontSize="9" fontFamily="var(--mono)"
                    fill="var(--text-muted)" style={{ pointerEvents: 'none' }}>
                    {d.name.length > 20 ? d.name.substring(0, 20) + '…' : d.name}
                  </text>
                )}
              </g>
            );
          })}

          <defs>
            <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" />
            </marker>
          </defs>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div className="scatter-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{tooltip.dot.name}</div>
            <div>{tooltip.dot.count} scenarios · Net exposure: {fmt.dollars(tooltip.dot.rALE)}</div>
            <div>Likelihood: {tooltip.dot.rF.toFixed(2)}/3yr · Impact: {fmt.dollars(tooltip.dot.rM)}</div>
          </div>
        )}
      </div>

      <Legend items={[
        { color: dotColor.fill, shape: 'circle', label: `${groupOpt?.label} (dot size = net annual exposure)` },
        ...(showVectors ? [{ color: '#E24B4A', label: '→ Quarterly movement direction' }] : []),
        ...(showAppetite ? [{ color: '#E24B4A', label: '- - Elements above the curve exceed tolerance' }] : []),
      ]} />
    </div>
  );
}
