import { useState, useMemo } from 'react';
import { DIMENSIONS, CUSTOM_THEMES, SORT_OPTIONS, DATA, buildDimensionData } from '../data.js';

const ALL_DIM_LABELS = {
  controls: 'Control objectives',
  motiveObj: 'Motive–objectives',
  ttps: 'TTP classes',
  weaknesses: 'Weakness classes',
  assets: 'Asset classes',
  custom: 'Custom themes',
};

function RankedPanel({ title, dimKey, sortKey, showChg, sortFmt, activeCustomThemes, onThemeClick }) {
  const rows = useMemo(
    () => buildDimensionData(dimKey, sortKey, showChg, activeCustomThemes),
    [dimKey, sortKey, showChg, activeCustomThemes]
  );
  const maxVal = Math.max(...rows.map(r => Math.abs(r.val)), 0.01);
  const [expanded, setExpanded] = useState(null);
  const total = rows.reduce((a, r) => a + r.val, 0);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-title">{title}</span>
        <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="card-header-meta">{rows.length} elements</span>
          <span
            className="card-header-value"
            style={{ color: showChg ? (total >= 0 ? '#e07a5f' : '#81b29a') : '#d4a574' }}
          >
            {showChg ? (total >= 0 ? '+' : '') : ''}
            {sortFmt(total)}
          </span>
        </span>
      </div>

      <div className="ranked-col-header">
        <span>#</span>
        <span>Element</span>
        <span></span>
        <span style={{ textAlign: 'right' }}>{showChg ? 'Δ ' : ''}Value</span>
      </div>

      {rows.length === 0 && (
        <div className="empty-state" style={{ padding: '20px 12px' }}>
          No custom themes selected
        </div>
      )}

      {rows.map((r, i) => {
        const barW = (Math.abs(r.val) / maxVal) * 100;
        const neg = showChg && r.val < 0;
        const isExp = expanded === i;

        return (
          <div key={r.name}>
            <div
              className="ranked-row"
              onClick={() => setExpanded(isExp ? null : i)}
            >
              <span className="ranked-rank">{i + 1}</span>
              <span className="ranked-name">
                {r.name}
                <span className="count">({r.count})</span>
              </span>
              <div className="ranked-bar-container">
                {showChg && <div className="ranked-bar-center" />}
                <div
                  className="ranked-bar"
                  style={{
                    left: showChg ? (neg ? `${50 - barW / 2}%` : '50%') : 0,
                    width: showChg ? `${barW / 2}%` : `${barW}%`,
                    background: showChg ? (neg ? '#81b29a' : '#e07a5f') : 'var(--navy)',
                  }}
                />
              </div>
              <span
                className="ranked-value"
                style={{ color: showChg ? (neg ? 'var(--teal)' : 'var(--coral)') : 'var(--text)' }}
              >
                {showChg && r.val >= 0 ? '+' : ''}
                {sortFmt(r.val)}
              </span>
            </div>
            {isExp && (
              <div className="ranked-expand">
                <div className="ranked-expand-label">
                  {r.count} scenarios contributing
                </div>
                <div className="ranked-expand-chips">
                  {r.scenarios.map(s => (
                    <span
                      key={s.id}
                      className="scenario-chip"
                      onClick={(e) => { e.stopPropagation(); onThemeClick && onThemeClick(r.name, 'detail'); }}
                    >
                      <strong>{s.id}</strong> {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ThemeRanked({ activeCustomThemes, setActiveCustomThemes, onThemeClick }) {
  const [activeDims, setActiveDims] = useState(['controls', 'ttps', 'weaknesses', 'custom']);
  const [sortKey, setSortKey] = useState('rALE');
  const [showChg, setShowChg] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const sortOpt = SORT_OPTIONS.find(o => o.key === sortKey);
  const toggleDim = d => setActiveDims(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleCustom = name => setActiveCustomThemes(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  const customIsActive = activeDims.includes('custom');

  return (
    <div>
      {/* Controls */}
      <div className="controls-bar">
        <button
          className={`btn ${pickerOpen ? 'btn-active' : ''}`}
          onClick={() => setPickerOpen(!pickerOpen)}
        >
          {pickerOpen ? '✕ Close' : '◆ Dimensions'} ({activeDims.length})
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="select-label">Sort by</span>
          <select value={sortKey} onChange={e => setSortKey(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        <div className="toggle-group">
          <button
            className={`toggle-btn ${!showChg ? 'toggle-btn-active' : ''}`}
            onClick={() => setShowChg(false)}
          >Now</button>
          <button
            className={`toggle-btn ${showChg ? 'toggle-btn-active' : ''}`}
            onClick={() => setShowChg(true)}
          >Δ Change</button>
        </div>

        <div className="pills">
          {activeDims.map(d => (
            <span key={d} className="pill">{ALL_DIM_LABELS[d]}</span>
          ))}
        </div>
      </div>

      {/* Picker */}
      {pickerOpen && (
        <div className="picker-panel">
          <div className="picker-section">
            <div className="section-title">Native elements</div>
            {['controls', 'motiveObj', 'ttps', 'weaknesses', 'assets'].map(d => (
              <label
                key={d}
                className={`picker-label ${activeDims.includes(d) ? 'picker-label-active' : 'picker-label-inactive'}`}
              >
                <input type="checkbox" checked={activeDims.includes(d)} onChange={() => toggleDim(d)} />
                {ALL_DIM_LABELS[d]}
              </label>
            ))}
          </div>

          <div className="picker-section">
            <div className="section-title">Custom themes dimension</div>
            <label className={`picker-label ${customIsActive ? 'picker-label-active' : 'picker-label-inactive'}`}>
              <input type="checkbox" checked={customIsActive} onChange={() => toggleDim('custom')} />
              Enable custom themes panel
            </label>
          </div>

          {customIsActive && (
            <div className="picker-section" style={{ minWidth: 240 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Select themes to rank</div>
                <div className="picker-actions">
                  <button onClick={() => setActiveCustomThemes(Object.keys(CUSTOM_THEMES))}>All</button>
                  <button onClick={() => setActiveCustomThemes([])}>None</button>
                </div>
              </div>
              {Object.keys(CUSTOM_THEMES).map(name => {
                const count = DATA.filter(CUSTOM_THEMES[name]).length;
                return (
                  <label
                    key={name}
                    className={`picker-label ${activeCustomThemes.includes(name) ? 'picker-label-active' : 'picker-label-inactive'}`}
                  >
                    <input
                      type="checkbox"
                      checked={activeCustomThemes.includes(name)}
                      onChange={() => toggleCustom(name)}
                    />
                    <span style={{ flex: 1 }}>{name}</span>
                    <span className="picker-count">{count}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Panels */}
      <div className={`panel-grid ${activeDims.length <= 2 ? 'panel-grid-1' : 'panel-grid-2'}`}
        style={activeDims.length === 1 ? {} : activeDims.length <= 2 ? { gridTemplateColumns: `repeat(${activeDims.length}, 1fr)` } : {}}
      >
        {activeDims.map(d => (
          <RankedPanel
            key={d}
            title={ALL_DIM_LABELS[d]}
            dimKey={d}
            sortKey={sortKey}
            showChg={showChg}
            sortFmt={sortOpt.fmt}
            activeCustomThemes={activeCustomThemes}
            onThemeClick={onThemeClick}
          />
        ))}
      </div>

      {activeDims.length === 0 && (
        <div className="empty-state">Select dimensions above to populate the dashboard</div>
      )}
    </div>
  );
}
