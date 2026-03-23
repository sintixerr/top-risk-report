import { useState, useMemo } from 'react';
import { DATA, CUSTOM_THEMES, buildDimensionData, buildUserThemeFilter } from '../data.js';
import { ScreenHeader, Legend } from './HelpPanel.jsx';
import { DEFENSE_CYCLE, QUANTITIES, fmt } from '../terminology.js';
import { buildCISControlRanking } from '../positionWhatIf.js';
import { INDICATOR_FORMS, enrichWithIndicatorForms, formatIndicator } from '../indicatorForms.js';

const P = DEFENSE_CYCLE.phases;

const RANK_GROUPINGS = [
  { key: 'custom',      label: 'Risk Themes',         dimKey: 'custom' },
  { key: 'controls',    label: 'Control Objectives',   dimKey: 'controls' },
  { key: 'ttps',        label: 'Attack Methods',       dimKey: 'ttps' },
  { key: 'weaknesses',  label: 'Vulnerabilities',      dimKey: 'weaknesses' },
  { key: 'assets',      label: 'Systems Targeted',     dimKey: 'assets' },
  { key: 'cisControls', label: 'CIS Controls',         dimKey: null },
  { key: 'motiveObj',   label: 'Attacker Motivation',  dimKey: 'motiveObj' },
];

const SORT_OPTIONS = [
  { key: "rALE", label: "Net Annual Exposure",   fmt: fmt.dollars },
  { key: "iALE", label: "Gross Annual Exposure",  fmt: fmt.dollars },
  { key: "freq", label: "Threat Likelihood",       fmt: v => v.toFixed(2) + " /3yr" },
  { key: "rF",   label: "Residual Likelihood",     fmt: v => v.toFixed(2) + " /3yr" },
  { key: "cLev", label: "Defense Effectiveness",   fmt: v => v.toFixed(0) + "%" },
];

