// ═══════════════════════════════════════════════════════════════════════════
// Performance Model — Dimension × Phase Performance Data
// ═══════════════════════════════════════════════════════════════════════════
//
// Extends the control model with the dimension × phase detail layer.
// Each control objective has a 6×4 grid: 6 performance dimensions × 4
// S/E/A/Ach phases. Each cell is "chance requirements will be met over
// time" — a probability from 0–100%.
//
// The values are SIMULATED for the demo, generated from the existing
// CIS safeguard mappings with dimension-specific and objective-specific
// multipliers to produce realistic variation.
//
// Tension (session 2026-03-22): "Governance" is included as a 6th
// performance dimension. The algebra specifies 5 (Feature, Scope,
// Dependency, Operations, Resilience). Whether Governance is a new
// dimension or represents the grid's Govern row folded in is an open
// question — parked for future resolution.
//
// ═══════════════════════════════════════════════════════════════════════════

import {
  OBJECTIVES, PHASES, CIS_MAPPINGS,
  getMappingsForObjective,
} from './controlModel.js';
import { SCENARIOS, DATA, CUSTOM_THEMES, getThemeScenarios } from './data.js';


// ─── DIMENSIONS ───

export const PERFORMANCE_DIMENSIONS = [
  { key: 'features',     label: 'Features',             tip: 'Does the control functionally do what it needs to do?' },
  { key: 'scope',        label: 'Deployment Scope',     tip: 'Is the control deployed everywhere it needs to be?' },
  { key: 'dependencies', label: 'Dependencies',          tip: 'Are the prerequisites and integrations in place?' },
  { key: 'cadence',      label: 'Operational Cadence',   tip: 'Is the control operated with the right frequency and consistency?' },
  { key: 'resilience',   label: 'Resilience',            tip: 'Does the control survive adversarial pressure and component failures?' },
  { key: 'governance',   label: 'Governance',            tip: 'Are policy, oversight, and accountability structures supporting this control?' },
];


// ─── SIMULATION PARAMETERS ───

// How well organizations typically perform on each dimension (multiplier on base effectiveness)
const DIM_MULTIPLIERS = {
  features:     1.10,  // Organizations usually get "what the control does" right
  scope:        0.95,  // Coverage gaps are common
  dependencies: 0.85,  // Dependency management often neglected
  cadence:      0.78,  // Operational discipline is typically the weakest
  resilience:   0.88,  // Resilience is underinvested
  governance:   0.72,  // Governance of controls is the most overlooked
};

// Per-objective personality — some objectives are inherently better defended
const OBJ_PERSONALITY = {
  'OBJ-01': 1.05,  // Technical Exploitation: well-understood, good tooling
  'OBJ-02': 0.90,  // Social Engineering: hard to control, human factor
  'OBJ-03': 1.08,  // Identity & Trust: lots of IAM investment
  'OBJ-04': 0.82,  // Lateral Movement: notoriously difficult
  'OBJ-05': 0.88,  // Persistence & Evasion: detection lag
  'OBJ-06': 0.95,  // Disruption: recovery investment common
  'OBJ-07': 0.80,  // Data Collection: internal monitoring immature
  'OBJ-08': 0.78,  // Data Exfiltration: hardest outbound to stop
  'OBJ-09': 0.92,  // Transaction Fraud: financial controls mature
  'OBJ-10': 0.75,  // Information Integrity: least invested
};

