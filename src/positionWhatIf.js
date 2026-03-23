// ═══════════════════════════════════════════════════════════════════════════
// Position-Level What-If + CIS Controls Analytics
// ═══════════════════════════════════════════════════════════════════════════

import {
  OBJECTIVES, CIS_MAPPINGS, PHASES, computeCycleStatus,
  computeModelDrivenMetrics,
} from './controlModel.js';
import { SCENARIOS, DATA, CUSTOM_THEMES, getThemeScenarios } from './data.js';

// ─── Position summaries ───

export function getPositionSummaries(safeguardOverrides = {}) {
  return OBJECTIVES.map(obj => {
    const cycle = computeCycleStatus(obj.id, safeguardOverrides);
    return {
      id: obj.id, name: obj.name, stage: obj.stage,
      effectiveness: cycle.effectiveScore,
      rawEffectiveness: cycle.avgCoveredEff,
      cycleClosed: cycle.cycleClosed,
      hasCriticalGap: cycle.hasCriticalGap,
      mappingCount: cycle.mappingCount,
      missingPhases: cycle.missingPhases,
    };
  });
}

// ─── Position-level override translation ───

export function translatePositionOverride(objectiveId, targetEffectiveness, existingOverrides = {}) {
  const mappings = CIS_MAPPINGS.filter(m => m.objectiveId === objectiveId);
  if (mappings.length === 0) return existingOverrides;

  const currentAvg = mappings.reduce((sum, m) => {
    const eff = existingOverrides[m.id] !== undefined ? existingOverrides[m.id] : m.effectiveness;
    return sum + eff;
  }, 0) / mappings.length;

  if (currentAvg === 0 && targetEffectiveness === 0) return existingOverrides;

  const newOverrides = { ...existingOverrides };
  if (currentAvg === 0) {
    mappings.forEach(m => { newOverrides[m.id] = targetEffectiveness; });
  } else {
    const ratio = targetEffectiveness / currentAvg;
    mappings.forEach(m => {
      const current = existingOverrides[m.id] !== undefined ? existingOverrides[m.id] : m.effectiveness;
      newOverrides[m.id] = Math.round(Math.min(100, Math.max(0, current * ratio)));
    });
  }
  mappings.forEach(m => {
    if (newOverrides[m.id] === m.effectiveness) delete newOverrides[m.id];
  });
  return newOverrides;
}

// ─── Theme impact computation ───

export function computeThemeImpact(themeName, safeguardOverrides = {}, userThemes = []) {
  const scenarios = getThemeScenarios(themeName, userThemes);
  if (scenarios.length === 0) return null;
  const baseline = scenarios.map(s => computeModelDrivenMetrics(s, {}));
  const modified = scenarios.map(s => computeModelDrivenMetrics(s, safeguardOverrides));
  const bALE = baseline.reduce((a, s) => a + s.rALE, 0);
  const mALE = modified.reduce((a, s) => a + s.rALE, 0);
  return {
    name: themeName, scenarioCount: scenarios.length,
    baselineALE: bALE, modifiedALE: mALE,
    delta: mALE - bALE, deltaPct: bALE > 0 ? ((mALE - bALE) / bALE) * 100 : 0,
  };
}

