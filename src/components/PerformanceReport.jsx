import { useState, useMemo, useCallback } from 'react';
import { ScreenHeader, Legend } from './HelpPanel.jsx';
import { DEFENSE_CYCLE, ATTACK, QUANTITIES, fmt } from '../terminology.js';
import { OBJECTIVES, PHASES, STAGES } from '../controlModel.js';
import { CUSTOM_THEMES } from '../data.js';
import {
  PERFORMANCE_DIMENSIONS, MAX_PERFORMANCE,
  getCellValue, getTopControlsForPhase, getTopControlsForGroup,
  computeObjectivePerformance, computeGroupPerformance,
  computeRiskFromPerformance, computeMaxPerformanceRisk, aggregateRisk,
  buildGroups, getGroupingItems, GROUPING_OPTIONS, performanceColor,
} from '../performanceModel.js';

const P = DEFENSE_CYCLE.phases;
const RISK_OUTPUTS = [
  { key: 'rALE', label: 'Net Annual Exposure', fmt: fmt.dollars },
  { key: 'rF',   label: 'Residual Likelihood', fmt: v => v.toFixed(2) + ' /3yr' },
  { key: 'rM',   label: 'Residual Impact',     fmt: fmt.dollars },
  { key: 'iALE', label: 'Gross Annual Exposure', fmt: fmt.dollars },
  { key: 'cLev', label: 'Defense Effectiveness', fmt: fmt.pct },
];

// Display modes: rows × columns
const DISPLAY_MODES = [
  { key: 'full',       label: 'Full Matrix',       rowsExpanded: true,  colsExpanded: true },
  { key: 'dims-only',  label: 'By Dimension',      rowsExpanded: true,  colsExpanded: false },
  { key: 'phases-only',label: 'By Phase',           rowsExpanded: false, colsExpanded: true },
  { key: 'compact',    label: 'Compact',            rowsExpanded: false, colsExpanded: false },
];


// ═══════════════════════════════════════════════════════════════════════════
// CONFIG BAR
// ═══════════════════════════════════════════════════════════════════════════

