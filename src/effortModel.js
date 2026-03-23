// ═══════════════════════════════════════════════════════════════════════════
// Effort Model — Simulated Per-Action Effort Estimates
// ═══════════════════════════════════════════════════════════════════════════
//
// Centralized effort assumptions for the Prioritized Action Queue.
// ALL values here are SIMULATED — easy to change in one place.
//
// Structure:
//   - Per-safeguard effort (days to improve effectiveness by 10 points)
//   - Per-dimension effort multipliers (some dimensions are harder to improve)
//   - Per-phase effort multipliers (Act/Achieve harder than See/Evaluate)
//   - Helper functions for the Action Queue computation
//
// Session 2026-03-22. Designed to be swappable — when real estimates
// exist, replace the constants below; computation functions stay the same.
// ═══════════════════════════════════════════════════════════════════════════

import { OBJECTIVES, CIS_MAPPINGS, PHASES, getMappingsForObjective,
         computeCycleStatus, computeModelDrivenMetrics } from './controlModel.js';
import { PERFORMANCE_DIMENSIONS, PERF_DATA, getCellValue,
         computeObjectivePerformance, computeRiskFromPerformance,
         aggregateRisk, MAX_PERFORMANCE } from './performanceModel.js';
import { SCENARIOS, DATA } from './data.js';

// ─── EFFORT CONSTANTS (all values in person-days per 10-point improvement) ───

// Per CIS safeguard: how many person-days to improve effectiveness by 10 points
// Higher = harder to improve. Reflects organizational complexity, not technical difficulty.
export const SAFEGUARD_EFFORT = {
  'CIS-7.4':   15,  // Automated patching — mostly tooling, moderate effort
  'CIS-13.3':  25,  // Network IDS — sensor deployment, tuning, staffing
  'CIS-16.11': 10,  // DB hardening templates — configuration work
  'CIS-14.1':  20,  // Security awareness — program development, ongoing
  'CIS-9.2':    8,  // DNS filtering — cloud service config
  'CIS-9.7':   18,  // Email anti-malware — gateway tuning, policy refinement
  'CIS-6.4':   22,  // MFA for remote — rollout, user training, exception handling
  'CIS-5.3':   12,  // Dormant accounts — process + periodic review setup
  'CIS-6.5':   28,  // MFA for all remote — broader scope than 6.4
  'CIS-12.2':  45,  // Secure network architecture — major infrastructure project
  'CIS-13.5':  30,  // Remote access control — NAC deployment + policy
  'CIS-8.5':   14,  // Detailed audit logs — storage + collection infrastructure
  'CIS-10.1':  16,  // Anti-malware — endpoint platform rollout
  'CIS-8.2':   12,  // Audit log collection — aggregation setup
  'CIS-4.1':   20,  // Secure configuration process — baseline + scanning
  'CIS-11.1':  35,  // Data recovery process — DR site, testing, procedures
  'CIS-11.4':  40,  // Isolated recovery — air-gap/immutable storage build
  'CIS-13.1':  32,  // Centralized alerting — SIEM deployment + correlation rules
  'CIS-3.12':  25,  // Data segmentation — classification + DLP integration
  'CIS-8.11':  10,  // Audit log reviews — analyst time + process
  'CIS-6.1':   14,  // Access granting process — workflow + approvals
  'CIS-13.8':  35,  // DLP — endpoint + network, high tuning burden
  'CIS-3.10':  15,  // Transit encryption — cert infrastructure + TLS management
  'CIS-12.7':  22,  // VPN + firewall — infrastructure + rule management
  'CIS-6.8':   18,  // RBAC — role engineering + periodic review
  'CIS-8.12':   8,  // Service provider logs — API integration
  'CIS-5.4':   10,  // Dedicated admin accounts — PAM + process enforcement
  'CIS-16.1':  30,  // Secure SDLC — tooling + process + training
  'CIS-3.14':  12,  // Sensitive data access logging — DAM setup
  'CIS-18.1':  28,  // Penetration testing — vendor + remediation tracking
};

// Dimension multipliers: how much harder it is to improve each performance dimension
// relative to the base effort. Features are easiest; governance is hardest.
export const DIMENSION_EFFORT_MULTIPLIER = {
  features:     0.8,   // Functional capability — usually a tooling/config problem
  scope:        1.0,   // Coverage — proportional to environment size
  dependencies: 1.2,   // Prerequisites — cross-team coordination
  cadence:      1.1,   // Operational discipline — process change
  resilience:   1.3,   // Adversarial resilience — architecture + design
  governance:   1.5,   // Governance structures — organizational change, slowest
};

// Phase multipliers: how much harder it is to improve each S/E/A/Ach phase
export const PHASE_EFFORT_MULTIPLIER = {
  see:      0.8,   // Observation — deploy sensors, enable logging
  evaluate: 1.0,   // Assessment — build rules, train analysts
  act:      1.3,   // Response — automation, playbooks, staffing
  achieve:  1.4,   // Verification — hardest phase, often organizationally neglected
};


