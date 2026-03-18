import { useMemo, useState } from 'react';
import { getThemeScenarios } from '../data.js';

function countAcross(scenarios, field) {
  const map = {};
  scenarios.forEach(s => {
    (s[field] || []).forEach(item => {
      if (!map[item]) map[item] = { name: item, count: 0, scenarioIds: [], totalRALE: 0 };
      map[item].count++;
      map[item].scenarioIds.push(s.id);
      map[item].totalRALE += s.rALE;
    });
  });
  return Object.values(map).sort((a, b) => b.count - a.count || b.totalRALE - a.totalRALE);
}

function countGaps(scenarios) {
  const map = {};
  scenarios.forEach(s => {
    (s.controlGaps || []).forEach(gap => {
      // Parse "Objective: phase description"
      const colonIdx = gap.indexOf(':');
      const obj = colonIdx > 0 ? gap.substring(0, colonIdx).trim() : gap;
      const detail = colonIdx > 0 ? gap.substring(colonIdx + 1).trim() : '';
      const key = obj;
      if (!map[key]) map[key] = { objective: obj, details: [], count: 0, scenarioIds: [], totalRALE: 0 };
      map[key].count++;
      map[key].scenarioIds.push(s.id);
      map[key].totalRALE += s.rALE;
      if (detail && !map[key].details.includes(detail)) map[key].details.push(detail);
    });
  });
  return Object.values(map).sort((a, b) => b.count - a.count || b.totalRALE - a.totalRALE);
}