export default function ThemeRanked({ activeCustomThemes, setActiveCustomThemes, onThemeClick, userThemes = [] }) {
  const [grouping, setGrouping] = useState('custom');
  const [sortKey, setSortKey] = useState('rALE');
  const [showChg, setShowChg] = useState(false);
  const [indicatorForm, setIndicatorForm] = useState('ale');
  const [exceedanceThreshold, setExceedanceThreshold] = useState(50);

  const groupOpt = RANK_GROUPINGS.find(g => g.key === grouping);
  const sortOpt = SORT_OPTIONS.find(o => o.key === sortKey);

  const rawRows = useMemo(() => {
    if (grouping === 'cisControls') {
      return buildCISControlRanking(sortKey, showChg);
    }
    return buildDimensionData(groupOpt.dimKey, sortKey, showChg, activeCustomThemes, userThemes);
  }, [grouping, groupOpt, sortKey, showChg, activeCustomThemes, userThemes]);

  const rows = useMemo(() => {
    if (grouping === 'cisControls') return rawRows;
    return enrichWithIndicatorForms(rawRows, indicatorForm, exceedanceThreshold);
  }, [rawRows, indicatorForm, exceedanceThreshold, grouping]);

  const portfolioALE = useMemo(() => DATA.reduce((a, s) => a + s.rALE, 0), []);
  const maxVal = Math.max(...rows.map(r => Math.abs(r.val)), 0.01);
  const isCIS = grouping === 'cisControls';

  // Theme sub-selector (only for Risk Themes grouping)
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const allThemeNames = useMemo(() => [
    ...Object.keys(CUSTOM_THEMES),
    ...userThemes.map(t => t.name),
  ], [userThemes]);

  const toggleTheme = (name) => {
    setActiveCustomThemes(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <div>
      <ScreenHeader
        title="Risk Concentrations"
        subtitle="Where risk accumulates across your portfolio — ranked by any dimension. Switch the grouping to see risk concentrated by attack methods, vulnerabilities, control objectives, or individual controls."
        help="Each row shows a vocabulary element and the aggregate risk across all scenarios containing that element. The bar shows relative magnitude. Click any row to navigate to its detail view. Switch dimensions to see the same 22 baseline scenarios sliced differently — this is the flexible aggregation surface in action."
      />

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Portfolio net exposure', value: fmt.dollars(portfolioALE), color: 'var(--coral)' },
          { label: 'Dimension', value: groupOpt?.label, color: 'var(--navy)' },
          { label: 'Elements shown', value: rows.length, color: 'var(--text)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
            padding: '8px 16px', fontFamily: 'var(--mono)', flex: '1 1 140px',
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Controls row: grouping dropdown + sort + change toggle */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 12, fontFamily: 'var(--mono)', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600 }}>
              Concentrate by
            </div>
            <select value={grouping} onChange={e => setGrouping(e.target.value)}
              style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 8px', borderRadius: 2, border: '1px solid var(--border)', minWidth: 160 }}>
              {RANK_GROUPINGS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600 }}>
              Rank by
            </div>
            <select value={sortKey} onChange={e => setSortKey(e.target.value)}
              style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 8px', borderRadius: 2, border: '1px solid var(--border)' }}>
              {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
          <div className="toggle-group">
            <button className={`toggle-btn ${!showChg ? 'toggle-btn-active' : ''}`}
              onClick={() => setShowChg(false)}>Current</button>
            <button className={`toggle-btn ${showChg ? 'toggle-btn-active' : ''}`}
              onClick={() => setShowChg(true)}>Δ Change</button>
          </div>
          <div style={{ marginLeft: 8 }}>
            <div className="toggle-group">
              {INDICATOR_FORMS.map(form => (
                <button key={form.key}
                  className={`toggle-btn ${indicatorForm === form.key ? 'toggle-btn-active' : ''}`}
                  onClick={() => setIndicatorForm(form.key)}
                  title={form.description}
                  style={{ fontSize: 9, padding: '4px 8px' }}>
                  {form.short}
                </button>
              ))}
            </div>
          </div>
          {indicatorForm === 'exceedance' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, fontFamily: 'var(--mono)' }}>
              <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Exceed:</span>
              <input type="range" min={5} max={200} value={exceedanceThreshold}
                onChange={e => setExceedanceThreshold(Number(e.target.value))} style={{ width: 80 }} />
              <span style={{ fontSize: 10, fontWeight: 600 }}>${exceedanceThreshold}M</span>
            </div>
          )}
        </div>

        {/* Theme sub-selector toggle */}
        {grouping === 'custom' && (
          <button className="btn" style={{ fontSize: 9 }}
            onClick={() => setShowThemeSelector(!showThemeSelector)}>
            {showThemeSelector ? '✕ Close' : `◆ ${activeCustomThemes.length} of ${allThemeNames.length} themes`}
          </button>
        )}
      </div>

      {/* Theme sub-selector panel */}
      {grouping === 'custom' && showThemeSelector && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
          padding: '10px 14px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {allThemeNames.map(name => (
              <button key={name}
                className={`btn ${activeCustomThemes.includes(name) ? 'btn-active' : ''}`}
                style={{ fontSize: 9, padding: '3px 8px' }}
                onClick={() => toggleTheme(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ranked table */}
      <div className="card">
        <div className="card-header">
          <span className="card-header-title">
            {showChg ? 'Quarter-over-quarter change' : `${groupOpt?.label} ranked by ${sortOpt.label.toLowerCase()}`}
          </span>
          <span className="card-header-value" style={{ color: 'var(--gold)' }}>
            {!showChg && rows.length > 0 ? sortOpt.fmt(rows.reduce((a, r) => a + r.val, 0)) + ' total' : ''}
          </span>
        </div>
        <div style={{ padding: 0 }}>
          {rows.length === 0 && (
            <div className="empty-state" style={{ padding: 20 }}>No elements to display</div>
          )}
          {rows.map((r, i) => {
            const barW = (Math.abs(r.val) / maxVal) * 100;
            const neg = showChg && r.val < 0;
            return (
              <div key={r.name || r.cisId || i}
                onClick={() => {
                  if (onThemeClick && !isCIS) onThemeClick(r.name, 'detail');
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isCIS ? '32px 1fr 160px 90px' : '32px 1fr 160px 90px',
                  padding: '8px 14px', alignItems: 'center',
                  cursor: isCIS ? 'default' : 'pointer',
                  borderBottom: '1px solid var(--border-light)',
                  transition: 'background 0.1s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>
                  {i + 1}
                </span>
                <div style={{ fontFamily: 'var(--mono)', overflow: 'hidden' }}>
                  {isCIS ? (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>
                        <span style={{ color: 'var(--navy)', marginRight: 4 }}>{r.cisId}</span>
                        {r.safeguard}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-dim)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span>{r.objectiveName}</span>
                        <span>{r.phases.map(p => P[p].abbr).join('/')}</span>
                        <span style={{
                          fontWeight: 600,
                          color: r.effectiveness > 60 ? 'var(--teal)' : r.effectiveness > 40 ? 'var(--amber)' : 'var(--coral)',
                        }}>{r.effectiveness}%</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {r.count} scenario{r.count !== 1 ? 's' : ''}
                      </div>
                    </>
                  )}
                </div>
                <div style={{ height: 8, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4, transition: 'width 0.3s', width: `${barW}%`,
                    background: showChg ? (neg ? 'var(--teal)' : 'var(--coral)') : 'var(--navy)',
                    opacity: 0.6,
                  }} />
                </div>
                <div style={{
                  textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
                  color: showChg ? (neg ? 'var(--teal)' : 'var(--coral)') : 'var(--text)',
                }}>
                  {showChg
                    ? (r.val >= 0 ? '+' : '') + sortOpt.fmt(r.val)
                    : indicatorForm === 'ale' || isCIS
                      ? sortOpt.fmt(r.val)
                      : formatIndicator({
                          form: indicatorForm,
                          ale: r.ale ?? r.val,
                          rank: r.rank,
                          totalRanked: rows.totalRanked || rows.length,
                          exceedanceProb: r.exceedanceProb,
                        })
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Legend items={[
        { color: 'var(--navy)', label: 'Aggregate exposure (bar = relative magnitude)' },
        ...(showChg ? [
          { color: 'var(--coral)', label: 'Risk increased vs. last quarter' },
          { color: 'var(--teal)', label: 'Risk decreased vs. last quarter' },
        ] : []),
      ]} />
    </div>
  );
}
