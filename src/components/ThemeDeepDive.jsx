import { useMemo, useState } from 'react';
import { getThemeScenarios } from '../data.js';
import { ScreenHeader, Legend } from './HelpPanel.jsx';
import { SCREENS, QUANTITIES, CONCEPTS, DEFENSE_CYCLE, fmt } from '../terminology.js';

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

// Translate internal phase gap labels to clean language
function cleanPhaseGap(detail) {
  return detail
    .replace(/See/g, 'Observe')
    .replace(/Evaluate/g, 'Assess')
    .replace(/Act/g, 'Respond')
    .replace(/Achieve/g, 'Verify')
    .replace(/phase gap/gi, 'phase gap');
}

function DriverSection({ title, subtitle, items, maxItems, colorClass, scenarioCount, showALE }) {
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
        {subtitle && (
          <div style={{ padding: '6px 12px 0', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {subtitle}
          </div>
        )}
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
                    {showALE && <span style={{ marginLeft: 8, fontWeight: 600 }}>{fmt.dollars(item.totalRALE)}</span>}
                  </div>
                </div>
                <div style={{ height: 4, background: '#f3f0e9', borderRadius: 2, marginTop: 4, marginBottom: item.details ? 4 : 0 }}>
                  <div style={{ height: '100%', width: `${barW}%`, borderRadius: 2, background: 'currentColor', opacity: 0.3, transition: 'width 0.3s' }} />
                </div>
                {item.details && item.details.length > 0 && (
                  <div className="driver-row-detail">{item.details.map(cleanPhaseGap).join(' · ')}</div>
                )}
                <div className="driver-row-detail">Scenarios: {item.scenarioIds.join(', ')}</div>
              </div>
            );
          })}
          {hasMore && (
            <button className="btn" style={{ marginTop: 4, fontSize: 10 }}
              onClick={() => setShowAll(!showAll)}>
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
  const universalWeaknesses = weaknesses.filter(w => w.count === scenarios.length);
  const topObjectives = objectives.filter(o => o.count >= Math.ceil(scenarios.length * 0.5));

  if (scenarios.length === 0) {
    return <div className="empty-state">No scenarios match theme "{themeName}"</div>;
  }

  return (
    <div>
      <ScreenHeader
        title={`${themeName} — ${SCREENS.deepdive.title}`}
        subtitle={SCREENS.deepdive.subtitle}
        help={SCREENS.deepdive.help}
      />

      {/* Scenarios in this theme */}
      <div className="deepdive-section">
        <div className="card">
          <div className="card-header">
            <span className="card-header-title">Attack scenarios in this theme</span>
            <span className="card-header-value" style={{ color: 'var(--gold)' }}>
              {fmt.dollars(totalRALE)} total net annual exposure
            </span>
          </div>
          <div style={{ padding: 12 }}>
            <div className="deepdive-scenarios">
              {sorted.map(s => {
                const pct = totalRALE > 0 ? (s.rALE / totalRALE) * 100 : 0;
                return (
                  <div key={s.id} className="deepdive-scenario-card bg-blue">
                    <div className="deepdive-scenario-id">{s.id}</div>
                    <div className="deepdive-scenario-name">{s.name}</div>
                    <div className="deepdive-scenario-value" style={{ color: 'var(--blue-dark)' }}>
                      {fmt.dollars(s.rALE)}
                      <span className="deepdive-scenario-pct"> ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--blue-dark)', opacity: 0.6, marginTop: 2 }}>
                      Likelihood: {s.rF.toFixed(2)}/3yr · Impact: {fmt.dollars(s.rM)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Investment Signal — cross-scenario leverage */}
      {(universalWeaknesses.length > 0 || topObjectives.length > 0) && (
        <div className="callout bg-teal" style={{ marginBottom: 16 }}>
          <div className="callout-title">Investment signal — where one action reduces risk across the entire theme</div>
          {universalWeaknesses.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <strong>Vulnerabilities present in ALL {scenarios.length} scenarios</strong> — addressing any one of these
              removes a required attack ingredient from every scenario in this theme:
              <ul style={{ margin: '4px 0 0 16px', lineHeight: 1.8 }}>
                {universalWeaknesses.map(w => (
                  <li key={w.name}>{w.name} — {fmt.dollars(w.totalRALE)} aggregate exposure</li>
                ))}
              </ul>
            </div>
          )}
          {topObjectives.length > 0 && (
            <div>
              <strong>Defensive positions used by ≥50% of scenarios</strong> — strengthening these defenses
              benefits the broadest set of attack paths:
              <ul style={{ margin: '4px 0 0 16px', lineHeight: 1.8 }}>
                {topObjectives.map(o => (
                  <li key={o.name}>{o.name} — {o.count}/{scenarios.length} scenarios</li>
                ))}
              </ul>
            </div>
          )}
          {gaps.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <strong>Highest-priority gap:</strong> {gaps[0].objective} has incomplete defense
              in {gaps[0].count} scenario{gaps[0].count > 1 ? 's' : ''} ({gaps[0].details.map(cleanPhaseGap).join('; ')}),
              affecting {fmt.dollars(gaps[0].totalRALE)} in exposure. Completing this defense cycle is the
              single highest-leverage investment for this theme.
            </div>
          )}
        </div>
      )}

      {/* Defense gaps — the key diagnostic */}
      <div className="deepdive-section">
        <div className="card">
          <div className="card-header" style={{ background: '#791F1F' }}>
            <span className="card-header-title">Incomplete defenses across theme scenarios</span>
            <span className="card-header-meta">{gaps.length} positions with gaps</span>
          </div>
          <div style={{ padding: '4px 12px 8px' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-muted)', padding: '6px 0 8px', lineHeight: 1.5 }}>
              Positions where the defense cycle (Observe → Assess → Respond → Verify) does not complete.
              An incomplete defense at a position means the organization cannot effectively protect against
              the attack steps that traverse it.
            </div>
            {gaps.length === 0 && (
              <div className="empty-state" style={{ padding: 20 }}>All defenses complete for this theme</div>
            )}
            {gaps.map((gap, i) => {
              const pct = scenarios.length > 0 ? ((gap.count / scenarios.length) * 100).toFixed(0) : 0;
              const barW = scenarios.length > 0 ? (gap.count / scenarios.length) * 100 : 0;
              return (
                <div key={gap.objective} className="driver-row bg-red">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div className="driver-row-title">
                      <span className="driver-rank">{i + 1}.</span>{gap.objective}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {gap.count}/{scenarios.length} scenarios ({pct}%) · {fmt.dollars(gap.totalRALE)} at risk
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2, marginTop: 4, marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${barW}%`, borderRadius: 2, background: '#E24B4A', opacity: 0.4, transition: 'width 0.3s' }} />
                  </div>
                  <div className="driver-row-detail">Missing phases: {gap.details.map(cleanPhaseGap).join(' · ')}</div>
                  <div className="driver-row-detail">Affected scenarios: {gap.scenarioIds.join(', ')}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DriverSection
        title="Vulnerabilities exploited across theme scenarios"
        subtitle="Environmental conditions that enable attacks. Vulnerabilities appearing in more scenarios have higher remediation leverage — fixing one removes an attack requirement from every scenario that depends on it."
        items={weaknesses} maxItems={8} colorClass="bg-coral" scenarioCount={scenarios.length} showALE
      />

      <DriverSection
        title="Defensive positions traversed across theme scenarios"
        subtitle="The security positions that must function effectively to defend against this theme's attack paths."
        items={objectives} maxItems={8} colorClass="bg-purple" scenarioCount={scenarios.length} showALE={false}
      />

      <DriverSection
        title="Systems and assets at risk across theme scenarios"
        subtitle="The infrastructure, applications, and data stores targeted by attacks in this theme."
        items={assets} maxItems={8} colorClass="bg-blue" scenarioCount={scenarios.length} showALE
      />

      <DriverSection
        title="Attack methods employed across theme scenarios"
        subtitle="The techniques attackers use across scenarios in this theme."
        items={ttps} maxItems={8} colorClass="bg-amber" scenarioCount={scenarios.length} showALE={false}
      />
    </div>
  );
}
