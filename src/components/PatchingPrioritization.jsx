import { useState, useMemo, Fragment } from 'react';
import { DATA, CUSTOM_THEMES, buildUserThemeFilter } from '../data.js';

// Extract all weakness classes with their scenario bindings
function buildWeaknessData(scenarios) {
  const map = {};
  scenarios.forEach(s => {
    (s.weaknesses || []).forEach(w => {
      if (!map[w]) map[w] = { name: w, scenarioIds: new Set(), scenarios: [], totalRALE: 0 };
      if (!map[w].scenarioIds.has(s.id)) {
        map[w].scenarioIds.add(s.id);
        map[w].scenarios.push(s);
        map[w].totalRALE += s.rALE;
      }
    });
  });
  return Object.values(map).sort((a, b) => b.scenarios.length - a.scenarios.length || b.totalRALE - a.totalRALE);
}

// Simulate the effect of reducing a weakness condition's prevalence on susceptibility.
// CRITICAL: rALE already reflects the current control environment. We only model the DELTA
// from current prevalence to adjusted prevalence. When adj === current, multiplier = 1.0 (no change).
function computeProjectedALE(scenarios, adjustments, currentValues) {
  return scenarios.map(s => {
    const weaknesses = s.weaknesses || [];
    if (weaknesses.length === 0) return { ...s, projRALE: s.rALE, delta: 0 };

    // Each weakness contributes equally to susceptibility (simplification for demo).
    // The multiplier starts at 1.0 (current state). Moving a slider changes the
    // ratio adj/current for that weakness's contribution.
    let susceptibilityMultiplier = 1;
    weaknesses.forEach(w => {
      const adj = adjustments[w];
      const cur = currentValues[w];
      if (adj !== undefined && cur !== undefined && cur > 0) {
        // Ratio of change: adj/cur. If unchanged, ratio = 1, no effect.
        // If reduced from 70 to 35, ratio = 0.5 -> that weakness's contribution halved.
        const ratio = adj / cur;
        const contribution = 1 / weaknesses.length;
        // How much this weakness's change affects the overall multiplier
        const d = contribution * (1 - ratio);
        susceptibilityMultiplier -= d;
      }
    });
    susceptibilityMultiplier = Math.max(0.05, Math.min(2.0, susceptibilityMultiplier)); // floor 5%, cap 200%

    const projRALE = s.rALE * susceptibilityMultiplier;
    return { ...s, projRALE, delta: projRALE - s.rALE };
  });
}

