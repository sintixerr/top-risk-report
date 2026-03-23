import { useState, useMemo } from 'react';
import { ScreenHeader, Legend } from './HelpPanel.jsx';
import { SCREENS, ATTACK, DEFENSE_CYCLE, CONCEPTS, fmt } from '../terminology.js';
import { OBJECTIVES, STAGES, CIS_MAPPINGS, PHASES, getMappingsForObjective } from '../controlModel.js';
import {
  getPositionSummaries, translatePositionOverride,
  computeThemeImpact, computePortfolioImpact,
} from '../positionWhatIf.js';
import { CUSTOM_THEMES } from '../data.js';

const P = DEFENSE_CYCLE.phases;
const STAGE_COLORS = {
  "Initial Access": { dot: '#378ADD', text: '#0C447C' },
  "Transit": { dot: '#BA7517', text: '#633806' },
  "Payoff": { dot: '#E24B4A', text: '#791F1F' },
};

export default function WhatIfReport({ overrides, setOverrides, userThemes = [] }) {
  const [expandedPos, setExpandedPos] = useState(null);

  const positions = useMemo(() => getPositionSummaries(overrides), [overrides]);
  const portfolio = useMemo(() => computePortfolioImpact(overrides), [overrides]);
  const hasOverrides = Object.keys(overrides).length > 0;

  const themeImpacts = useMemo(() => {
    const allThemeNames = [
      ...Object.keys(CUSTOM_THEMES),
      ...userThemes.map(t => t.name),
    ];
    return allThemeNames.map(name => computeThemeImpact(name, overrides, userThemes))
      .filter(Boolean)
      .sort((a, b) => a.delta - b.delta);
  }, [overrides, userThemes]);

  const handlePositionChange = (objId, newEff) => {
    const newOverrides = translatePositionOverride(objId, newEff, overrides);
    setOverrides(newOverrides);
  };

  const byStage = useMemo(() => {
    const groups = {};
    STAGES.forEach(s => { groups[s] = []; });
    positions.forEach(p => { if (groups[p.stage]) groups[p.stage].push(p); });
    return groups;
  }, [positions]);

  return (
    <div>
      <ScreenHeader
        title="Investment What-If Analysis"
        subtitle="Model changes to control objectives and see the dollar impact across your risk themes. Click any objective to see which CIS controls are mapped to it."
        help="Each row represents a control objective with its mapped CIS Controls v8.1 safeguards. The slider controls aggregate effectiveness — moving it distributes changes proportionally across the underlying CIS safeguards. The right panel shows real-time impact on every risk theme."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ═══ LEFT: Position sliders with CIS controls ═══ */}
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12,
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
              Control Objectives
            </div>
            {hasOverrides && (
              <button className="btn" style={{ fontSize: 10 }} onClick={() => setOverrides({})}>
                Reset all
              </button>
            )}
          </div>

          {STAGES.map(stage => {
            const sl = ATTACK.stages[stage];
            const sc = STAGE_COLORS[stage];
            return (
              <div key={stage} style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: sc.text, marginBottom: 6, paddingLeft: 2,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc.dot }} />
                  {sl.label}
                </div>

                {(byStage[stage] || []).map(pos => {
                  const baselinePos = getPositionSummaries({}).find(p => p.id === pos.id);
                  const baseEff = baselinePos?.rawEffectiveness || 50;
                  const changed = pos.rawEffectiveness !== baseEff;
                  const improved = pos.rawEffectiveness > baseEff;
                  const isExpanded = expandedPos === pos.id;
                  const cisMappings = getMappingsForObjective(pos.id, overrides);

                  return (
                    <div key={pos.id} style={{
                      marginBottom: 4, borderRadius: 3,
                      background: changed ? (improved ? 'var(--teal-bg)' : 'var(--coral-bg)') : 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      transition: 'background 0.15s',
                    }}>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          marginBottom: 6, cursor: 'pointer',
                        }}
                          onClick={() => setExpandedPos(isExpanded ? null : pos.id)}
                        >
                          <div style={{ fontFamily: 'var(--mono)' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 8, color: 'var(--text-dim)', transition: 'transform 0.15s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                              {pos.name}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1, paddingLeft: 14 }}>
                              {pos.cycleClosed
                                ? <span style={{ color: 'var(--teal)' }}>● Complete</span>
                                : pos.hasCriticalGap
                                  ? <span style={{ color: 'var(--coral)' }}>✗ Critical gap</span>
                                  : <span style={{ color: 'var(--amber)' }}>⚠ Partial</span>}
                              <span style={{ marginLeft: 6 }}>· {pos.mappingCount} CIS controls</span>
                            </div>
                          </div>
                          <div style={{
                            fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, minWidth: 48, textAlign: 'right',
                            color: pos.effectiveness > 60 ? 'var(--teal)' : pos.effectiveness > 30 ? 'var(--amber)' : 'var(--coral)',
                          }}>
                            {pos.effectiveness}%
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', minWidth: 28 }}>
                            {baseEff}%
                          </span>
                          <input
                            type="range" min={0} max={100} step={5}
                            value={pos.rawEffectiveness}
                            onChange={e => handlePositionChange(pos.id, Number(e.target.value))}
                            style={{ flex: 1 }}
                          />
                          <span style={{
                            fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, minWidth: 28, textAlign: 'right',
                            color: changed ? (improved ? 'var(--teal)' : 'var(--coral)') : 'var(--text-dim)',
                          }}>
                            {pos.rawEffectiveness}%
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{
                          padding: '0 12px 10px',
                          borderTop: '1px solid var(--border-light)',
                        }}>
                          <div style={{
                            fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700,
                            letterSpacing: '1px', textTransform: 'uppercase',
                            color: 'var(--text-muted)', padding: '8px 0 4px',
                          }}>
                            Mapped CIS Controls v8.1
                          </div>
                          {cisMappings.map(m => {
                            const defaultEff = CIS_MAPPINGS.find(x => x.id === m.id)?.effectiveness || 50;
                            return (
                              <div key={m.id} style={{
                                padding: '6px 0', borderBottom: '1px solid var(--border-light)',
                                fontFamily: 'var(--mono)',
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                  <div>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--navy)' }}>{m.id}</span>
                                    <span style={{ fontSize: 10, marginLeft: 6 }}>{m.safeguard}</span>
                                  </div>
                                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                                    {m.effectiveness}%
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                                  <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                                    CIS {m.cisControlName}
                                  </span>
                                  <div style={{ display: 'flex', gap: 2 }}>
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
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ═══ RIGHT: Impact dashboard ═══ */}
        <div>
          <div style={{
            background: hasOverrides ? 'var(--teal-bg)' : 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 3,
            padding: '14px 18px', marginBottom: 12, fontFamily: 'var(--mono)',
            transition: 'background 0.2s',
          }}>
            <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              Portfolio impact
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Baseline: {fmt.dollars(portfolio.baselineALE)}
                </div>
                {hasOverrides && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Modified: {fmt.dollars(portfolio.modifiedALE)}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: 22, fontWeight: 700,
                color: !hasOverrides ? 'var(--text-dim)'
                  : portfolio.delta < -0.01 ? 'var(--teal)'
                  : portfolio.delta > 0.01 ? 'var(--coral)' : 'var(--text-dim)',
              }}>
                {hasOverrides ? fmt.dollarsSigned(portfolio.delta) : '—'}
              </div>
            </div>
            {hasOverrides && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                {portfolio.deltaPct.toFixed(1)}% change across {portfolio.scenarioCount} scenarios
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-header-title">
                {hasOverrides ? 'Impact by risk theme' : 'Risk themes — baseline'}
              </span>
            </div>
            <div style={{ padding: 0 }}>
              {themeImpacts.map(t => {
                const improved = t.delta < -0.01;
                const degraded = t.delta > 0.01;
                return (
                  <div key={t.name} style={{
                    display: 'grid',
                    gridTemplateColumns: hasOverrides ? '1fr 80px 20px 80px 80px' : '1fr 80px',
                    padding: '8px 14px', alignItems: 'center',
                    borderBottom: '1px solid var(--border-light)',
                    fontFamily: 'var(--mono)', fontSize: 11,
                    background: improved ? 'var(--teal-bg)' : degraded ? 'var(--coral-bg)' : 'transparent',
                    transition: 'background 0.15s',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{t.scenarioCount} scenarios</div>
                    </div>
                    <div style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {fmt.dollars(t.baselineALE)}
                    </div>
                    {hasOverrides && (
                      <>
                        <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>→</div>
                        <div style={{ textAlign: 'right', fontWeight: 600 }}>
                          {fmt.dollars(t.modifiedALE)}
                        </div>
                        <div style={{
                          textAlign: 'right', fontWeight: 700, fontSize: 10,
                          color: improved ? 'var(--teal)' : degraded ? 'var(--coral)' : 'var(--text-dim)',
                        }}>
                          {fmt.dollarsSigned(t.delta)}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!hasOverrides && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 3,
              background: 'var(--bg-surface)', fontFamily: 'var(--mono)',
              fontSize: 10, lineHeight: 1.6, color: 'var(--text-muted)',
            }}>
              Adjust any control objective slider on the left to model investment scenarios.
              Click any objective to see the specific CIS Controls v8.1 safeguards mapped to it
              and which defense phases they cover.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