export function computePortfolioImpact(safeguardOverrides = {}) {
  const baseline = SCENARIOS.map(s => computeModelDrivenMetrics(s, {}));
  const modified = SCENARIOS.map(s => computeModelDrivenMetrics(s, safeguardOverrides));
  const bALE = baseline.reduce((a, s) => a + s.rALE, 0);
  const mALE = modified.reduce((a, s) => a + s.rALE, 0);
  return {
    baselineALE: bALE, modifiedALE: mALE,
    delta: mALE - bALE, deltaPct: bALE > 0 ? ((mALE - bALE) / bALE) * 100 : 0,
    scenarioCount: SCENARIOS.length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CIS Control Analytics — Ranking and Cross-Reference
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build CIS control ranking data in the same format as buildDimensionData.
 * For each CIS safeguard: find its objective → find all scenarios that
 * traverse that objective → sum the risk.
 */
export function buildCISControlRanking(sortKey = 'rALE', showChg = false) {
  const results = [];

  CIS_MAPPINGS.forEach(m => {
    const obj = OBJECTIVES.find(o => o.id === m.objectiveId);
    if (!obj) return;

    // Scenarios traversing this control's objective
    const matched = DATA.filter(s => (s.objectives || []).includes(obj.name));
    const val = matched.reduce((a, s) => a + (showChg ? (s.chg?.[sortKey] ?? 0) : (s[sortKey] ?? 0)), 0);

    // Phase coverage
    const phases = PHASES.filter(p => m.phases[p]);

    results.push({
      name: `${m.id}: ${m.safeguard}`,
      cisId: m.id,
      safeguard: m.safeguard,
      cisControlName: m.cisControlName,
      cisControl: m.cisControl,
      objectiveId: m.objectiveId,
      objectiveName: obj.name,
      effectiveness: m.effectiveness,
      phases,
      val,
      count: matched.length,
      scenarios: matched,
    });
  });

  return results.sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
}

/**
 * Build the Controls × Themes cross-reference matrix.
 * Returns: { controls: [...], themes: [...], matrix: { [cisId]: { [themeName]: cellData } } }
 *
 * Each cell answers: "How does this CIS control relate to this theme?"
 * - Does the control's objective appear in any of the theme's scenarios?
 * - How many scenarios overlap?
 * - What ALE is at the intersection?
 */
export function buildControlThemeMatrix(activeThemeNames = [], userThemes = []) {
  const controls = CIS_MAPPINGS.map(m => {
    const obj = OBJECTIVES.find(o => o.id === m.objectiveId);
    return {
      cisId: m.id, safeguard: m.safeguard,
      cisControlName: m.cisControlName, cisControl: m.cisControl,
      objectiveId: m.objectiveId, objectiveName: obj?.name || '',
      effectiveness: m.effectiveness,
      phases: PHASES.filter(p => m.phases[p]),
      stage: obj?.stage || '',
    };
  });

  const themes = activeThemeNames.map(name => {
    const scenarios = getThemeScenarios(name, userThemes);
    return { name, scenarios, totalALE: scenarios.reduce((a, s) => a + s.rALE, 0) };
  });

  const matrix = {};
  controls.forEach(ctrl => {
    matrix[ctrl.cisId] = {};
    themes.forEach(theme => {
      // Find scenarios in this theme that traverse this control's objective
      const overlapping = theme.scenarios.filter(s =>
        (s.objectives || []).includes(ctrl.objectiveName)
      );
      const overlapALE = overlapping.reduce((a, s) => a + s.rALE, 0);
      matrix[ctrl.cisId][theme.name] = {
        overlapping: overlapping.length,
        totalInTheme: theme.scenarios.length,
        overlapALE,
        pctOfTheme: theme.totalALE > 0 ? (overlapALE / theme.totalALE) * 100 : 0,
        scenarioIds: overlapping.map(s => s.id),
      };
    });
  });

  return { controls, themes, matrix };
}

/**
 * Get CIS control families (grouped by cisControl number) with aggregate stats.
 */
export function getCISControlFamilies() {
  const families = {};
  CIS_MAPPINGS.forEach(m => {
    if (!families[m.cisControl]) {
      families[m.cisControl] = {
        cisControl: m.cisControl,
        cisControlName: m.cisControlName,
        safeguards: [],
        avgEffectiveness: 0,
      };
    }
    families[m.cisControl].safeguards.push(m);
  });
  Object.values(families).forEach(f => {
    f.avgEffectiveness = Math.round(
      f.safeguards.reduce((a, m) => a + m.effectiveness, 0) / f.safeguards.length
    );
  });
  return Object.values(families).sort((a, b) => a.cisControl - b.cisControl);
}
