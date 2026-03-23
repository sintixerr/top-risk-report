import { useState, useMemo } from 'react';
import { ScreenHeader, Legend } from './HelpPanel.jsx';
import { DEFENSE_CYCLE, ATTACK, fmt } from '../terminology.js';
import { OBJECTIVES, PHASES, STAGES, CIS_MAPPINGS, getMappingsForObjective, getSafeguardTCO, CIS_TCO } from '../controlModel.js';
import { CUSTOM_THEMES, DATA, getThemeScenarios } from '../data.js';
import { computeModelDrivenMetrics } from '../controlModel.js';

const P = DEFENSE_CYCLE.phases;
const STAGE_COLORS = {
  "Initial Access": { bg: '#E6F1FB', text: '#0C447C' },
  "Transit":        { bg: '#FAEEDA', text: '#633806' },
  "Payoff":         { bg: '#FCEBEB', text: '#791F1F' },
};

// Column grouping options — what the controls are being measured against
const COL_GROUPINGS = [
  { key: 'theme',      label: 'Risk Themes' },
  { key: 'objective',  label: 'Control Objectives' },
  { key: 'stage',      label: 'Attack Stages' },
  { key: 'ttps',       label: 'Attack Methods' },
  { key: 'weaknesses', label: 'Vulnerabilities' },
  { key: 'assets',     label: 'Systems Targeted' },
];

function getColumnElements(groupingKey, userThemes = []) {
  switch (groupingKey) {
    case 'theme':
      return [...Object.keys(CUSTOM_THEMES), ...userThemes.map(t => t.name)];
    case 'objective':
      return OBJECTIVES.map(o => o.name);
    case 'stage':
      return STAGES;
    case 'ttps': {
      const s = new Set(); DATA.forEach(d => d.ttps.forEach(v => s.add(v))); return [...s].sort();
    }
    case 'weaknesses': {
      const s = new Set(); DATA.forEach(d => d.weaknesses.forEach(v => s.add(v))); return [...s].sort();
    }
    case 'assets': {
      const s = new Set(); DATA.forEach(d => (d.assets || []).forEach(v => s.add(v))); return [...s].sort();
    }
    default: return [];
  }
}

function getScenariosForElement(groupingKey, elementName, userThemes = []) {
  switch (groupingKey) {
    case 'theme':
      return getThemeScenarios(elementName, userThemes);
    case 'objective':
      return DATA.filter(s => (s.objectives || []).includes(elementName));
    case 'stage': {
      const stageObjs = OBJECTIVES.filter(o => o.stage === elementName).map(o => o.name);
      const seen = new Set();
      return DATA.filter(s => (s.objectives || []).some(o => stageObjs.includes(o)))
        .filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
    }
    case 'ttps':
      return DATA.filter(s => s.ttps.includes(elementName));
    case 'weaknesses':
      return DATA.filter(s => s.weaknesses.includes(elementName));
    case 'assets':
      return DATA.filter(s => (s.assets || []).includes(elementName));
    default: return [];
  }
}