function ConfigBar({
  grouping, setGrouping, selectedItems, setSelectedItems,
  riskOutput, setRiskOutput, displayMode, setDisplayMode,
  userThemes,
}) {
  const groupOpt = GROUPING_OPTIONS.find(o => o.key === grouping);
  const itemOptions = useMemo(() => getGroupingItems(grouping, userThemes), [grouping, userThemes]);

  const handleGroupingChange = (e) => {
    const newGrouping = e.target.value;
    setGrouping(newGrouping);
    if (newGrouping === 'portfolio') {
      setSelectedItems(['all']);
    } else {
      const items = getGroupingItems(newGrouping, userThemes);
      // Default: select first item
      if (items.length > 0) {
        const first = typeof items[0] === 'object' ? items[0].value : items[0];
        setSelectedItems([first]);
      } else {
        setSelectedItems([]);
      }
    }
  };

  const toggleItem = (val) => {
    setSelectedItems(prev =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    );
  };

  const selectAll = () => {
    const vals = itemOptions.map(i => typeof i === 'object' ? i.value : i);
    setSelectedItems(vals);
  };

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
      padding: '12px 16px', marginBottom: 16, fontFamily: 'var(--mono)',
    }}>
      {/* Top row: grouping dropdown + display mode + risk output */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: groupOpt?.hasItems ? 10 : 0 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600 }}>
            Group by
          </div>
          <select value={grouping} onChange={handleGroupingChange}
            style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 8px', borderRadius: 2, border: '1px solid var(--border)', minWidth: 160 }}>
            {GROUPING_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600 }}>
            Display
          </div>
          <div className="toggle-group">
            {DISPLAY_MODES.map(mode => (
              <button key={mode.key}
                className={`toggle-btn ${displayMode === mode.key ? 'toggle-btn-active' : ''}`}
                onClick={() => setDisplayMode(mode.key)}
                style={{ fontSize: 9, padding: '4px 8px' }}>
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600 }}>
            Risk output
          </div>
          <select value={riskOutput} onChange={e => setRiskOutput(e.target.value)}
            style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 8px', borderRadius: 2, border: '1px solid var(--border)' }}>
            {RISK_OUTPUTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Item picker (conditional on grouping having items) */}
      {groupOpt?.hasItems && itemOptions.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Select items
            </span>
            <button className="btn" style={{ fontSize: 8, padding: '1px 6px' }} onClick={selectAll}>All</button>
            <button className="btn" style={{ fontSize: 8, padding: '1px 6px' }} onClick={() => setSelectedItems([])}>None</button>
            <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>
              {selectedItems.length} of {itemOptions.length} selected
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxHeight: 72, overflowY: 'auto' }}>
            {itemOptions.map(item => {
              const val = typeof item === 'object' ? item.value : item;
              const label = typeof item === 'object' ? item.label : item;
              const isActive = selectedItems.includes(val);
              return (
                <button key={val}
                  className={`btn ${isActive ? 'btn-active' : ''}`}
                  style={{ fontSize: 9, padding: '2px 7px' }}
                  onClick={() => toggleItem(val)}>
                  {label.length > 30 ? label.substring(0, 30) + '…' : label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE GRID
// ═══════════════════════════════════════════════════════════════════════════

function PerformanceGrid({ group, cellOverrides, onCellClick, selectedCell, rowsExpanded, colsExpanded }) {
  const isObjGrouping = group.objectiveIds.length === 1;

  const perf = useMemo(() => {
    if (isObjGrouping) return computeObjectivePerformance(group.objectiveIds[0], cellOverrides);
    return computeGroupPerformance(group.objectiveIds, group.scenarios, cellOverrides);
  }, [group, cellOverrides, isObjGrouping]);

  const getCellVal = (dimKey, phase) => {
    if (isObjGrouping) return getCellValue(group.objectiveIds[0], dimKey, phase, cellOverrides);
    return perf?.groupCells?.[dimKey]?.[phase] ?? 0;
  };

  // Aggregated values for collapsed modes
  const getCollapsedCol = (dimKey) => {
    const vals = PHASES.map(p => getCellVal(dimKey, p));
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const getCollapsedRow = (phase) => {
    const vals = PERFORMANCE_DIMENSIONS.map(d => getCellVal(d.key, phase));
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const getSingleCell = () => {
    let total = 0, count = 0;
    PERFORMANCE_DIMENSIONS.forEach(d => PHASES.forEach(p => { total += getCellVal(d.key, p); count++; }));
    return Math.round(total / count);
  };

  const maxPerf = useMemo(() => {
    const caps = group.objectiveIds.map(id => MAX_PERFORMANCE[id] || 85);
    return Math.round(caps.reduce((a, b) => a + b, 0) / caps.length);
  }, [group.objectiveIds]);

  // Top CIS controls per phase
  const topControls = useMemo(() => {
    const result = {};
    PHASES.forEach(phase => {
      result[phase] = isObjGrouping
        ? getTopControlsForPhase(group.objectiveIds[0], phase, 3)
        : getTopControlsForGroup(group.objectiveIds, phase, 3);
    });
    return result;
  }, [group.objectiveIds, isObjGrouping]);

  const isCellSelected = (dimKey, phase) =>
    selectedCell?.groupKey === group.key && selectedCell?.dimKey === dimKey && selectedCell?.phase === phase;

  const handleCellClick = (dimKey, phase) => {
    const overrideKey = isObjGrouping ? `${group.objectiveIds[0]}:${dimKey}:${phase}` : null;
    onCellClick({
      objectiveId: isObjGrouping ? group.objectiveIds[0] : null,
      objectiveIds: group.objectiveIds,
      dimKey, phase, overrideKey,
      groupKey: group.key,
      currentValue: phase === '_all'
        ? (dimKey === '_all' ? getSingleCell() : getCollapsedCol(dimKey))
        : (dimKey === '_all' ? getCollapsedRow(phase) : getCellVal(dimKey, phase)),
      maxPerf,
    });
  };

  const renderCell = (value, dimKey, phase, isSelected) => {
    const color = performanceColor(value, maxPerf);
    return (
      <div onClick={() => handleCellClick(dimKey, phase)}
        style={{
          background: color.bg,
          border: isSelected ? '2px solid var(--navy)' : `1px solid ${color.border}33`,
          borderRadius: 3, padding: colsExpanded ? '6px 4px' : '8px 6px',
          textAlign: 'center', cursor: 'pointer', transition: 'all 0.12s',
          fontFamily: 'var(--mono)', minWidth: colsExpanded ? 0 : 60,
        }}>
        <div style={{ fontSize: rowsExpanded && colsExpanded ? 14 : 16, fontWeight: 700, color: color.text }}>
          {value}%
        </div>
      </div>
    );
  };

  // Determine column count and headers
  const phaseCols = colsExpanded ? PHASES : ['_all'];
  const phaseHeaders = colsExpanded
    ? PHASES.map(p => ({ key: p, label: P[p].label, tip: P[p].tip }))
    : [{ key: '_all', label: 'Overall', tip: 'Average across all defense phases' }];

  const dimRows = rowsExpanded ? PERFORMANCE_DIMENSIONS : [{ key: '_all', label: 'Performance', tip: 'Overall control performance' }];

  const gridCols = `120px repeat(${phaseCols.length}, 1fr)`;

  return (
    <div style={{ padding: '8px 12px' }}>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 4, marginBottom: 4 }}>
        <div />
        {phaseHeaders.map(ph => (
          <div key={ph.key} title={ph.tip} style={{
            textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9,
            fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
            color: 'var(--text-muted)', padding: '4px 0', cursor: 'help',
          }}>
            {ph.label}
          </div>
        ))}
      </div>

      {/* CIS Controls row (only in column-expanded modes) */}
      {colsExpanded && (
        <div style={{
          display: 'grid', gridTemplateColumns: gridCols,
          gap: 4, marginBottom: 6, paddingBottom: 6,
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
            color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', paddingTop: 4,
          }}>
            Security Controls
          </div>
          {PHASES.map(phase => (
            <div key={phase} style={{ fontSize: 9, fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
              {topControls[phase]?.length > 0 ? topControls[phase].map(m => (
                <div key={m.id} style={{ color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--navy)' }}>
                    {m.id.replace('CIS-', '')}
                  </span>{' '}
                  <span style={{ fontSize: 8 }}>{m.safeguard.length > 22 ? m.safeguard.substring(0, 22) + '…' : m.safeguard}</span>
                </div>
              )) : (
                <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 8 }}>No controls</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Performance cells */}
      {dimRows.map(dim => (
        <div key={dim.key} style={{
          display: 'grid', gridTemplateColumns: gridCols, gap: 4, marginBottom: 3,
        }}>
          <div title={dim.tip} style={{
            fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500,
            color: 'var(--text)', display: 'flex', alignItems: 'center', cursor: 'help',
          }}>
            {dim.label}
          </div>
          {phaseCols.map(phase => {
            let value;
            if (dim.key === '_all' && phase === '_all') value = getSingleCell();
            else if (dim.key === '_all') value = getCollapsedRow(phase);
            else if (phase === '_all') value = getCollapsedCol(dim.key);
            else value = getCellVal(dim.key, phase);
            return (
              <div key={phase}>
                {renderCell(value, dim.key, phase, isCellSelected(dim.key, phase))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// RISK OUTPUT PANEL (per-group)
// ═══════════════════════════════════════════════════════════════════════════

function RiskOutputPanel({ scenarios, cellOverrides, riskOutput, selectedCell, groupKey, onSliderChange, acceptableThreshold }) {
  const riskOpt = RISK_OUTPUTS.find(o => o.key === riskOutput);

  const currentRisk = useMemo(() => aggregateRisk(computeRiskFromPerformance(scenarios, cellOverrides)), [scenarios, cellOverrides]);
  const maxRisk = useMemo(() => aggregateRisk(computeMaxPerformanceRisk(scenarios)), [scenarios]);
  const baselineRisk = useMemo(() => aggregateRisk(computeRiskFromPerformance(scenarios, {})), [scenarios]);

  const hasOverrides = Object.keys(cellOverrides).length > 0;
  const getValue = (risk) => risk[riskOutput] ?? 0;
  const formatVal = (v) => riskOpt?.fmt(v) ?? v.toFixed(1);

  const diffFromBest = getValue(currentRisk) - getValue(maxRisk);
  const diffFromAcceptable = getValue(currentRisk) - acceptableThreshold;
  const whatIfDelta = hasOverrides ? getValue(currentRisk) - getValue(baselineRisk) : 0;

  const isThisGroupSelected = selectedCell?.groupKey === groupKey;

  return (
    <div style={{ fontFamily: 'var(--mono)' }}>
      {/* Max */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, color: 'var(--text-muted)' }}>
        <span>Best achievable</span>
        <span style={{ fontWeight: 700, color: 'var(--teal)' }}>{formatVal(getValue(maxRisk))}</span>
      </div>

      {/* Current */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderTop: '1px solid var(--border-light)' }}>
        <span style={{ color: 'var(--text-muted)' }}>{hasOverrides ? 'Adjusted' : 'Forecast'}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--coral)' }}>{formatVal(getValue(currentRisk))}</span>
      </div>

      {/* Gap from best */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 9, color: 'var(--text-muted)' }}>
        <span>Gap from best</span>
        <span style={{ fontWeight: 600, color: diffFromBest > 0.01 ? 'var(--coral)' : 'var(--teal)' }}>
          {diffFromBest > 0.01 ? '+' : ''}{formatVal(diffFromBest)}
        </span>
      </div>

      {/* vs acceptable */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 9, color: 'var(--text-muted)' }}>
        <span>vs. threshold</span>
        <span style={{ fontWeight: 600, color: diffFromAcceptable > 0.01 ? 'var(--coral)' : 'var(--teal)' }}>
          {diffFromAcceptable > 0.01 ? 'Above' : 'Below'}
        </span>
      </div>

      {/* What-if delta */}
      {hasOverrides && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 9, borderTop: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
          <span>What-if Δ</span>
          <span style={{
            fontWeight: 700,
            color: whatIfDelta < -0.01 ? 'var(--teal)' : whatIfDelta > 0.01 ? 'var(--coral)' : 'var(--text-dim)',
          }}>
            {whatIfDelta >= 0 ? '+' : ''}{formatVal(whatIfDelta)}
          </span>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// GROUP CARD (Grid + Risk Panel paired)
// ═══════════════════════════════════════════════════════════════════════════

function GroupCard({ group, cellOverrides, onCellClick, selectedCell, rowsExpanded, colsExpanded, riskOutput, onSliderChange, acceptableThreshold }) {
  const perf = useMemo(() => {
    if (group.objectiveIds.length === 1) return computeObjectivePerformance(group.objectiveIds[0], cellOverrides);
    return computeGroupPerformance(group.objectiveIds, group.scenarios, cellOverrides);
  }, [group, cellOverrides]);

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="card-header-title">{group.label}</span>
          <span className="card-header-meta" style={{ color: '#8a8472' }}>
            {group.scenarios.length} scenarios · {group.objectiveIds.length} obj.
          </span>
        </div>
        <span style={{
          fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)',
          color: perf?.cycleClosed ? '#9FE1CB' : '#FACDCD',
        }}>
          {perf?.effectiveScore ?? 0}% effective
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: rowsExpanded && colsExpanded ? '1fr 240px' : '1fr 200px',
        gap: 12,
      }}>
        {/* Left: Grid */}
        <PerformanceGrid
          group={group}
          cellOverrides={cellOverrides}
          onCellClick={onCellClick}
          selectedCell={selectedCell}
          rowsExpanded={rowsExpanded}
          colsExpanded={colsExpanded}
        />

        {/* Right: Risk outputs for this group */}
        <div style={{ padding: '10px 12px 10px 0' }}>
          <RiskOutputPanel
            scenarios={group.scenarios}
            cellOverrides={cellOverrides}
            riskOutput={riskOutput}
            selectedCell={selectedCell}
            groupKey={group.key}
            onSliderChange={onSliderChange}
            acceptableThreshold={acceptableThreshold}
          />
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function PerformanceReport({ userThemes = [] }) {
  const [grouping, setGrouping] = useState('portfolio');
  const [selectedItems, setSelectedItems] = useState(['all']);
  const [riskOutput, setRiskOutput] = useState('rALE');
  const [displayMode, setDisplayMode] = useState('dims-only');
  const [cellOverrides, setCellOverrides] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [acceptableThreshold, setAcceptableThreshold] = useState(50);

  const mode = DISPLAY_MODES.find(m => m.key === displayMode) || DISPLAY_MODES[1];

  const groups = useMemo(
    () => buildGroups(grouping, selectedItems, userThemes),
    [grouping, selectedItems, userThemes]
  );

  // All scenarios for portfolio summary
  const allScenarios = useMemo(() => {
    const seen = new Set();
    const result = [];
    groups.forEach(g => g.scenarios.forEach(s => {
      if (!seen.has(s.id)) { seen.add(s.id); result.push(s); }
    }));
    return result;
  }, [groups]);

  const handleCellClick = useCallback((cellInfo) => setSelectedCell(cellInfo), []);

  const handleSliderChange = useCallback((cell, value) => {
    if (cell === null) { setCellOverrides({}); setSelectedCell(null); return; }

    const phases = cell.phase === '_all' ? PHASES : [cell.phase];
    const dims = cell.dimKey === '_all' ? PERFORMANCE_DIMENSIONS.map(d => d.key) : [cell.dimKey];
    const objIds = cell.objectiveIds || (cell.objectiveId ? [cell.objectiveId] : []);

    // Single cell, single objective, single dim, single phase — direct set
    if (objIds.length === 1 && phases.length === 1 && dims.length === 1) {
      const key = `${objIds[0]}:${dims[0]}:${phases[0]}`;
      setCellOverrides(prev => ({ ...prev, [key]: value }));
    } else {
      // Distributing across multiple cells — ratio always against BASELINE (no overrides)
      // This prevents the bug where the denominator drifts with each slider move
      setCellOverrides(prev => {
        const next = { ...prev };
        let baselineTotal = 0, baselineCount = 0;
        objIds.forEach(objId => {
          dims.forEach(dk => {
            phases.forEach(ph => {
              baselineTotal += getCellValue(objId, dk, ph, {});
              baselineCount++;
            });
          });
        });
        const baselineAvg = baselineCount > 0 ? baselineTotal / baselineCount : 1;
        const ratio = baselineAvg > 0 ? value / baselineAvg : 1;
        objIds.forEach(objId => {
          dims.forEach(dk => {
            phases.forEach(ph => {
              const key = `${objId}:${dk}:${ph}`;
              const baseline = getCellValue(objId, dk, ph, {});
              next[key] = Math.round(Math.min(MAX_PERFORMANCE[objId] || 95, Math.max(0, baseline * ratio)));
            });
          });
        });
        return next;
      });
    }
    setSelectedCell(prev => prev ? { ...prev, currentValue: value } : null);
  }, []);

  const hasOverrides = Object.keys(cellOverrides).length > 0;

  return (
    <div>
      <ScreenHeader
        title="Control Performance Analysis"
        subtitle="How well your defenses perform across performance dimensions and defense phases — and what that means for risk. Click any cell to model what-if changes."
        help="Each grid shows control performance at every intersection of a performance dimension (Features, Scope, Dependencies, etc.) and a defense phase (Observe, Assess, Respond, Verify). Green cells meet requirements well; red cells have significant gaps. The percentages represent the estimated chance that requirements will be met over time. Use the display toggle to switch between the full matrix and compact views. Each group has its own risk forecast panel."
      />

      <ConfigBar
        grouping={grouping} setGrouping={setGrouping}
        selectedItems={selectedItems} setSelectedItems={setSelectedItems}
        riskOutput={riskOutput} setRiskOutput={setRiskOutput}
        displayMode={displayMode} setDisplayMode={setDisplayMode}
        userThemes={userThemes}
      />

      {/* What-if controls (shared across groups) */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center',
        fontFamily: 'var(--mono)',
      }}>
        {selectedCell ? (
          <div style={{
            flex: 1, background: 'var(--teal-bg)', border: '1px solid #9FE1CB',
            borderRadius: 3, padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 10, color: 'var(--teal-dark)' }}>
              Adjusting: <strong>
                {selectedCell.dimKey === '_all' ? 'All dimensions' : PERFORMANCE_DIMENSIONS.find(d => d.key === selectedCell.dimKey)?.label}
                {' / '}
                {selectedCell.phase === '_all' ? 'All phases' : P[selectedCell.phase]?.label}
              </strong>
              {selectedCell.groupKey && <span style={{ opacity: 0.7 }}> in {selectedCell.groupKey}</span>}
            </div>
            <input type="range" min={0} max={selectedCell.maxPerf || 100} step={1}
              value={selectedCell.currentValue}
              onChange={e => handleSliderChange(selectedCell, Number(e.target.value))}
              style={{ flex: 1, maxWidth: 300 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', minWidth: 36 }}>
              {selectedCell.currentValue}%
            </span>
          </div>
        ) : (
          <div style={{
            flex: 1, background: 'var(--bg-surface)', borderRadius: 3, padding: '8px 14px',
            fontSize: 10, color: 'var(--text-dim)', fontStyle: 'italic',
          }}>
            Click any performance cell in the grid below to model a what-if change
          </div>
        )}

        {/* Threshold + Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Threshold:</span>
          <input type="range" min={1} max={200} value={acceptableThreshold}
            onChange={e => setAcceptableThreshold(Number(e.target.value))}
            style={{ width: 80 }} />
          <span style={{ fontSize: 10, fontWeight: 600, minWidth: 40 }}>{fmt.dollars(acceptableThreshold)}</span>
        </div>

        {hasOverrides && (
          <button className="btn" style={{ fontSize: 9 }} onClick={() => { setCellOverrides({}); setSelectedCell(null); }}>
            Reset
          </button>
        )}
      </div>

      {/* Groups */}
      {groups.length === 0 && (
        <div className="empty-state">Select at least one item to display</div>
      )}

      {groups.map(group => (
        <GroupCard
          key={group.key}
          group={group}
          cellOverrides={cellOverrides}
          onCellClick={handleCellClick}
          selectedCell={selectedCell}
          rowsExpanded={mode.rowsExpanded}
          colsExpanded={mode.colsExpanded}
          riskOutput={riskOutput}
          onSliderChange={handleSliderChange}
          acceptableThreshold={acceptableThreshold}
        />
      ))}

      {/* Portfolio summary (when multiple groups) */}
      {groups.length > 1 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
          padding: '10px 16px', marginTop: 4, fontFamily: 'var(--mono)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--navy)' }}>
            Portfolio total ({allScenarios.length} unique scenarios)
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--coral)' }}>
            {fmt.dollars(aggregateRisk(computeRiskFromPerformance(allScenarios, cellOverrides)).rALE)}
          </span>
        </div>
      )}

      {/* Simulated data notice */}
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)',
        fontStyle: 'italic', marginTop: 12, lineHeight: 1.6,
      }}>
        Performance data is simulated — derived from CIS Controls effectiveness ratings with dimension-specific variation.
        In production, these values would come from structured control performance assessments against defined requirements.
      </div>

      <Legend items={[
        { color: '#E1F5EE', label: 'Strong (≥75% of achievable)' },
        { color: '#EAF3DE', label: 'Good (55–75%)' },
        { color: '#FAEEDA', label: 'Moderate (40–55%)' },
        { color: '#FAECE7', label: 'Weak (25–40%)' },
        { color: '#FCEBEB', label: 'Critical (<25%)' },
      ]} />
    </div>
  );
}
