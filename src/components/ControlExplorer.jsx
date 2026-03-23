import { useState, useMemo } from 'react';
import { SCENARIOS } from '../data.js';
import { ScreenHeader, Legend, Tip } from './HelpPanel.jsx';
import { SCREENS, DEFENSE_CYCLE, POSITIONS, POSTURES, ATTACK, CONCEPTS, STATUS, fmt } from '../terminology.js';
import {
  OBJECTIVES, GRID_ROWS, GRID_COLS, PHASES, STAGES,
  getMappingsForObjective, computeCycleStatus,
  getObjectiveGrid, computeModelDrivenMetrics, CIS_MAPPINGS,
} from '../controlModel.js';

const P = DEFENSE_CYCLE.phases;
const STAGE_COLORS = {
  "Initial Access": { bg: '#E6F1FB', text: '#0C447C', border: '#378ADD' },
  "Transit":        { bg: '#FAEEDA', text: '#633806', border: '#BA7517' },
  "Payoff":         { bg: '#FCEBEB', text: '#791F1F', border: '#E24B4A' },
};

function PhaseIndicator({ phase, covered, small }) {
  const size = small ? 14 : 18;
  const info = P[phase];
  return (
    <div title={`${info.label}: ${covered ? 'Covered' : 'GAP — ' + info.tip}`} style={{
      width: size, height: size, borderRadius: 2,
      background: covered ? (phase === 'act' || phase === 'achieve' ? 'var(--teal)' : 'var(--blue)') : 'var(--bg-surface)',
      border: `1px solid ${covered ? 'transparent' : 'var(--border)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: small ? 7 : 8, fontWeight: 700, fontFamily: 'var(--mono)',
      color: covered ? '#fff' : 'var(--text-dim)',
    }}>
      {info.abbr}
    </div>
  );
}

function GridCell({ cell }) {
  if (cell.empty) {
    return (
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 3, padding: 10,
        border: '1px dashed var(--border-light)', minHeight: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic',
      }}>
        No controls mapped
      </div>
    );
  }
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 3, padding: 10,
      border: '1px solid var(--border)', minHeight: 80,
    }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
        {PHASES.map(p => <PhaseIndicator key={p} phase={p} covered={cell.phases[p]} small />)}
      </div>
      {cell.mappings.map(m => (
        <div key={m.id} style={{
          fontSize: 10, fontFamily: 'var(--mono)', marginBottom: 4,
          color: m.effectiveness > 60 ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.4,
        }}>
          <div style={{ fontWeight: 600, fontSize: 9, color: 'var(--text-dim)' }}>CIS {m.cisControl}.x</div>
          <div>{m.safeguard}</div>
          <div style={{ height: 3, background: 'var(--bg-surface)', borderRadius: 1, marginTop: 3 }}>
            <div style={{
              height: '100%', borderRadius: 1, transition: 'width 0.2s',
              width: `${m.effectiveness}%`,
              background: m.effectiveness > 70 ? 'var(--teal)' : m.effectiveness > 40 ? 'var(--amber)' : 'var(--coral)',
            }} />
          </div>
        </div>
      ))}
      <div style={{
        fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', marginTop: 4,
        color: cell.avgEffectiveness > 60 ? 'var(--teal)' : cell.avgEffectiveness > 40 ? 'var(--amber)' : 'var(--coral)',
      }}>
        {cell.avgEffectiveness}% avg
      </div>
    </div>
  );
}

export default function ControlExplorer({ overrides = {}, setOverrides }) {
  const [selectedObjId, setSelectedObjId] = useState('OBJ-01');

  const obj = OBJECTIVES.find(o => o.id === selectedObjId);
  const stageColor = STAGE_COLORS[obj?.stage] || STAGE_COLORS["Initial Access"];
  const stageLabel = ATTACK.stages[obj?.stage]?.label || obj?.stage;

  const cycle = useMemo(() => computeCycleStatus(selectedObjId, overrides), [selectedObjId, overrides]);
  const grid = useMemo(() => getObjectiveGrid(selectedObjId, overrides), [selectedObjId, overrides]);
  const mappings = useMemo(() => getMappingsForObjective(selectedObjId, overrides), [selectedObjId, overrides]);

  const affectedScenarios = useMemo(() =>
    SCENARIOS.filter(s => (s.objectives || []).includes(obj?.name)), [obj]);

  const scenarioImpact = useMemo(() => {
    return affectedScenarios.map(s => {
      const baseline = computeModelDrivenMetrics(s, {});
      const modified = computeModelDrivenMetrics(s, overrides);
      return {
        id: s.id, name: s.name,
        baselineRALE: baseline.rALE, modifiedRALE: modified.rALE,
        delta: modified.rALE - baseline.rALE,
        deltaPct: baseline.rALE > 0 ? ((modified.rALE - baseline.rALE) / baseline.rALE) * 100 : 0,
      };
    }).sort((a, b) => a.delta - b.delta);
  }, [affectedScenarios, overrides]);

  const totalBaselineALE = scenarioImpact.reduce((a, s) => a + s.baselineRALE, 0);
  const totalModifiedALE = scenarioImpact.reduce((a, s) => a + s.modifiedRALE, 0);
  const totalDelta = totalModifiedALE - totalBaselineALE;
  const hasOverrides = Object.keys(overrides).length > 0;

  const handleSlider = (cisId, value) => {
    setOverrides(prev => {
      const defaults = CIS_MAPPINGS.find(m => m.id === cisId);
      if (defaults && value === defaults.effectiveness) {
        const next = { ...prev };
        delete next[cisId];
        return next;
      }
      return { ...prev, [cisId]: value };
    });
  };

  const objsByStage = useMemo(() => {
    const groups = {};
    OBJECTIVES.forEach(o => {
      if (!groups[o.stage]) groups[o.stage] = [];
      groups[o.stage].push(o);
    });
    return groups;
  }, []);

  return (
    <div>
      <ScreenHeader
        title={SCREENS.controls.title}
        subtitle={SCREENS.controls.subtitle}
        help={SCREENS.controls.help}
      />

      {/* Defensive position selector */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 8 }}>Select a defensive position</div>
        {STAGES.map(stage => {
          const sl = ATTACK.stages[stage];
          return (
            <div key={stage} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: '1.5px', textTransform: 'uppercase',
                color: STAGE_COLORS[stage].text, fontWeight: 700, marginBottom: 4, paddingLeft: 2,
              }}>
                {sl.label} <span style={{ fontWeight: 400, opacity: 0.6 }}>— {sl.tip}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(objsByStage[stage] || []).map(o => {
                  const oC = computeCycleStatus(o.id, overrides);
                  const isSelected = o.id === selectedObjId;
                  return (
                    <button key={o.id} onClick={() => setSelectedObjId(o.id)} style={{
                      background: isSelected ? STAGE_COLORS[stage].border : 'var(--bg-card)',
                      color: isSelected ? '#fff' : 'var(--text)',
                      border: `1px solid ${isSelected ? STAGE_COLORS[stage].border : 'var(--border)'}`,
                      borderRadius: 3, padding: '6px 10px', cursor: 'pointer',
                      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: isSelected ? 700 : 500,
                      transition: 'all 0.12s', textAlign: 'left', maxWidth: 220,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: oC.cycleClosed ? 'var(--teal)' : oC.hasCriticalGap ? 'var(--coral)' : 'var(--amber)',
                        }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {obj && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
          {/* Left: Position detail + grid + sliders */}
          <div>
            {/* Position header */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-header" style={{ background: stageColor.border }}>
                <span className="card-header-title">{obj.name}</span>
                <span style={{
                  fontSize: 9, background: 'rgba(255,255,255,0.2)', padding: '2px 8px',
                  borderRadius: 2, fontFamily: 'var(--mono)', fontWeight: 600,
                }}>{stageLabel} stage</span>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', lineHeight: 1.6, marginBottom: 10 }}>
                  {obj.description}
                </div>
                {/* Attack requirements — the three legs */}
                <div style={{
                  fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700,
                  letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)',
                  marginBottom: 6,
                }}>
                  Three attack requirements — remove any one to break this attack step
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: ATTACK.legs.ttp.label, value: obj.conjunction.ttpLeg, color: 'var(--amber-bg)', tip: ATTACK.legs.ttp.tip },
                    { label: ATTACK.legs.weakness.label, value: obj.conjunction.weaknessLeg, color: 'var(--coral-bg)', tip: ATTACK.legs.weakness.tip },
                    { label: ATTACK.legs.asset.label, value: obj.conjunction.assetLeg, color: 'var(--blue-bg)', tip: ATTACK.legs.asset.tip },
                  ].map(leg => (
                    <div key={leg.label} title={leg.tip} style={{
                      background: leg.color, borderRadius: 3, padding: '8px 10px',
                      fontFamily: 'var(--mono)', fontSize: 10,
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 9, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>
                        {leg.label}
                      </div>
                      <div style={{ lineHeight: 1.5 }}>{leg.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Defense Grid — the 3×3 map */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-header">
                <span className="card-header-title">Defense map — security controls by position</span>
                <span className="card-header-meta">
                  {cycle.cycleClosed
                    ? `✓ ${DEFENSE_CYCLE.name.label} complete`
                    : `⚠ ${cycle.missingPhases.length} phase gap${cycle.missingPhases.length > 1 ? 's' : ''}: ${cycle.missingPhases.map(p => P[p].label).join(', ')}`}
                </span>
              </div>
              <div style={{ padding: 12 }}>
                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <div />
                  {GRID_COLS.map(col => {
                    const pos = POSITIONS.cols[col];
                    return (
                      <div key={col} title={pos.tip} style={{
                        fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                        letterSpacing: '0.8px', textTransform: 'uppercase', textAlign: 'center',
                        color: 'var(--text-muted)', padding: '4px 0',
                      }}>
                        {pos.label}
                        <div style={{ fontSize: 8, fontWeight: 400, opacity: 0.7, marginTop: 1 }}>
                          {pos.short}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Grid rows */}
                {GRID_ROWS.map(row => (
                  <div key={row} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
                    <div title={POSTURES.rows[row].tip} style={{
                      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                      display: 'flex', alignItems: 'center', color: 'var(--navy)',
                    }}>
                      {POSTURES.rows[row].label}
                    </div>
                    {GRID_COLS.map(col => (
                      <GridCell key={col} cell={grid[row][col]} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Implementation strength sliders */}
            <div className="card">
              <div className="card-header">
                <span className="card-header-title">Adjust implementation strength</span>
                {hasOverrides && (
                  <button onClick={() => setOverrides({})} style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#e8e4d9',
                    padding: '3px 10px', borderRadius: 2, cursor: 'pointer',
                    fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
                  }}>Reset all</button>
                )}
              </div>
              <div style={{ padding: '4px 12px 8px' }}>
                <div style={{
                  fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--text-muted)',
                  lineHeight: 1.6, padding: '6px 0 8px', borderBottom: '1px solid var(--border-light)',
                }}>
                  Drag sliders to model "what-if" scenarios. Changes propagate through the defense model
                  to show impact on every affected attack scenario in the right panel.
                </div>
                {mappings.map(m => {
                  const defaultVal = CIS_MAPPINGS.find(x => x.id === m.id)?.effectiveness || 50;
                  const isChanged = overrides[m.id] !== undefined;
                  return (
                    <div key={m.id} style={{
                      display: 'grid', gridTemplateColumns: '50px 1fr 1fr 50px 50px',
                      padding: '8px 0', alignItems: 'center',
                      borderBottom: '1px solid var(--border-light)',
                      background: isChanged ? (m.effectiveness > defaultVal ? 'var(--teal-bg)' : 'var(--coral-bg)') : 'transparent',
                      transition: 'background 0.15s', borderRadius: 2, paddingLeft: 6, paddingRight: 6,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                        CIS {m.cisControl}
                      </span>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--mono)' }}>{m.safeguard}</div>
                        <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                          {PHASES.map(p => m.phases[p] ? (
                            <span key={p} style={{
                              fontSize: 7, padding: '1px 4px', borderRadius: 1,
                              background: (p === 'act' || p === 'achieve') ? 'var(--teal-bg)' : 'var(--blue-bg)',
                              color: (p === 'act' || p === 'achieve') ? 'var(--teal-dark)' : 'var(--blue-dark)',
                              fontFamily: 'var(--mono)', fontWeight: 700,
                            }}>{P[p].label}</span>
                          ) : null)}
                        </div>
                      </div>
                      <input type="range" min={0} max={100} step={5} value={m.effectiveness}
                        onChange={e => handleSlider(m.id, Number(e.target.value))} style={{ width: '100%' }} />
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {defaultVal}%
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, fontFamily: 'var(--mono)', textAlign: 'right',
                        color: isChanged ? (m.effectiveness > defaultVal ? 'var(--teal)' : 'var(--coral)') : 'var(--text-dim)',
                      }}>
                        {m.effectiveness}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Defense status + scenario impact */}
          <div>
            {/* Defense Completeness Status */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-header" style={{
                background: cycle.cycleClosed ? 'var(--teal)' : cycle.hasCriticalGap ? '#791F1F' : 'var(--amber-dark)',
              }}>
                <span className="card-header-title">
                  {cycle.cycleClosed ? 'Defense complete' : 'Defense incomplete'}
                </span>
                <span className="card-header-value" style={{ color: '#e8e4d9' }}>
                  {cycle.effectiveScore}%
                </span>
              </div>
              <div style={{ padding: 12 }}>
                {PHASES.map(p => {
                  const pa = cycle.phaseAnalysis[p];
                  return (
                    <div key={p} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                      borderBottom: '1px solid var(--border-light)',
                    }}>
                      <PhaseIndicator phase={p} covered={pa.covered} />
                      <div style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11 }}>
                        <span style={{ fontWeight: 600 }}>{P[p].label}</span>
                        {pa.covered ? (
                          <span style={{ color: 'var(--teal)', marginLeft: 6, fontSize: 10 }}>
                            {pa.avgEffectiveness}% · {pa.depth} control{pa.depth > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--coral)', marginLeft: 6, fontSize: 10, fontWeight: 600 }}>
                            GAP — no controls cover this phase
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!cycle.cycleClosed && (
                  <div style={{
                    marginTop: 8, padding: '8px 10px', borderRadius: 3,
                    background: cycle.hasCriticalGap ? 'var(--red-bg)' : 'var(--amber-bg)',
                    fontFamily: 'var(--mono)', fontSize: 10, lineHeight: 1.6,
                    color: cycle.hasCriticalGap ? '#791F1F' : 'var(--amber-dark)',
                  }}>
                    <strong>
                      {cycle.hasCriticalGap ? 'Critical: ' : 'Warning: '}
                    </strong>
                    {!cycle.phaseAnalysis.act.covered && !cycle.phaseAnalysis.achieve.covered
                      ? 'No Respond or Verify capability. The organization monitors but cannot act on what it finds. No effective defense exists at this position.'
                      : !cycle.phaseAnalysis.act.covered
                        ? 'No Respond capability. Threats are detected and assessed but nothing can stop them. Detection without response.'
                        : !cycle.phaseAnalysis.achieve.covered
                          ? 'No Verify capability. Actions are taken but never confirmed. The organization acts but doesn\'t know if it worked.'
                          : !cycle.phaseAnalysis.see.covered
                            ? 'No Observe capability. Controls act without visibility into the situation. Blind enforcement.'
                            : 'No Assess capability. Observations exist but aren\'t evaluated against criteria.'}
                    <div style={{ marginTop: 4, fontWeight: 600 }}>
                      Score: {cycle.avgCoveredEff}% effectiveness × {cycle.gapMultiplier} gap penalty = {cycle.effectiveScore}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scenario Impact — A/B Comparison */}
            <div className="card">
              <div className="card-header" style={{ background: hasOverrides ? 'var(--teal)' : 'var(--navy)' }}>
                <span className="card-header-title">
                  {hasOverrides ? 'Projected impact on scenarios' : 'Scenarios at this position'}
                </span>
                <span className="card-header-meta" style={{ color: '#b5ad98' }}>
                  {affectedScenarios.length} scenarios
                </span>
              </div>
              <div style={{ padding: '8px 12px' }}>
                {hasOverrides && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                    borderBottom: '2px solid var(--border)', marginBottom: 6,
                    fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                  }}>
                    <span>Total exposure change</span>
                    <span style={{ color: totalDelta < -0.01 ? 'var(--teal)' : totalDelta > 0.01 ? 'var(--coral)' : 'var(--text-dim)' }}>
                      {fmt.dollarsSigned(totalDelta)}
                    </span>
                  </div>
                )}
                {scenarioImpact.map(s => {
                  const improved = s.delta < -0.01;
                  return (
                    <div key={s.id} style={{
                      padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontFamily: 'var(--mono)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: 10 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-dim)', marginRight: 4 }}>{s.id}</span>
                          <span style={{ fontWeight: 500 }}>
                            {s.name.length > 30 ? s.name.substring(0, 30) + '…' : s.name}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, whiteSpace: 'nowrap', marginLeft: 6 }}>
                          {fmt.dollars(s.baselineRALE)}
                          {hasOverrides && (
                            <span style={{ marginLeft: 4, fontWeight: 600, color: improved ? 'var(--teal)' : 'var(--text-dim)' }}>
                              → {fmt.dollars(s.modifiedRALE)}
                            </span>
                          )}
                        </div>
                      </div>
                      {hasOverrides && improved && (
                        <div style={{ fontSize: 9, color: 'var(--teal)', marginTop: 1 }}>
                          {fmt.dollarsSigned(s.delta)} ({s.deltaPct.toFixed(0)}%)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key */}
            <Legend items={[
              { color: 'var(--blue)', label: `${P.see.label} / ${P.evaluate.label} phases` },
              { color: 'var(--teal)', label: `${P.act.label} / ${P.achieve.label} phases` },
              { color: 'var(--bg-surface)', label: 'Phase gap — no coverage' },
            ]} />
          </div>
        </div>
      )}
    </div>
  );
}