// Cell detail modal
function CellDetail({ cell, controlName, colName, onClose }) {
  if (!cell || cell.overlapping === 0) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 6, padding: '20px 24px',
        maxWidth: 480, width: '90%', fontFamily: 'var(--mono)',
        border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{controlName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Relationship to: {colName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          {[
            { value: cell.overlapping, sub: `of ${cell.totalInCol} scenarios`, color: 'var(--navy)' },
            { value: fmt.dollars(cell.overlapALE), sub: 'exposure at intersection', color: 'var(--coral)' },
            { value: `${cell.pctOfCol.toFixed(0)}%`, sub: "of element's exposure", color: 'var(--teal)' },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 3, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{item.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--text)', fontFamily: 'var(--mono)' }}>
          This control defends against {cell.overlapping} of the {cell.totalInCol} scenarios
          in "{colName}", covering {cell.pctOfCol.toFixed(0)}% of that element's risk exposure.
        </div>
        {cell.scenarioIds.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-muted)' }}>
            <strong>Scenarios:</strong> {cell.scenarioIds.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ControlThemeMatrix({ userThemes = [] }) {
  const [colGrouping, setColGrouping] = useState('theme');
  const [selectedCell, setSelectedCell] = useState(null);
  const [sortBy, setSortBy] = useState('riskManaged'); // 'riskManaged', 'tco', 'efficiency', 'name'

  const colElements = useMemo(() => getColumnElements(colGrouping, userThemes), [colGrouping, userThemes]);

  // Build control rows with TCO and risk-managed data
  const controls = useMemo(() => {
    return CIS_MAPPINGS.map(m => {
      const obj = OBJECTIVES.find(o => o.id === m.objectiveId);
      const tco = getSafeguardTCO(m.id);

      // Risk managed: ALE of all scenarios traversing this control's objective
      const managedScenarios = DATA.filter(s => (s.objectives || []).includes(obj?.name));
      const riskManaged = managedScenarios.reduce((a, s) => a + s.rALE, 0);

      // Efficiency: risk managed per $1 of TCO
      const efficiency = tco > 0 ? riskManaged / (tco / 1000) : 0; // riskManaged is in $M, tco is in $K → ratio is $M per $K → ×1000 for $M per $M

      return {
        cisId: m.id, safeguard: m.safeguard,
        cisControlName: m.cisControlName, cisControl: m.cisControl,
        objectiveId: m.objectiveId, objectiveName: obj?.name || '',
        effectiveness: m.effectiveness,
        phases: PHASES.filter(p => m.phases[p]),
        stage: obj?.stage || '',
        tco,
        riskManaged,
        efficiency,
        managedScenarioCount: managedScenarios.length,
      };
    });
  }, []);

  // Build matrix cells
  const matrix = useMemo(() => {
    const result = {};
    controls.forEach(ctrl => {
      result[ctrl.cisId] = {};
      colElements.forEach(colName => {
        const colScenarios = getScenariosForElement(colGrouping, colName, userThemes);
        const colALE = colScenarios.reduce((a, s) => a + s.rALE, 0);
        const overlapping = colScenarios.filter(s => (s.objectives || []).includes(ctrl.objectiveName));
        const overlapALE = overlapping.reduce((a, s) => a + s.rALE, 0);
        result[ctrl.cisId][colName] = {
          overlapping: overlapping.length,
          totalInCol: colScenarios.length,
          overlapALE,
          pctOfCol: colALE > 0 ? (overlapALE / colALE) * 100 : 0,
          scenarioIds: overlapping.map(s => s.id),
        };
      });
    });
    return result;
  }, [controls, colElements, colGrouping, userThemes]);

  // Sort controls
  const sortedControls = useMemo(() => {
    const sorted = [...controls];
    switch (sortBy) {
      case 'riskManaged': return sorted.sort((a, b) => b.riskManaged - a.riskManaged);
      case 'tco': return sorted.sort((a, b) => b.tco - a.tco);
      case 'efficiency': return sorted.sort((a, b) => b.efficiency - a.efficiency);
      case 'name': return sorted.sort((a, b) => a.cisId.localeCompare(b.cisId));
      default: return sorted;
    }
  }, [controls, sortBy]);

  // Max values for color scaling
  const maxCellALE = useMemo(() => {
    let max = 0;
    controls.forEach(c => colElements.forEach(col => {
      const cell = matrix[c.cisId]?.[col];
      if (cell && cell.overlapALE > max) max = cell.overlapALE;
    }));
    return max || 1;
  }, [controls, colElements, matrix]);

  const maxRiskManaged = Math.max(...controls.map(c => c.riskManaged), 1);
  const maxTCO = Math.max(...controls.map(c => c.tco), 1);
  const totalTCO = controls.reduce((a, c) => a + c.tco, 0);
  const totalRiskManaged = controls.reduce((a, c) => a + c.riskManaged, 0);

  const cellBg = (ale) => {
    if (ale === 0) return 'transparent';
    const intensity = Math.min(ale / maxCellALE, 1);
    return `rgba(226, 75, 75, ${0.08 + intensity * 0.35})`;
  };

  // Group controls by stage
  const controlsByStage = useMemo(() => {
    const groups = {};
    STAGES.forEach(s => { groups[s] = []; });
    sortedControls.forEach(c => { if (groups[c.stage]) groups[c.stage].push(c); });
    return groups;
  }, [sortedControls]);

  return (
    <div>
      <ScreenHeader
        title="Control Value Assessment"
        subtitle="How each security control relates to risk across any dimension — and whether the investment is worth it. Each cell shows scenario overlap and risk at the intersection."
        help="Each row is a CIS Controls v8.1 safeguard. Columns are selectable: risk themes, control objectives, attack methods, vulnerabilities, or systems targeted. The 'Risk Managed' column shows the total exposure the control's objective covers. 'Annual TCO' is the estimated cost. 'Efficiency' compares cost to value. Click any matrix cell for detail."
      />

      {/* Config bar */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-end',
        fontFamily: 'var(--mono)', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600 }}>
            Measure controls against
          </div>
          <select value={colGrouping} onChange={e => setColGrouping(e.target.value)}
            style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 8px', borderRadius: 2, border: '1px solid var(--border)', minWidth: 160 }}>
            {COL_GROUPINGS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600 }}>
            Sort controls by
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 8px', borderRadius: 2, border: '1px solid var(--border)' }}>
            <option value="riskManaged">Risk Managed</option>
            <option value="tco">Annual TCO</option>
            <option value="efficiency">Efficiency Ratio</option>
            <option value="name">CIS ID</option>
          </select>
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
          padding: '6px 14px',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Total annual TCO</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>${(totalTCO / 1000).toFixed(1)}M</div>
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
          padding: '6px 14px',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Total risk managed</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--coral)' }}>{fmt.dollars(totalRiskManaged)}</div>
        </div>
      </div>

      {/* Scrollable matrix */}
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table style={{
          borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 10,
          minWidth: colElements.length * 80 + 520,
        }}>
          <thead>
            <tr>
              <th style={{ ...hdrSt, minWidth: 60, textAlign: 'left' }}>CIS ID</th>
              <th style={{ ...hdrSt, minWidth: 170, textAlign: 'left' }}>Safeguard</th>
              <th style={{ ...hdrSt, minWidth: 70, textAlign: 'right', cursor: 'pointer', color: sortBy === 'riskManaged' ? 'var(--navy)' : undefined }}
                onClick={() => setSortBy('riskManaged')}>
                Risk Managed {sortBy === 'riskManaged' && '▼'}
              </th>
              <th style={{ ...hdrSt, minWidth: 65, textAlign: 'right', cursor: 'pointer', color: sortBy === 'tco' ? 'var(--navy)' : undefined }}
                onClick={() => setSortBy('tco')}>
                Annual TCO {sortBy === 'tco' && '▼'}
              </th>
              <th style={{ ...hdrSt, minWidth: 65, textAlign: 'right', cursor: 'pointer', color: sortBy === 'efficiency' ? 'var(--navy)' : undefined }}
                onClick={() => setSortBy('efficiency')}>
                Efficiency {sortBy === 'efficiency' && '▼'}
              </th>
              {colElements.map(col => (
                <th key={col} style={{
                  ...hdrSt, textAlign: 'center', minWidth: 70, maxWidth: 90,
                  writingMode: 'vertical-rl', height: 110, padding: '8px 4px',
                  transform: 'rotate(180deg)',
                }}>
                  {col.length > 22 ? col.substring(0, 22) + '…' : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STAGES.map(stage => {
              const stageControls = controlsByStage[stage] || [];
              if (stageControls.length === 0) return null;
              const sl = ATTACK.stages[stage];
              const sc = STAGE_COLORS[stage];
              return [
                <tr key={`stage-${stage}`}>
                  <td colSpan={5 + colElements.length} style={{
                    padding: '8px 6px 4px', fontSize: 9, fontWeight: 700,
                    letterSpacing: '1.5px', textTransform: 'uppercase',
                    color: sc.text, borderTop: '1px solid var(--border-light)',
                  }}>
                    ● {sl.label}
                  </td>
                </tr>,
                ...stageControls.map(ctrl => {
                  const effColor = ctrl.efficiency > 80 ? 'var(--teal)' : ctrl.efficiency > 30 ? 'var(--amber)' : 'var(--coral)';
                  const riskBarW = (ctrl.riskManaged / maxRiskManaged) * 100;
                  const tcoBarW = (ctrl.tco / maxTCO) * 100;

                  return (
                    <tr key={ctrl.cisId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '5px 6px', fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
                        {ctrl.cisId}
                      </td>
                      <td style={{ padding: '5px 6px', maxWidth: 200 }}>
                        <div style={{ fontWeight: 500, lineHeight: 1.3 }}>{ctrl.safeguard}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
                          {ctrl.objectiveName}
                          <span style={{ marginLeft: 2 }} title={`Defense phases: ${ctrl.phases.map(p => P[p].label).join(', ')}`}>
                            {ctrl.phases.map(p => (
                              <span key={p} style={{
                                display: 'inline-block', padding: '0 2px', marginRight: 1,
                                fontSize: 8, fontWeight: 700,
                                color: (p === 'act' || p === 'achieve') ? 'var(--teal)' : 'var(--blue)',
                              }}>{P[p].label.charAt(0)}</span>
                            ))}
                          </span>
                          <span style={{
                            fontWeight: 600,
                            color: ctrl.effectiveness > 60 ? 'var(--teal)' : ctrl.effectiveness > 40 ? 'var(--amber)' : 'var(--coral)',
                          }}>{ctrl.effectiveness}%</span>
                        </div>
                      </td>
                      {/* Risk managed */}
                      <td style={{ padding: '5px 6px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--coral)', fontSize: 11 }}>
                          {fmt.dollars(ctrl.riskManaged)}
                        </div>
                        <div style={{ height: 3, background: 'var(--bg-surface)', borderRadius: 1, marginTop: 2 }}>
                          <div style={{ height: '100%', width: `${riskBarW}%`, background: 'var(--coral)', opacity: 0.4, borderRadius: 1 }} />
                        </div>
                        <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>{ctrl.managedScenarioCount} scenarios</div>
                      </td>
                      {/* TCO */}
                      <td style={{ padding: '5px 6px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 11 }}>
                          ${ctrl.tco}K
                        </div>
                        <div style={{ height: 3, background: 'var(--bg-surface)', borderRadius: 1, marginTop: 2 }}>
                          <div style={{ height: '100%', width: `${tcoBarW}%`, background: 'var(--navy)', opacity: 0.3, borderRadius: 1 }} />
                        </div>
                      </td>
                      {/* Efficiency */}
                      <td style={{ padding: '5px 6px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: effColor, fontSize: 11 }}>
                          {ctrl.efficiency.toFixed(0)}×
                        </div>
                        <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>
                          ${ctrl.tco > 0 ? (ctrl.riskManaged * 1000 / ctrl.tco).toFixed(0) : '—'} per $1
                        </div>
                      </td>
                      {/* Matrix cells */}
                      {colElements.map(col => {
                        const cell = matrix[ctrl.cisId]?.[col];
                        const hasOverlap = cell && cell.overlapping > 0;
                        return (
                          <td key={col}
                            onClick={() => hasOverlap && setSelectedCell({ cell, controlName: `${ctrl.cisId}: ${ctrl.safeguard}`, colName: col })}
                            style={{
                              padding: '4px 2px', textAlign: 'center',
                              background: hasOverlap ? cellBg(cell.overlapALE) : 'transparent',
                              cursor: hasOverlap ? 'pointer' : 'default',
                              borderLeft: '1px solid var(--border-light)',
                              transition: 'background 0.1s',
                            }}
                            title={hasOverlap ? `${cell.overlapping} scenarios, ${fmt.dollars(cell.overlapALE)}` : 'No overlap'}
                          >
                            {hasOverlap ? (
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--coral)' }}>
                                  {cell.overlapping}
                                </div>
                                <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                                  {fmt.dollars(cell.overlapALE)}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--border)', fontSize: 9 }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                }),
              ];
            })}
          </tbody>
        </table>
      </div>

      {/* Value insight callout */}
      {(() => {
        const bestValue = [...controls].sort((a, b) => b.efficiency - a.efficiency)[0];
        const worstValue = [...controls].sort((a, b) => a.efficiency - b.efficiency)[0];
        if (!bestValue || !worstValue) return null;
        return (
          <div className="callout bg-teal" style={{ marginBottom: 16 }}>
            <div className="callout-title">Value assessment insight</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.8 }}>
              <strong>Highest value:</strong> {bestValue.cisId} ({bestValue.safeguard}) manages {fmt.dollars(bestValue.riskManaged)} of
              exposure at ${bestValue.tco}K/year — {bestValue.efficiency.toFixed(0)}× return on investment.
              <br />
              <strong>Lowest value:</strong> {worstValue.cisId} ({worstValue.safeguard}) manages {fmt.dollars(worstValue.riskManaged)} of
              exposure at ${worstValue.tco}K/year — {worstValue.efficiency.toFixed(0)}× return.
              <br />
              <span style={{ fontSize: 10, opacity: 0.7 }}>
                Total control portfolio: ${(totalTCO / 1000).toFixed(1)}M annual TCO managing {fmt.dollars(totalRiskManaged)} of risk exposure.
                Portfolio efficiency: {totalRiskManaged > 0 ? ((totalRiskManaged * 1000) / totalTCO).toFixed(0) : '—'}× return.
              </span>
            </div>
          </div>
        );
      })()}

      {/* Navigate to Control Performance */}
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)',
        fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8,
      }}>
        This view shows what each control <strong>protects</strong> and how much is at stake.
        To see how <strong>well</strong> each control performs, use the Control Performance view.
        TCO values are simulated for demonstration.
      </div>

      <Legend items={[
        { color: 'rgba(226, 75, 75, 0.15)', label: 'Low exposure at intersection' },
        { color: 'rgba(226, 75, 75, 0.4)', label: 'High exposure at intersection' },
        { color: 'transparent', label: '— No relationship' },
        { color: 'var(--blue)', label: `${P.see.label.charAt(0)} = ${P.see.label}, ${P.evaluate.label.charAt(0)} = ${P.evaluate.label} (detection phases)` },
        { color: 'var(--teal)', label: `${P.act.label.charAt(0)} = ${P.act.label}, ${P.achieve.label.charAt(0)} = ${P.achieve.label} (action phases)` },
      ]} />

      {/* Modal */}
      {selectedCell && (
        <CellDetail
          cell={selectedCell.cell}
          controlName={selectedCell.controlName}
          colName={selectedCell.colName}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  );
}

const hdrSt = {
  padding: '6px 6px', fontSize: 9, fontWeight: 700,
  color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase',
  fontFamily: 'var(--mono)', borderBottom: '2px solid var(--border)',
  position: 'sticky', top: 0, background: 'var(--bg)',
};