function DriverSection({ title, items, maxItems, colorClass, scenarioCount, showALE }) {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? items : items.slice(0, maxItems || 8);
  const hasMore = items.length > (maxItems || 8);

  return (
    <div className="deepdive-section">
      <div className="card">
        <div className="card-header">
          <span className="card-header-title">{title}</span>
          <span className="card-header-meta">{items.length} unique across theme</span>
        </div>
        <div style={{ padding: '8px 12px' }}>
          {display.map((item, i) => {
            const pct = scenarioCount > 0 ? ((item.count / scenarioCount) * 100).toFixed(0) : 0;
            const barW = scenarioCount > 0 ? (item.count / scenarioCount) * 100 : 0;
            return (
              <div key={item.name || item.objective} className={`driver-row ${colorClass}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="driver-row-title">
                    <span className="driver-rank">{i + 1}.</span>
                    {item.name || item.objective}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {item.count}/{scenarioCount} scenarios ({pct}%)
                    {showALE && <span style={{ marginLeft: 8, fontWeight: 600 }}>${item.totalRALE.toFixed(1)}M</span>}
                  </div>
                </div>
                {/* Bar */}
                <div style={{ height: 4, background: '#f3f0e9', borderRadius: 2, marginTop: 4, marginBottom: item.details ? 4 : 0 }}>
                  <div style={{ height: '100%', width: `${barW}%`, borderRadius: 2, background: 'currentColor', opacity: 0.3, transition: 'width 0.3s' }} />
                </div>
                {item.details && item.details.length > 0 && (
                  <div className="driver-row-detail">
                    {item.details.join(' · ')}
                  </div>
                )}
                <div className="driver-row-detail">
                  Scenarios: {item.scenarioIds.join(', ')}
                </div>
              </div>
            );
          })}
          {hasMore && (
            <button
              className="btn"
              style={{ marginTop: 4, fontSize: 10 }}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show fewer' : `Show all ${items.length}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ThemeDeepDive({ themeName, userThemes = [] }) {
  const scenarios = useMemo(() => getThemeScenarios(themeName, userThemes), [themeName, userThemes]);

  const objectives = useMemo(() => countAcross(scenarios, 'objectives'), [scenarios]);
  const weaknesses = useMemo(() => countAcross(scenarios, 'weaknesses'), [scenarios]);
  const assets = useMemo(() => countAcross(scenarios, 'assets'), [scenarios]);
  const ttps = useMemo(() => countAcross(scenarios, 'ttps'), [scenarios]);
  const gaps = useMemo(() => countGaps(scenarios), [scenarios]);

  const sorted = useMemo(() => [...scenarios].sort((a, b) => b.rALE - a.rALE), [scenarios]);
  const totalRALE = sorted.reduce((a, s) => a + s.rALE, 0);

  // Find weaknesses appearing in ALL scenarios (highest leverage)
  const universalWeaknesses = weaknesses.filter(w => w.count === scenarios.length);
  // Find objectives appearing in most scenarios
  const topObjectives = objectives.filter(o => o.count >= Math.ceil(scenarios.length * 0.5));

  if (scenarios.length === 0) {
    return <div className="empty-state">No scenarios match theme "{themeName}"</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-title">{themeName} — structural decomposition</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
          What is driving this theme's risk across {scenarios.length} scenarios — control objectives, weaknesses, assets, and control gaps.
        </div>
      </div>

      {/* Panel 1: Scenarios in theme */}
      <div className="deepdive-section">
        <div className="card">
          <div className="card-header">
            <span className="card-header-title">Scenarios in this theme</span>
            <span className="card-header-value" style={{ color: 'var(--gold)' }}>
              ${totalRALE.toFixed(1)}M total residual ALE
            </span>
          </div>
          <div style={{ padding: 12 }}>
            <div className="deepdive-scenarios">
              {sorted.map((s, i) => {
                const pct = totalRALE > 0 ? (s.rALE / totalRALE) * 100 : 0;
                return (
                  <div key={s.id} className="deepdive-scenario-card bg-blue">
                    <div className="deepdive-scenario-id">{s.id}</div>
                    <div className="deepdive-scenario-name">{s.name}</div>
                    <div className="deepdive-scenario-value" style={{ color: 'var(--blue-dark)' }}>
                      ${s.rALE.toFixed(1)}M
                      <span className="deepdive-scenario-pct"> ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--blue-dark)', opacity: 0.6, marginTop: 2 }}>
                      F: {s.rF.toFixed(2)}/3yr · M: ${s.rM.toFixed(1)}M
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Investment signal callout — positioned for executive summary */}
      {(universalWeaknesses.length > 0 || topObjectives.length > 0) && (
        <div className="callout bg-teal" style={{ marginBottom: 16 }}>
          <div className="callout-title">Investment signal — cross-scenario leverage</div>
          {universalWeaknesses.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <strong>Weaknesses appearing in ALL {scenarios.length} scenarios</strong> (highest leverage for condition removal — one condition addressed reduces risk across every scenario in this theme):
              <ul style={{ margin: '4px 0 0 16px', lineHeight: 1.8 }}>
                {universalWeaknesses.map(w => (
                  <li key={w.name}>{w.name} — ${w.totalRALE.toFixed(1)}M aggregate exposure</li>
                ))}
              </ul>
            </div>
          )}
          {topObjectives.length > 0 && (
            <div>
              <strong>Control objectives traversed by ≥50% of scenarios</strong> (positions where strengthening the See/Evaluate/Act/Achieve cycle benefits the broadest set of attack chains):
              <ul style={{ margin: '4px 0 0 16px', lineHeight: 1.8 }}>
                {topObjectives.map(o => (
                  <li key={o.name}>{o.name} — {o.count}/{scenarios.length} scenarios</li>
                ))}
              </ul>
            </div>
          )}
          {gaps.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <strong>Priority gap</strong>: {gaps[0].objective} has open cycle phases in {gaps[0].count} scenario{gaps[0].count > 1 ? 's' : ''} ({gaps[0].details.join('; ')}), affecting ${gaps[0].totalRALE.toFixed(1)}M in residual ALE. Closing this cycle is the highest-leverage single investment for this theme.
            </div>
          )}
        </div>
      )}

      {/* Panel 2: Control gaps — THE KEY DIAGNOSTIC */}
      <div className="deepdive-section">
        <div className="card">
          <div className="card-header" style={{ background: '#791F1F' }}>
            <span className="card-header-title">Control gaps across theme scenarios</span>
            <span className="card-header-meta">{gaps.length} objectives with phase gaps</span>
          </div>
          <div style={{ padding: '8px 12px' }}>
            {gaps.length === 0 && (
              <div className="empty-state" style={{ padding: 20 }}>No control gaps identified</div>
            )}
            {gaps.map((gap, i) => {
              const pct = scenarios.length > 0 ? ((gap.count / scenarios.length) * 100).toFixed(0) : 0;
              const barW = scenarios.length > 0 ? (gap.count / scenarios.length) * 100 : 0;
              return (
                <div key={gap.objective} className="driver-row bg-red">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div className="driver-row-title">
                      <span className="driver-rank">{i + 1}.</span>
                      {gap.objective}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {gap.count}/{scenarios.length} scenarios ({pct}%) · ${gap.totalRALE.toFixed(1)}M at risk
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2, marginTop: 4, marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${barW}%`, borderRadius: 2, background: '#E24B4A', opacity: 0.4, transition: 'width 0.3s' }} />
                  </div>
                  <div className="driver-row-detail">
                    Phase gaps: {gap.details.join(' · ')}
                  </div>
                  <div className="driver-row-detail">
                    Affected scenarios: {gap.scenarioIds.join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel 3: Weaknesses — what conditions enable these attacks */}
      <DriverSection
        title="Weaknesses exploited across theme scenarios"
        items={weaknesses}
        maxItems={8}
        colorClass="bg-coral"
        scenarioCount={scenarios.length}
        showALE
      />

      {/* Panel 4: Control objectives traversed */}
      <DriverSection
        title="Control objectives traversed across theme scenarios"
        items={objectives}
        maxItems={8}
        colorClass="bg-purple"
        scenarioCount={scenarios.length}
        showALE={false}
      />

      {/* Panel 5: Assets at risk */}
      <DriverSection
        title="Assets at risk across theme scenarios"
        items={assets}
        maxItems={8}
        colorClass="bg-blue"
        scenarioCount={scenarios.length}
        showALE
      />

      {/* Panel 6: TTP classes employed */}
      <DriverSection
        title="TTP classes employed across theme scenarios"
        items={ttps}
        maxItems={8}
        colorClass="bg-amber"
        scenarioCount={scenarios.length}
        showALE={false}
      />


    </div>
  );
}