// Per-objective max performance ceilings
// Not all objectives are fully mitigatable — you can't patch zero-days you
// don't know about, you can't fully control human susceptibility, you can't
// prevent all authorized-user abuse.
//
// NOTE for future design: These ceilings are a design idea worth formalizing.
// The concept that max achievable control performance is less than 100% for
// structural reasons (not just resource reasons) connects to the algebra's
// treatment of inherent limitations in the conjunction.
export const MAX_PERFORMANCE = {
  'OBJ-01': 95,  // Mature vuln management + WAF + hardening gets close
  'OBJ-02': 88,  // Human factor is the hard ceiling — even the best programs have some susceptibility
  'OBJ-03': 96,  // Identity is highly controllable with zero-trust architecture + MFA everywhere
  'OBJ-04': 92,  // Microsegmentation + NDR + zero-trust gets high but legitimate protocol abuse persists
  'OBJ-05': 90,  // EDR + integrity monitoring + application control — evasion techniques evolve
  'OBJ-06': 97,  // Recovery is almost entirely within organizational control (immutable backups, tested DR)
  'OBJ-07': 88,  // Data activity monitoring is maturing but authorized-user collection is inherently hard
  'OBJ-08': 85,  // DLP + encrypted channel inspection helps but covert channels remain
  'OBJ-09': 95,  // Multi-party validation + real-time monitoring — well-understood in financial services
  'OBJ-10': 86,  // Content integrity verification improving but fundamental trust exploitation persists
};

// Residual capability when no CIS safeguard covers a phase (per dimension)
// Even without mapped controls, organizations have some baseline capability
// from general policies, architecture, and organizational processes
const UNCOVERED_RESIDUAL = {
  features:     5,   // No specific control → almost no functional capability
  scope:        8,   // Some incidental coverage from general infrastructure
  dependencies: 10,  // General IT operations provide some dependencies
  cadence:      6,   // No operational rhythm without specific controls
  resilience:   8,   // Basic infrastructure resilience exists
  governance:   15,  // General organizational governance provides some oversight
};


// ─── SIMULATION ENGINE ───