// ─── ACTION GENERATION ───

/**
 * Generate candidate actions from the performance model.
 * Each action represents improving one dimension×phase cell at one objective.
 *
 * Returns: [{
 *   id, objectiveId, objectiveName, stage,
 *   dimKey, dimLabel, phase, phaseLabel,
 *   currentValue, targetValue, maxValue,
 *   riskReduction (simulated $M), effort (person-days),
 *   efficiency (riskReduction / effort), affectedScenarios,
 *   description (human-readable "what to do")
 * }]
 */
export function generateActions(cellOverrides = {}) {
  const actions = [];
  const IMPROVEMENT_STEP = 15; // Each action improves a cell by 15 points

  OBJECTIVES.forEach(obj => {
    const maxPerf = MAX_PERFORMANCE[obj.id] || 85;

    PERFORMANCE_DIMENSIONS.forEach(dim => {
      PHASES.forEach(phase => {
        const current = getCellValue(obj.id, dim.key, phase, cellOverrides);
        const headroom = maxPerf - current;

        // Only generate actions where there's meaningful headroom
        if (headroom < 8) return;

        const target = Math.min(maxPerf, current + IMPROVEMENT_STEP);
        const actualImprovement = target - current;

        // Compute risk reduction by simulating the improvement
        const testOverrides = { ...cellOverrides, [`${obj.id}:${dim.key}:${phase}`]: target };
        const scenariosForObj = SCENARIOS.filter(s =>
          (s.objectives || []).includes(obj.name)
        );

        if (scenariosForObj.length === 0) return;

        const baselineRisk = aggregateRisk(computeRiskFromPerformance(scenariosForObj, cellOverrides));
        const improvedRisk = aggregateRisk(computeRiskFromPerformance(scenariosForObj, testOverrides));
        const riskReduction = baselineRisk.rALE - improvedRisk.rALE;

        // Skip actions with negligible risk reduction
        if (riskReduction < 0.05) return;

        // Compute effort from the relevant CIS safeguards
        const mappings = getMappingsForObjective(obj.id, {});
        const relevantMappings = mappings.filter(m => m.phases[phase]);
        const baseEffort = relevantMappings.length > 0
          ? relevantMappings.reduce((sum, m) => sum + (SAFEGUARD_EFFORT[m.id] || 15), 0) / relevantMappings.length
          : 20; // default if no mapped safeguards

        const effort = Math.round(
          baseEffort
          * (actualImprovement / 10) // scale by improvement size
          * (DIMENSION_EFFORT_MULTIPLIER[dim.key] || 1.0)
          * (PHASE_EFFORT_MULTIPLIER[phase] || 1.0)
        );

        const phaseLabels = { see: 'Observe', evaluate: 'Assess', act: 'Respond', achieve: 'Verify' };

        actions.push({
          id: `${obj.id}:${dim.key}:${phase}`,
          objectiveId: obj.id,
          objectiveName: obj.name,
          stage: obj.stage,
          dimKey: dim.key,
          dimLabel: dim.label,
          phase,
          phaseLabel: phaseLabels[phase] || phase,
          currentValue: current,
          targetValue: target,
          maxValue: maxPerf,
          riskReduction: Math.round(riskReduction * 100) / 100,
          effort: Math.max(1, effort),
          efficiency: effort > 0 ? Math.round((riskReduction / effort) * 1000) / 1000 : 0,
          affectedScenarios: scenariosForObj.map(s => s.id),
          affectedScenarioCount: scenariosForObj.length,
          description: `Improve ${dim.label} at the ${phaseLabels[phase]} phase for ${obj.name}`,
          shortDescription: `${dim.label} → ${phaseLabels[phase]}`,
        });
      });
    });
  });

  // Sort by efficiency (risk reduction per effort day) descending
  return actions.sort((a, b) => b.efficiency - a.efficiency);
}

/**
 * Compute cumulative risk reduction curve from a ranked action list.
 * Returns the same array with cumulative fields added.
 */
export function addCumulativeReduction(actions) {
  let cumulativeReduction = 0;
  let cumulativeEffort = 0;

  return actions.map((action, index) => {
    cumulativeReduction += action.riskReduction;
    cumulativeEffort += action.effort;
    return {
      ...action,
      rank: index + 1,
      cumulativeReduction: Math.round(cumulativeReduction * 100) / 100,
      cumulativeEffort,
      marginalEfficiency: index > 0
        ? Math.round((action.riskReduction / action.effort) * 1000) / 1000
        : action.efficiency,
    };
  });
}

/**
 * Get actions filtered by a budget constraint (total effort days).
 */
export function getActionsWithinBudget(actions, maxEffortDays) {
  let totalEffort = 0;
  const result = [];
  for (const action of actions) {
    if (totalEffort + action.effort > maxEffortDays) continue;
    totalEffort += action.effort;
    result.push(action);
  }
  return result;
}