export default function PatchingPrioritization({ userThemes = [] }) {
  const [scope, setScope] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('Ransomware & Extortion');
  // Adjustments: { weaknessName: adjustedPrevalence (0-100) }
  // Only present for sliders the user has moved
  const [adjustments, setAdjustments] = useState({});

  // Determine in-scope scenarios
  const scopeScenarios = useMemo(() => {
    if (scope === 'all') return DATA;
    const userTheme = userThemes.find(t => t.name === selectedTheme);
    if (userTheme) return DATA.filter(buildUserThemeFilter(userTheme.criteria));
    const builtIn = CUSTOM_THEMES[selectedTheme];
    if (builtIn) return DATA.filter(builtIn);
    return DATA;
  }, [scope, selectedTheme, userThemes]);

  // Build weakness data for in-scope scenarios
  const weaknesses = useMemo(() => buildWeaknessData(scopeScenarios), [scopeScenarios]);

  // Assign "current" prevalence values (simulated)
  const currentValues = useMemo(() => {
    const vals = {};
    weaknesses.forEach(w => {
      const ratio = w.scenarios.length / scopeScenarios.length;
      vals[w.name] = Math.round(40 + ratio * 45); // 40-85% range
    });
    return vals;
  }, [weaknesses, scopeScenarios]);

  // Build effective adjustments (current values with user overrides)
  const effectiveAdj = useMemo(() => {
    const eff = {};
    weaknesses.forEach(w => {
      eff[w.name] = adjustments[w.name] !== undefined ? adjustments[w.name] : currentValues[w.name];
    });
    return eff;
  }, [weaknesses, adjustments, currentValues]);

  // Compute projected scenario ALEs — pass currentValues so the function can compute ratios
  const projected = useMemo(
    () => computeProjectedALE(scopeScenarios, effectiveAdj, currentValues),
    [scopeScenarios, effectiveAdj, currentValues]
  );

  const currentTotalALE = scopeScenarios.reduce((a, s) => a + s.rALE, 0);
  const projectedTotalALE = projected.reduce((a, s) => a + s.projRALE, 0);
  const totalDelta = projectedTotalALE - currentTotalALE;
  const hasChanges = Object.keys(adjustments).length > 0;

  const handleSlider = (name, val) => {
    setAdjustments(prev => {
      const next = { ...prev };
      if (val === currentValues[name]) {
        delete next[name];
      } else {
        next[name] = val;
      }
      return next;
    });
  };

  const resetAll = () => setAdjustments({});

  // Sort projected scenarios by delta (biggest improvement first)
  const sortedProjected = [...projected].sort((a, b) => a.delta - b.delta);
  const maxRALE = Math.max(...scopeScenarios.map(s => s.rALE), 1);

  return (
    <div>
      {/* Scope selector + summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="toggle-group">
          <button
            className={`toggle-btn ${scope === 'all' ? 'toggle-btn-active' : ''}`}
            onClick={() => setScope('all')}
          >All scenarios</button>
          <button
            className={`toggle-btn ${scope === 'theme' ? 'toggle-btn-active' : ''}`}
            onClick={() => setScope('theme')}
          >By single theme</button>
        </div>
        {scope === 'theme' && (
          <select
            value={selectedTheme}
            onChange={e => { setSelectedTheme(e.target.value); setAdjustments({}); }}
            className="theme-dropdown"
          >
            <optgroup label="Built-in themes">
              {Object.keys(CUSTOM_THEMES).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </optgroup>
            {userThemes.length > 0 && (
              <optgroup label="Your themes">
                {userThemes.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        )}
        {hasChanges && (
          <button className="btn" onClick={resetAll} style={{ fontSize: 10 }}>
            Reset all to current
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
          padding: '8px 14px', fontFamily: 'var(--mono)', flex: '1 1 140px',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
            Scenarios in scope
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{scopeScenarios.length}</div>
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
          padding: '8px 14px', fontFamily: 'var(--mono)', flex: '1 1 140px',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
            Weakness conditions
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{weaknesses.length}</div>
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
          padding: '8px 14px', fontFamily: 'var(--mono)', flex: '1 1 140px',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
            Current residual ALE
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--coral)' }}>${currentTotalALE.toFixed(1)}M</div>
        </div>
        <div style={{
          background: hasChanges ? 'var(--teal-bg)' : 'var(--bg-card)',
          border: `1px solid ${hasChanges ? '#9FE1CB' : 'var(--border)'}`,
          borderRadius: 3, padding: '8px 14px', fontFamily: 'var(--mono)', flex: '1 1 180px',
        }}>
          <div style={{ fontSize: 9, color: hasChanges ? 'var(--teal-dark)' : 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
            {hasChanges ? 'Projected residual ALE' : 'No changes modeled'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: hasChanges ? 'var(--teal)' : 'var(--text-dim)' }}>
            {hasChanges
              ? `$${projectedTotalALE.toFixed(1)}M (${totalDelta >= 0 ? '+' : '\u2212'}$${Math.abs(totalDelta).toFixed(1)}M)`
              : '\u2014'
            }
          </div>
        </div>
      </div>

      {/* Main two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 16 }}>

        {/* Left: weakness sliders */}
        <div style={{ paddingRight: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-header-title">Weakness condition prevalence</span>
              <span className="card-header-meta">Drag sliders to model reduction</span>
            </div>
            <div style={{ padding: '6px 0' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 1fr 50px 50px',
                padding: '4px 12px', fontSize: 9, color: 'var(--text-muted)',
                letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'var(--mono)',
                borderBottom: '1px solid var(--border-light)',
              }}>
                <span>#</span>
                <span>Condition</span>
                <span>Prevalence</span>
                <span style={{ textAlign: 'right' }}>Now</span>
                <span style={{ textAlign: 'right' }}>Adj</span>
              </div>
              {weaknesses.map((w, i) => {
                const current = currentValues[w.name] || 50;
                const adjusted = effectiveAdj[w.name] ?? current;
                const isChanged = adjustments[w.name] !== undefined;
                const isReduced = adjusted < current;
                return (
                  <div
                    key={w.name}
                    style={{
                      display: 'grid', gridTemplateColumns: '28px 1fr 1fr 50px 50px',
                      padding: '6px 12px', fontFamily: 'var(--mono)', fontSize: 11,
                      alignItems: 'center',
                      borderBottom: i < weaknesses.length - 1 ? '1px solid var(--border-light)' : 'none',
                      background: isChanged ? (isReduced ? 'var(--teal-bg)' : 'var(--coral-bg)') : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 700 }}>
                      {w.scenarios.length}/{scopeScenarios.length}
                    </span>
                    <div>
                      <div style={{
                        fontSize: 11, fontWeight: 500,
                        color: w.scenarios.length === scopeScenarios.length ? 'var(--navy)' : 'var(--text)',
                      }}>
                        {w.name}
                      </div>
                      {w.scenarios.length === scopeScenarios.length && (
                        <div style={{ fontSize: 9, color: 'var(--teal)', fontWeight: 600 }}>
                          All scenarios — highest leverage
                        </div>
                      )}
                    </div>
                    <div style={{ paddingRight: 8 }}>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={adjusted}
                        onChange={e => handleSlider(w.name, Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <span style={{
                      textAlign: 'right', fontSize: 10, color: 'var(--text-muted)',
                    }}>
                      {current}%
                    </span>
                    <span style={{
                      textAlign: 'right', fontSize: 10, fontWeight: 600,
                      color: isChanged ? (isReduced ? 'var(--teal)' : 'var(--coral)') : 'var(--text-dim)',
                    }}>
                      {adjusted}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: 6, lineHeight: 1.6 }}>
            Lower prevalence = condition removed from more of the environment.
            Each condition's reduction affects every scenario where it's a conjunction leg.
            Conditions appearing in all scenarios (marked "highest leverage") have the broadest impact.
          </div>
        </div>

        {/* Right: impact chart */}
        <div style={{ paddingLeft: 16, borderLeft: '1px solid var(--border)' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-header-title">Scenario impact — current vs. projected ALE</span>
              <span className="card-header-meta">Sorted by improvement</span>
            </div>
            <div style={{ padding: '8px 12px' }}>
              {sortedProjected.map((s, i) => {
                const currentW = (s.rALE / maxRALE) * 100;
                const projW = (s.projRALE / maxRALE) * 100;
                const improved = s.delta < -0.01;
                const worsened = s.delta > 0.01;
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: '6px 0',
                      borderBottom: i < sortedProjected.length - 1 ? '1px solid var(--border-light)' : 'none',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                      <div style={{ fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-dim)', marginRight: 4 }}>{s.id}</span>
                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                      </div>
                      <div style={{ fontSize: 10, whiteSpace: 'nowrap', marginLeft: 8 }}>
                        <span style={{ color: 'var(--text-muted)' }}>${s.rALE.toFixed(1)}M</span>
                        {hasChanges && (
                          <span style={{
                            marginLeft: 6, fontWeight: 600,
                            color: improved ? 'var(--teal)' : worsened ? 'var(--coral)' : 'var(--text-dim)',
                          }}>
                            {'\u2192'} ${s.projRALE.toFixed(1)}M
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Dual bar */}
                    <div style={{
                      height: 10, background: 'var(--bg-surface)', borderRadius: 2, position: 'relative',
                    }}>
                      {/* Current (faded) */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, height: '100%',
                        width: `${currentW}%`, background: 'var(--coral)', opacity: 0.2,
                        borderRadius: 2,
                      }} />
                      {/* Projected (solid) */}
                      {hasChanges && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, height: '100%',
                          width: `${projW}%`,
                          background: improved ? 'var(--teal)' : 'var(--coral)',
                          opacity: 0.5, borderRadius: 2,
                          transition: 'width 0.2s',
                        }} />
                      )}
                    </div>
                    {hasChanges && improved && (
                      <div style={{ fontSize: 9, color: 'var(--teal)', marginTop: 2 }}>
                        {'\u2212'}${Math.abs(s.delta).toFixed(1)}M ({((s.delta / s.rALE) * 100).toFixed(0)}% reduction)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Waterfall summary */}
          {hasChanges && (
            <div className="callout bg-teal" style={{ marginTop: 12 }}>
              <div className="callout-title">Projected impact summary</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.8 }}>
                {Object.entries(adjustments)
                  .filter(([, v]) => v !== undefined)
                  .sort((a, b) => {
                    const aW = weaknesses.find(w => w.name === a[0]);
                    const bW = weaknesses.find(w => w.name === b[0]);
                    return (bW?.scenarios.length || 0) - (aW?.scenarios.length || 0);
                  })
                  .map(([name, val]) => {
                    const w = weaknesses.find(x => x.name === name);
                    const current = currentValues[name] || 50;
                    const direction = val < current ? 'Reduced' : 'Increased';
                    return (
                      <div key={name}>
                        <strong>{name}</strong>: {direction} {current}% {'\u2192'} {val}%
                        {w && <span style={{ color: 'var(--text-muted)' }}> {'\u00b7'} Affects {w.scenarios.length} scenario{w.scenarios.length !== 1 ? 's' : ''}</span>}
                      </div>
                    );
                  })
                }
                <div style={{ borderTop: '1px solid #9FE1CB', paddingTop: 6, marginTop: 6, fontWeight: 600 }}>
                  Net change: {totalDelta >= 0 ? '+' : '\u2212'}${Math.abs(totalDelta).toFixed(1)}M
                  ({((totalDelta / currentTotalALE) * 100).toFixed(1)}%)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