// Deterministic pseudo-random: same inputs always produce same output
function seededRandom(objId, phase, dimKey) {
  const str = `${objId}-${phase}-${dimKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return ((hash & 0x7fffffff) % 1000) / 1000;
}

/**
 * Generate simulated dimension × phase performance data for all objectives.
 * Returns: { [objectiveId]: { [dimKey]: { [phase]: number } } }
 */
export function generatePerformanceData() {
  const data = {};

  OBJECTIVES.forEach(obj => {
    const mappings = getMappingsForObjective(obj.id, {});
    const personality = OBJ_PERSONALITY[obj.id] || 1.0;
    const maxPerf = MAX_PERFORMANCE[obj.id] || 85;

    const cells = {};

    PERFORMANCE_DIMENSIONS.forEach(dim => {
      cells[dim.key] = {};

      PHASES.forEach(phase => {
        const covering = mappings.filter(m => m.phases[phase] && m.effectiveness > 0);
        const hasCoverage = covering.length > 0;
        const avgEff = hasCoverage
          ? covering.reduce((sum, m) => sum + m.effectiveness, 0) / covering.length
          : 0;

        let value;
        if (!hasCoverage) {
          // No safeguard coverage → residual capability with small variation
          const base = UNCOVERED_RESIDUAL[dim.key] || 8;
          value = base + seededRandom(obj.id, phase, dim.key) * 8;
        } else {
          // Coverage exists → effectiveness × dimension multiplier × personality
          const dimMult = DIM_MULTIPLIERS[dim.key];
          const base = avgEff * personality * dimMult;
          // Per-cell variation (±10 points)
          const variation = (seededRandom(obj.id, phase, dim.key) - 0.5) * 20;
          value = base + variation;
        }

        // Clamp to [0, maxPerf]
        cells[dim.key][phase] = Math.max(0, Math.min(maxPerf, Math.round(value)));
      });
    });

    data[obj.id] = cells;
  });

  return data;
}

// Pre-computed performance data (stable across renders)
export const PERF_DATA = generatePerformanceData();


// ─── CELL ACCESS ───

/**
 * Get a single cell value with optional override.
 * Override key format: "OBJ-01:features:see"
 */
export function getCellValue(objectiveId, dimKey, phase, overrides = {}) {
  const key = `${objectiveId}:${dimKey}:${phase}`;
  if (overrides[key] !== undefined) return overrides[key];
  return PERF_DATA[objectiveId]?.[dimKey]?.[phase] ?? 0;
}

/**
 * Get all cell values for an objective as a flat structure.
 * Returns: [{ dimKey, dimLabel, phase, value, overrideKey }]
 */
export function getObjectiveCells(objectiveId, overrides = {}) {
  const cells = [];
  PERFORMANCE_DIMENSIONS.forEach(dim => {
    PHASES.forEach(phase => {
      const key = `${objectiveId}:${dim.key}:${phase}`;
      cells.push({
        dimKey: dim.key,
        dimLabel: dim.label,
        dimTip: dim.tip,
        phase,
        value: overrides[key] !== undefined ? overrides[key] : (PERF_DATA[objectiveId]?.[dim.key]?.[phase] ?? 0),
        overrideKey: key,
        isOverridden: overrides[key] !== undefined,
      });
    });
  });
  return cells;
}


// ─── TOP CIS CONTROLS PER PHASE ───

/**
 * Get the top N CIS controls for a given objective and phase,
 * sorted by effectiveness descending.
 */
export function getTopControlsForPhase(objectiveId, phase, n = 3, overrides = {}) {
  const mappings = getMappingsForObjective(objectiveId, overrides);
  return mappings
    .filter(m => m.phases[phase])
    .sort((a, b) => {
      const effA = overrides[a.id] !== undefined ? overrides[a.id] : a.effectiveness;
      const effB = overrides[b.id] !== undefined ? overrides[b.id] : b.effectiveness;
      return effB - effA;
    })
    .slice(0, n);
}

/**
 * Get top controls for a GROUP of objectives (for theme/portfolio views).
 * Deduplicates controls that appear across multiple objectives.
 */
export function getTopControlsForGroup(objectiveIds, phase, n = 3, overrides = {}) {
  const seen = new Set();
  const all = [];
  objectiveIds.forEach(objId => {
    const mappings = getMappingsForObjective(objId, overrides);
    mappings.filter(m => m.phases[phase]).forEach(m => {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        const eff = overrides[m.id] !== undefined ? overrides[m.id] : m.effectiveness;
        all.push({ ...m, effectiveness: eff });
      }
    });
  });
  return all.sort((a, b) => b.effectiveness - a.effectiveness).slice(0, n);
}


// ─── AGGREGATION ───

/**
 * Compute aggregate performance for a single objective from dim×phase cells.
 */
export function computeObjectivePerformance(objectiveId, cellOverrides = {}) {
  const phaseAvgs = {};
  PHASES.forEach(phase => {
    const values = PERFORMANCE_DIMENSIONS.map(dim =>
      getCellValue(objectiveId, dim.key, phase, cellOverrides)
    );
    phaseAvgs[phase] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  });

  // Phase coverage: a phase is "covered" if its average exceeds the residual threshold
  const COVERAGE_THRESHOLD = 15;
  const covered = PHASES.filter(p => phaseAvgs[p] > COVERAGE_THRESHOLD);
  const missing = PHASES.filter(p => phaseAvgs[p] <= COVERAGE_THRESHOLD);

  const avgCovered = covered.length > 0
    ? covered.reduce((sum, p) => sum + phaseAvgs[p], 0) / covered.length
    : 0;

  // Gap penalty — same logic as controlModel.js
  let gapPenalty = 1.0;
  if (phaseAvgs.act <= COVERAGE_THRESHOLD) gapPenalty *= 0.3;
  if (phaseAvgs.achieve <= COVERAGE_THRESHOLD) gapPenalty *= 0.5;
  if (phaseAvgs.see <= COVERAGE_THRESHOLD) gapPenalty *= 0.6;
  if (phaseAvgs.evaluate <= COVERAGE_THRESHOLD) gapPenalty *= 0.7;

  return {
    objectiveId,
    phaseAvgs,
    coveredPhases: covered,
    missingPhases: missing,
    cycleClosed: missing.length === 0,
    overallScore: Math.round(avgCovered),
    gapPenalty: Math.round(gapPenalty * 100) / 100,
    effectiveScore: Math.round(avgCovered * gapPenalty),
  };
}

/**
 * Compute aggregate performance for a GROUP of objectives.
 * Weighted by the number of scenarios traversing each objective.
 * Used for theme/portfolio/stage groupings.
 */
export function computeGroupPerformance(objectiveIds, scenarios, cellOverrides = {}) {
  if (objectiveIds.length === 0) return null;

  // Weight each objective by how many of the group's scenarios traverse it
  const weights = {};
  let totalWeight = 0;
  objectiveIds.forEach(objId => {
    const obj = OBJECTIVES.find(o => o.id === objId);
    if (!obj) return;
    const count = scenarios.filter(s => (s.objectives || []).includes(obj.name)).length;
    weights[objId] = count;
    totalWeight += count;
  });

  // Compute weighted average per dimension × phase
  const groupCells = {};
  PERFORMANCE_DIMENSIONS.forEach(dim => {
    groupCells[dim.key] = {};
    PHASES.forEach(phase => {
      let weightedSum = 0;
      objectiveIds.forEach(objId => {
        const w = weights[objId] || 0;
        weightedSum += getCellValue(objId, dim.key, phase, cellOverrides) * w;
      });
      groupCells[dim.key][phase] = totalWeight > 0
        ? Math.round(weightedSum / totalWeight)
        : 0;
    });
  });

  // Also compute per-objective performances for drill-down
  const perObjective = objectiveIds.map(objId => ({
    ...computeObjectivePerformance(objId, cellOverrides),
    weight: weights[objId] || 0,
    objectiveName: OBJECTIVES.find(o => o.id === objId)?.name || objId,
  }));

  // Aggregate phase averages
  const phaseAvgs = {};
  PHASES.forEach(phase => {
    const values = PERFORMANCE_DIMENSIONS.map(dim => groupCells[dim.key][phase]);
    phaseAvgs[phase] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  });

  const COVERAGE_THRESHOLD = 15;
  const covered = PHASES.filter(p => phaseAvgs[p] > COVERAGE_THRESHOLD);
  const missing = PHASES.filter(p => phaseAvgs[p] <= COVERAGE_THRESHOLD);
  const avgCovered = covered.length > 0
    ? covered.reduce((sum, p) => sum + phaseAvgs[p], 0) / covered.length : 0;

  let gapPenalty = 1.0;
  if (phaseAvgs.act <= COVERAGE_THRESHOLD) gapPenalty *= 0.3;
  if (phaseAvgs.achieve <= COVERAGE_THRESHOLD) gapPenalty *= 0.5;
  if (phaseAvgs.see <= COVERAGE_THRESHOLD) gapPenalty *= 0.6;
  if (phaseAvgs.evaluate <= COVERAGE_THRESHOLD) gapPenalty *= 0.7;

  return {
    groupCells,
    phaseAvgs,
    coveredPhases: covered,
    missingPhases: missing,
    cycleClosed: missing.length === 0,
    overallScore: Math.round(avgCovered),
    gapPenalty: Math.round(gapPenalty * 100) / 100,
    effectiveScore: Math.round(avgCovered * gapPenalty),
    perObjective,
  };
}


// ─── RISK COMPUTATION FROM PERFORMANCE ───

const effToSusc = (eff) => Math.max(0.05, Math.min(0.85, 0.85 - (eff / 100) * 0.8));

/**
 * Compute risk quantities for a set of scenarios using performance data.
 * Uses cell overrides for what-if scenarios.
 */
export function computeRiskFromPerformance(scenarios, cellOverrides = {}) {
  return scenarios.map(s => {
    const objNames = s.objectives || [];
    const matchedObjs = OBJECTIVES.filter(o => objNames.includes(o.name));

    if (matchedObjs.length === 0) {
      const sF = 0.5, sM = 0.5;
      return {
        ...s, sF, sM,
        rF: s.freq * sF, rM: s.mag * sM,
        iALE: s.freq * s.mag,
        rALE: s.freq * sF * s.mag * sM,
        cLev: 0,
      };
    }

    // Average effective score across traversed objectives
    const scores = matchedObjs.map(obj =>
      computeObjectivePerformance(obj.id, cellOverrides).effectiveScore
    );
    const avgFreqEff = scores.reduce((a, b) => a + b, 0) / scores.length;
    // Magnitude reduction is slightly less effective than frequency reduction
    const avgMagEff = avgFreqEff * 0.85;

    const sF = Math.round(effToSusc(avgFreqEff) * 100) / 100;
    const sM = Math.round(effToSusc(avgMagEff) * 100) / 100;
    const rF = s.freq * sF;
    const rM = s.mag * sM;
    const iALE = s.freq * s.mag;
    const rALE = rF * rM;

    return {
      ...s, sF, sM, rF, rM, iALE, rALE,
      cLev: iALE > 0 ? (1 - rALE / iALE) * 100 : 0,
    };
  });
}

/**
 * Compute risk under max-performance assumptions.
 * Every cell set to the objective's ceiling.
 */
export function computeMaxPerformanceRisk(scenarios) {
  const maxOverrides = {};
  OBJECTIVES.forEach(obj => {
    const cap = MAX_PERFORMANCE[obj.id] || 85;
    PERFORMANCE_DIMENSIONS.forEach(dim => {
      PHASES.forEach(phase => {
        maxOverrides[`${obj.id}:${dim.key}:${phase}`] = cap;
      });
    });
  });
  return computeRiskFromPerformance(scenarios, maxOverrides);
}

/**
 * Aggregate risk numbers for a set of enriched scenarios.
 */
export function aggregateRisk(enrichedScenarios) {
  const rALE = enrichedScenarios.reduce((a, s) => a + s.rALE, 0);
  const iALE = enrichedScenarios.reduce((a, s) => a + s.iALE, 0);
  const avgSF = enrichedScenarios.length > 0
    ? enrichedScenarios.reduce((a, s) => a + s.sF, 0) / enrichedScenarios.length : 0;
  const avgSM = enrichedScenarios.length > 0
    ? enrichedScenarios.reduce((a, s) => a + s.sM, 0) / enrichedScenarios.length : 0;
  return {
    rALE, iALE,
    rF: enrichedScenarios.reduce((a, s) => a + s.rF, 0),
    rM: enrichedScenarios.length > 0
      ? enrichedScenarios.reduce((a, s) => a + s.rM, 0) / enrichedScenarios.length : 0,
    avgSF: Math.round(avgSF * 100) / 100,
    avgSM: Math.round(avgSM * 100) / 100,
    cLev: iALE > 0 ? (1 - rALE / iALE) * 100 : 0,
    scenarioCount: enrichedScenarios.length,
  };
}


// ─── GROUPING HELPERS ───

export const GROUPING_OPTIONS = [
  { key: 'portfolio',  label: 'Full Portfolio',        hasItems: false },
  { key: 'theme',      label: 'By Risk Theme',          hasItems: true },
  { key: 'objective',  label: 'By Control Objective',    hasItems: true },
  { key: 'stage',      label: 'By Attack Stage',         hasItems: true },
  { key: 'ttps',       label: 'By Attack Method',        hasItems: true },
  { key: 'weaknesses', label: 'By Vulnerability',        hasItems: true },
  { key: 'assets',     label: 'By Target System',        hasItems: true },
];

/**
 * Build groups based on the selected grouping type.
 * Returns: [{ key, label, objectiveIds, scenarios }]
 */
/**
 * Build groups from a vocabulary-dimension key.
 * For each selected element value, find matching scenarios and their objectives.
 */
function buildVocabGroups(dimField, selectedItems) {
  return selectedItems.map(value => {
    const scenarios = DATA.filter(s => {
      const vals = dimField === 'motiveObj' ? [s.motiveObj] : (s[dimField] || []);
      return vals.includes(value);
    });
    const objNames = new Set();
    scenarios.forEach(s => (s.objectives || []).forEach(o => objNames.add(o)));
    const objectiveIds = OBJECTIVES.filter(o => objNames.has(o.name)).map(o => o.id);
    return { key: value, label: value, objectiveIds, scenarios };
  });
}

/**
 * Get available items for a grouping key.
 */
export function getGroupingItems(groupingKey, userThemes = []) {
  switch (groupingKey) {
    case 'portfolio': return [];
    case 'theme': return [
      ...Object.keys(CUSTOM_THEMES),
      ...userThemes.map(t => t.name),
    ];
    case 'objective': return OBJECTIVES.map(o => ({ value: o.id, label: o.name }));
    case 'stage': return ['Initial Access', 'Transit', 'Payoff'].map(s => ({ value: s, label: s }));
    case 'ttps': {
      const set = new Set();
      DATA.forEach(s => s.ttps.forEach(v => set.add(v)));
      return [...set].sort();
    }
    case 'weaknesses': {
      const set = new Set();
      DATA.forEach(s => s.weaknesses.forEach(v => set.add(v)));
      return [...set].sort();
    }
    case 'assets': {
      const set = new Set();
      DATA.forEach(s => (s.assets || []).forEach(v => set.add(v)));
      return [...set].sort();
    }
    default: return [];
  }
}

export function buildGroups(groupingKey, selectedItems = [], userThemes = []) {
  switch (groupingKey) {
    case 'portfolio':
      return [{
        key: 'all',
        label: 'Full Portfolio',
        objectiveIds: OBJECTIVES.map(o => o.id),
        scenarios: DATA,
      }];

    case 'theme':
      return selectedItems.map(themeName => {
        const scenarios = getThemeScenarios(themeName, userThemes);
        const objNames = new Set();
        scenarios.forEach(s => (s.objectives || []).forEach(o => objNames.add(o)));
        const objectiveIds = OBJECTIVES.filter(o => objNames.has(o.name)).map(o => o.id);
        return { key: themeName, label: themeName, objectiveIds, scenarios };
      });

    case 'objective':
      return selectedItems.map(objId => {
        const obj = OBJECTIVES.find(o => o.id === objId);
        if (!obj) return null;
        const scenarios = DATA.filter(s => (s.objectives || []).includes(obj.name));
        return { key: objId, label: obj.name, objectiveIds: [objId], scenarios };
      }).filter(Boolean);

    case 'stage': {
      const stages = ['Initial Access', 'Transit', 'Payoff'];
      return stages.filter(s => selectedItems.includes(s)).map(stage => {
        const stageObjs = OBJECTIVES.filter(o => o.stage === stage);
        const objNames = stageObjs.map(o => o.name);
        const scenarios = DATA.filter(s =>
          (s.objectives || []).some(o => objNames.includes(o))
        );
        const seen = new Set();
        const unique = scenarios.filter(s => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
        return {
          key: stage,
          label: stage,
          objectiveIds: stageObjs.map(o => o.id),
          scenarios: unique,
        };
      });
    }

    case 'ttps':       return buildVocabGroups('ttps', selectedItems);
    case 'weaknesses': return buildVocabGroups('weaknesses', selectedItems);
    case 'assets':     return buildVocabGroups('assets', selectedItems);

    default:
      return [];
  }
}


// ─── COLOR SCALE ───

/**
 * Get a CSS color for a performance value (0–100).
 * Green (high) → Amber (mid) → Red (low).
 * maxPossible is used to scale: value/maxPossible determines the color position.
 */
export function performanceColor(value, maxPossible = 100) {
  const ratio = maxPossible > 0 ? Math.min(value / maxPossible, 1) : 0;
  if (ratio >= 0.75) return { bg: '#E1F5EE', text: '#085041', border: '#1D9E75' };
  if (ratio >= 0.55) return { bg: '#EAF3DE', text: '#27500A', border: '#639922' };
  if (ratio >= 0.40) return { bg: '#FAEEDA', text: '#633806', border: '#BA7517' };
  if (ratio >= 0.25) return { bg: '#FAECE7', text: '#993C1D', border: '#D85A30' };
  return { bg: '#FCEBEB', text: '#791F1F', border: '#E24B4A' };
}
