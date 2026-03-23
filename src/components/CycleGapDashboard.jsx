import { useState, useMemo } from 'react';
import { ScreenHeader, Legend } from './HelpPanel.jsx';
import { SCREENS, DEFENSE_CYCLE, ATTACK, STATUS, CONCEPTS } from '../terminology.js';
import { OBJECTIVES, PHASES, STAGES, getAllCycleGaps, getMappingsForObjective } from '../controlModel.js';

const P = DEFENSE_CYCLE.phases;
const STAGE_COLORS = {
  "Initial Access": '#378ADD',
  "Transit": '#BA7517',
  "Payoff": '#E24B4A',
};

function PhaseCell({ covered, depth, avgEff }) {
  const bg = !covered
    ? '#FCEBEB'
    : avgEff > 70 ? '#E1F5EE' : avgEff > 40 ? '#FAEEDA' : '#FFF3E0';
  const color = !covered
    ? '#E24B4A'
    : avgEff > 70 ? '#1D9E75' : avgEff > 40 ? '#BA7517' : '#D85A30';
  const label = !covered ? '—' : `${avgEff}%`;

  return (
    <div style={{
      background: bg, borderRadius: 3, padding: '8px 4px',
      textAlign: 'center', fontFamily: 'var(--mono)',
      border: !covered ? '1px solid #FACDCD' : '1px solid transparent',
      minWidth: 56,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{label}</div>
      {covered && (
        <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>
          {depth} control{depth > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default function CycleGapDashboard({ overrides = {} }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const gaps = useMemo(() => getAllCycleGaps(overrides), [overrides]);

  const stats = useMemo(() => {
    const closed = gaps.filter(g => g.cycleClosed).length;
    const critical = gaps.filter(g => g.hasCriticalGap).length;
    const totalScore = gaps.reduce((a, g) => a + g.effectiveScore, 0);
    const avgScore = gaps.length > 0 ? Math.round(totalScore / gaps.length) : 0;
    const phaseGaps = {};
    PHASES.forEach(p => { phaseGaps[p] = gaps.filter(g => !g.phaseAnalysis[p].covered).length; });
    return { closed, critical, avgScore, total: gaps.length, phaseGaps };
  }, [gaps]);

  const byStage = useMemo(() => {
    const groups = {};
    STAGES.forEach(s => { groups[s] = []; });
    gaps.forEach(g => {
      const obj = OBJECTIVES.find(o => o.id === g.objectiveId);
      if (obj) groups[obj.stage].push({ ...g, stage: obj.stage });
    });
    return groups;
  }, [gaps]);

  return (
    <div>
      <ScreenHeader
        title={SCREENS.gaps.title}
        subtitle={SCREENS.gaps.subtitle}
        help={SCREENS.gaps.help}
      />

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Control objectives', value: stats.total, color: 'var(--navy)' },
          { label: 'Defenses complete', value: `${stats.closed} / ${stats.total}`, color: 'var(--teal)' },
          { label: 'Critical gaps', value: stats.critical, color: stats.critical > 0 ? 'var(--coral)' : 'var(--teal)' },
          { label: 'Avg effectiveness', value: `${stats.avgScore}%`, color: stats.avgScore > 60 ? 'var(--teal)' : stats.avgScore > 40 ? 'var(--amber)' : 'var(--coral)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
            padding: '8px 14px', fontFamily: 'var(--mono)', flex: '1 1 120px',
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Phase-level summary */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, fontFamily: 'var(--mono)', fontSize: 11 }}>
        {PHASES.map(p => (
          <div key={p} title={P[p].tip} style={{
            flex: 1, textAlign: 'center', padding: '8px 12px', cursor: 'help',
            background: stats.phaseGaps[p] === 0 ? 'var(--teal-bg)' : stats.phaseGaps[p] <= 3 ? 'var(--amber-bg)' : 'var(--red-bg)',
            borderRadius: 3,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
              {P[p].label}
            </div>
            <div style={{
              fontSize: 16, fontWeight: 700,
              color: stats.phaseGaps[p] === 0 ? 'var(--teal)' : stats.phaseGaps[p] <= 3 ? 'var(--amber)' : 'var(--coral)',
            }}>
              {stats.phaseGaps[p] === 0 ? '✓' : `${stats.phaseGaps[p]} gaps`}
            </div>
          </div>
        ))}
      </div>

      {/* Main matrix */}
      <div className="card">
        <div className="card-header">
          <span className="card-header-title">Defense cycle status — all control objectives</span>
          <span className="card-header-meta">{stats.closed} of {stats.total} defenses complete · Click any row to see CIS controls</span>
        </div>
        <div style={{ padding: 12 }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px repeat(4, 1fr) 80px 80px', gap: 4, marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Control Objective
            </div>
            {PHASES.map(p => (
              <div key={p} title={P[p].tip} style={{
                fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center',
                color: 'var(--text-muted)', cursor: 'help',
              }}>
                {P[p].label}
              </div>
            ))}
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', color: 'var(--text-muted)' }}>
              Score
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', color: 'var(--text-muted)' }}>
              Status
            </div>
          </div>

          {/* Rows by stage */}
          {STAGES.map(stage => {
            const sl = ATTACK.stages[stage];
            return (
              <div key={stage}>
                <div style={{
                  fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: STAGE_COLORS[stage], padding: '8px 0 4px',
                  borderTop: '1px solid var(--border-light)',
                }}>
                  ● {sl.label}
                  <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>{sl.tip}</span>
                </div>
                {(byStage[stage] || []).map(g => {
                  const isExpanded = expandedRow === g.objectiveId;
                  const mappings = isExpanded ? getMappingsForObjective(g.objectiveId, overrides) : [];
                  return (
                    <div key={g.objectiveId}>
                      <div
                        onClick={() => setExpandedRow(isExpanded ? null : g.objectiveId)}
                        style={{
                          display: 'grid', gridTemplateColumns: '200px repeat(4, 1fr) 80px 80px',
                          gap: 4, marginBottom: 2, alignItems: 'center',
                          cursor: 'pointer', borderRadius: 3,
                          transition: 'background 0.1s',
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <span style={{ fontSize: 8, color: 'var(--text-dim)', transition: 'transform 0.15s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                          {g.objectiveName}
                        </div>
                        {PHASES.map(p => (
                          <PhaseCell key={p}
                            covered={g.phaseAnalysis[p].covered}
                            depth={g.phaseAnalysis[p].depth}
                            avgEff={g.phaseAnalysis[p].avgEffectiveness}
                          />
                        ))}
                        <div style={{
                          textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
                          color: g.effectiveScore > 60 ? 'var(--teal)' : g.effectiveScore > 30 ? 'var(--amber)' : 'var(--coral)',
                        }}>
                          {g.effectiveScore}%
                        </div>
                        <div style={{
                          textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                          color: g.cycleClosed ? 'var(--teal)' : g.hasCriticalGap ? 'var(--coral)' : 'var(--amber)',
                        }}>
                          {g.cycleClosed ? '✓ Complete' : g.hasCriticalGap ? '✗ Critical' : '⚠ Partial'}
                        </div>
                      </div>

                      {/* ═══ Expanded: CIS Controls for this objective ═══ */}
                      {isExpanded && (
                        <div style={{
                          marginLeft: 16, marginBottom: 8, padding: '8px 12px',
                          background: 'var(--bg-surface)', borderRadius: 3,
                          border: '1px solid var(--border-light)',
                        }}>
                          <div style={{
                            fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 700,
                            letterSpacing: '1px', textTransform: 'uppercase',
                            color: 'var(--text-muted)', marginBottom: 6,
                          }}>
                            CIS Controls v8.1 mapped to this objective
                          </div>
                          {mappings.map(m => (
                            <div key={m.id} style={{
                              display: 'grid', gridTemplateColumns: '70px 1fr auto',
                              padding: '5px 0', borderBottom: '1px solid var(--border-light)',
                              fontFamily: 'var(--mono)', fontSize: 10, alignItems: 'center',
                            }}>
                              <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{m.id}</span>
                              <div>
                                <div style={{ fontWeight: 500 }}>{m.safeguard}</div>
                                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{m.cisControlName}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                                <div style={{ display: 'flex', gap: 2 }}>
                                  {PHASES.map(p => (
                                    <span key={p} style={{
                                      fontSize: 7, padding: '1px 4px', borderRadius: 1,
                                      fontFamily: 'var(--mono)', fontWeight: 700,
                                      background: m.phases[p]
                                        ? (p === 'act' || p === 'achieve' ? 'var(--teal-bg)' : 'var(--blue-bg)')
                                        : 'var(--bg-card)',
                                      color: m.phases[p]
                                        ? (p === 'act' || p === 'achieve' ? 'var(--teal-dark)' : 'var(--blue-dark)')
                                        : 'var(--text-dim)',
                                    }}>{P[p].abbr}</span>
                                  ))}
                                </div>
                                <span style={{
                                  fontWeight: 600, minWidth: 32, textAlign: 'right',
                                  color: m.effectiveness > 60 ? 'var(--teal)' : m.effectiveness > 40 ? 'var(--amber)' : 'var(--coral)',
                                }}>{m.effectiveness}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interpretation */}
      <div className="callout bg-blue" style={{ marginTop: 16 }}>
        <div className="callout-title">Reading this dashboard</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.8 }}>
          Each row is a control objective with its mapped CIS Controls v8.1 safeguards.
          The four columns show whether each phase of the defense cycle has coverage:
          <strong> {P.see.label}</strong> (detect),
          <strong> {P.evaluate.label}</strong> (judge),
          <strong> {P.act.label}</strong> (respond), and
          <strong> {P.achieve.label}</strong> (verify).
          Click any row to see which specific CIS controls cover each phase.
          <br /><br />
          <strong>A defense that can't complete all four phases provides no effective protection</strong> — a monitoring system that detects threats but has no connected response is an incomplete defense, not a weak one.
        </div>
      </div>

      <Legend items={[
        { color: 'var(--teal)', label: 'Covered — controls address this phase' },
        { color: 'var(--amber)', label: 'Covered but weak — low effectiveness' },
        { color: '#FCEBEB', label: 'Gap — no controls cover this phase' },
      ]} />
    </div>
  );
}
