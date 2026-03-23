// ═══════════════════════════════════════════════════════════════════════════
// CVE / Vulnerability Model — Assessment, Impact Computation, Remediation
// ═══════════════════════════════════════════════════════════════════════════
//
// Two modes of operation:
//   1. Pre-built CVEs: hand-authored impact profiles for demo
//   2. User-assessed CVEs: analyst maps to vocabulary + sets impact level
//
// The impact mechanism (Option A): each CVE defines performance cell
// penalties. The standard propagation chain handles everything downstream:
//   CVE penalties → degraded performance cells → higher susceptibility →
//   higher scenario risk → portfolio impact + remediation priority
//
// This is the SAME mechanism as the Action Queue and Performance grid.
// Patching a CVE = reversing its penalties = risk reduction computable
// through the identical propagation chain.
//
// Session 2026-03-22. Designed alongside the Vulnerability Management
// queue and Control Gap Management (renamed Action Queue).
// ═══════════════════════════════════════════════════════════════════════════

import { SCENARIOS, DATA } from './data.js';
import { OBJECTIVES } from './controlModel.js';
import {
  getCellValue, computeRiskFromPerformance, aggregateRisk,
  PERFORMANCE_DIMENSIONS, MAX_PERFORMANCE,
} from './performanceModel.js';


// ─── SEVERITY & ESCALATION CONSTANTS ───

export const SEVERITY_LEVELS = [
  { key: 'critical', label: 'Critical', color: '#E24B4A', bg: '#FCEBEB', border: '#FACDCD' },
  { key: 'high',     label: 'High',     color: '#D85A30', bg: '#FFF3E0', border: '#FFD9B3' },
  { key: 'medium',   label: 'Medium',   color: '#BA7517', bg: '#FAEEDA', border: '#F0D9A8' },
  { key: 'low',      label: 'Low',      color: '#639922', bg: '#EAF3DE', border: '#C8E6A0' },
];

export const ESCALATION_LEVELS = [
  { level: 1, label: 'Already Covered', desc: 'Existing scenarios and controls account for this vulnerability class. Impact is quantifiable from the baseline.', color: 'var(--teal)', bg: 'var(--teal-bg)' },
  { level: 2, label: 'Update Existing', desc: 'Affected scenarios exist but need updated parameters. Specific systems or configurations are newly exposed.', color: 'var(--navy)', bg: 'var(--blue-bg)' },
  { level: 3, label: 'Compose New', desc: 'May need new scenario composition from existing vocabulary. The vulnerability enables attack paths not currently modeled.', color: 'var(--amber)', bg: '#FAEEDA' },
  { level: 4, label: 'New Territory', desc: 'Genuinely novel — may require new vocabulary before impact can be assessed.', color: 'var(--coral)', bg: 'var(--coral-bg)' },
];

// Auto-generated penalty profiles from severity level (for user-created CVEs)
export const SEVERITY_PENALTY_PROFILES = {
  critical: {
    penalties: [
      { dimKey: 'features', phase: 'see', severity: 22 },
      { dimKey: 'features', phase: 'evaluate', severity: 18 },
      { dimKey: 'features', phase: 'act', severity: 20 },
      { dimKey: 'resilience', phase: 'see', severity: 15 },
      { dimKey: 'resilience', phase: 'act', severity: 12 },
      { dimKey: 'scope', phase: 'see', severity: 10 },
    ],
    effortDays: 15,
  },
  high: {
    penalties: [
      { dimKey: 'features', phase: 'see', severity: 16 },
      { dimKey: 'features', phase: 'evaluate', severity: 14 },
      { dimKey: 'resilience', phase: 'see', severity: 10 },
      { dimKey: 'scope', phase: 'see', severity: 8 },
    ],
    effortDays: 10,
  },
  medium: {
    penalties: [
      { dimKey: 'features', phase: 'see', severity: 10 },
      { dimKey: 'features', phase: 'evaluate', severity: 8 },
      { dimKey: 'scope', phase: 'see', severity: 6 },
    ],
    effortDays: 6,
  },
  low: {
    penalties: [
      { dimKey: 'features', phase: 'see', severity: 5 },
      { dimKey: 'scope', phase: 'see', severity: 4 },
    ],
    effortDays: 3,
  },
};


// ═══════════════════════════════════════════════════════════════════════════
// PRE-BUILT CVEs — 12 Demo Vulnerabilities
// ═══════════════════════════════════════════════════════════════════════════

export const BUILTIN_CVES = [
  {
    id: 'cve-2026-1001',
    cveId: 'CVE-2026-1001',
    title: 'Critical RCE in ubiquitous open-source library',
    severity: 'critical',
    escalation: 1,
    description: 'Remote code execution vulnerability in a widely-deployed open-source library used across web applications, middleware, and server infrastructure. Publicly disclosed with proof-of-concept exploit code. Affects virtually every internet-facing system running the library.',
    weaknessClasses: ['Software & Input Handling Defects'],
    assetClasses: [],
    penalties: [
      { dimKey: 'features', phase: 'see', severity: 20 },
      { dimKey: 'features', phase: 'act', severity: 18 },
      { dimKey: 'resilience', phase: 'see', severity: 12 },
      { dimKey: 'resilience', phase: 'act', severity: 10 },
    ],
    effortDays: 12,
    remediationNote: 'Patch all instances of the affected library. Prioritize internet-facing systems. Apply WAF rules as interim mitigation.',
    isBuiltin: true,
  },
  {
    id: 'cve-2026-1042',
    cveId: 'CVE-2026-1042',
    title: 'Authentication bypass in enterprise IAM platform',
    severity: 'critical',
    escalation: 1,
    description: 'Authentication bypass allowing unauthenticated access to administrative functions in the organization\'s primary identity management platform. Attacker can create accounts, modify privileges, and disable MFA enforcement.',
    weaknessClasses: ['Preventive Control Deficiency', 'Privilege & Entitlement Accumulation'],
    assetClasses: ['Identity & Access Management Systems'],
    penalties: [
      { dimKey: 'features', phase: 'evaluate', severity: 25 },
      { dimKey: 'features', phase: 'act', severity: 22 },
      { dimKey: 'scope', phase: 'evaluate', severity: 15 },
      { dimKey: 'scope', phase: 'act', severity: 12 },
    ],
    effortDays: 18,
    remediationNote: 'Apply vendor patch immediately. Audit all recent account modifications. Reset credentials for administrative accounts. Review MFA enforcement status.',
    isBuiltin: true,
  },
  {
    id: 'cve-2026-0847',
    cveId: 'CVE-2026-0847',
    title: 'SWIFT message validation flaw',
    severity: 'critical',
    escalation: 2,
    description: 'Flaw in SWIFT message validation allows crafted payment messages to bypass integrity checks. Enables unauthorized payment initiation if combined with compromised operator credentials. Narrow but catastrophic — affects payment processing infrastructure specifically.',
    weaknessClasses: ['Software & Input Handling Defects'],
    assetClasses: ['Payment & Settlement Systems'],
    penalties: [
      { dimKey: 'features', phase: 'evaluate', severity: 30 },
      { dimKey: 'features', phase: 'act', severity: 25 },
      { dimKey: 'dependencies', phase: 'act', severity: 20 },
      { dimKey: 'dependencies', phase: 'achieve', severity: 15 },
    ],
    effortDays: 25,
    remediationNote: 'Apply SWIFT-issued patch to message handling infrastructure. Implement additional out-of-band validation for high-value payments. Review operator access controls on payment systems.',
    isBuiltin: true,
  },
  {
    id: 'cve-2026-1188',
    cveId: 'CVE-2026-1188',
    title: 'Email security gateway filter bypass',
    severity: 'high',
    escalation: 1,
    description: 'Bypass in the email security gateway\'s content filtering engine allows specially crafted attachments to pass without inspection. Phishing emails with malicious payloads can reach end users undetected.',
    weaknessClasses: ['Assurance & Validation Deficiency'],
    assetClasses: ['Email & Collaboration Platforms'],
    penalties: [
      { dimKey: 'features', phase: 'see', severity: 18 },
      { dimKey: 'features', phase: 'evaluate', severity: 16 },
      { dimKey: 'scope', phase: 'see', severity: 10 },
    ],
    effortDays: 8,
    remediationNote: 'Update email gateway filter rules and engine. Deploy supplementary attachment sandboxing. Increase phishing awareness communications to workforce.',
    isBuiltin: true,
  },
  {
    id: 'cve-2026-0523',
    cveId: 'CVE-2026-0523',
    title: 'Network firmware privilege escalation',
    severity: 'high',
    escalation: 1,
    description: 'Privilege escalation vulnerability in network device firmware allows authenticated users to gain administrative control. Enables attackers with any network device access to modify routing, disable segmentation, and create covert channels.',
    weaknessClasses: ['Configuration & Policy Drift', 'Privilege & Entitlement Accumulation'],
    assetClasses: ['Network Infrastructure'],
    penalties: [
      { dimKey: 'features', phase: 'act', severity: 15 },
      { dimKey: 'features', phase: 'achieve', severity: 12 },
      { dimKey: 'governance', phase: 'achieve', severity: 12 },
      { dimKey: 'resilience', phase: 'act', severity: 10 },
    ],
    effortDays: 14,
    remediationNote: 'Apply firmware updates to all affected network devices. Audit current administrative access. Verify segmentation enforcement is intact. Implement out-of-band management network if not present.',
    isBuiltin: true,
  },
  {
    id: 'cve-2026-0991',
    cveId: 'CVE-2026-0991',
    title: 'Backup agent remote code execution',
    severity: 'critical',
    escalation: 2,
    description: 'Remote code execution in the backup agent software allows attackers to compromise backup infrastructure. Enables destruction of backup data, manipulation of recovery points, and lateral movement to recovery systems. Directly undermines the organization\'s last line of defense against ransomware.',
    weaknessClasses: ['Architectural Fragility & Recovery Constraints'],
    assetClasses: ['Backup & Recovery Systems'],
    penalties: [
      { dimKey: 'resilience', phase: 'act', severity: 28 },
      { dimKey: 'resilience', phase: 'achieve', severity: 25 },
      { dimKey: 'features', phase: 'act', severity: 18 },
      { dimKey: 'features', phase: 'achieve', severity: 15 },
    ],
    effortDays: 22,
    remediationNote: 'Patch backup agents immediately. Verify air-gapped/immutable backup copies are not accessible via the compromised agent. Test recovery from isolated copies. Consider backup architecture redesign if agent has network-level access to all backup targets.',
    isBuiltin: true,
  },
  {
    id: 'cve-2026-1305',
    cveId: 'CVE-2026-1305',
    title: 'AI training pipeline data poisoning vector',
    severity: 'high',
    escalation: 3,
    description: 'Vulnerability in the ML training pipeline allows injection of adversarial data through a compromised data source connector. Poisoned training data can cause model drift, leading to incorrect fraud detection, risk scoring, or trading decisions. Novel attack vector with limited existing detection capability.',
    weaknessClasses: ['Inherent Design Constraints'],
    assetClasses: ['AI/ML Model Infrastructure'],
    penalties: [
      { dimKey: 'features', phase: 'see', severity: 20 },
      { dimKey: 'features', phase: 'evaluate', severity: 18 },
      { dimKey: 'dependencies', phase: 'see', severity: 22 },
      { dimKey: 'dependencies', phase: 'evaluate', severity: 18 },
    ],
    effortDays: 30,
    remediationNote: 'This vulnerability may require new detection capabilities not currently in the baseline. Implement data provenance validation on training pipeline inputs. Establish model drift monitoring. Consider this a Level 3 escalation — new scenario composition may be needed.',
    isBuiltin: true,
  },
  {
    id: 'cve-2026-0712',
    cveId: 'CVE-2026-0712',
    title: 'Supply chain SaaS connector SSRF',
    severity: 'high',
    escalation: 2,
    description: 'Server-side request forgery in a widely-used SaaS integration connector allows attackers to pivot from the third-party service into the organization\'s internal network. Exploits the implicit trust relationship between the SaaS platform and internal APIs.',
    weaknessClasses: ['Implicit & Transitive Trust'],
    assetClasses: ['Third-Party Service Integrations'],
    penalties: [
      { dimKey: 'scope', phase: 'see', severity: 18 },
      { dimKey: 'scope', phase: 'act', severity: 15 },
      { dimKey: 'dependencies', phase: 'see', severity: 15 },
      { dimKey: 'dependencies', phase: 'act', severity: 12 },
    ],
    effortDays: 16,
    remediationNote: 'Restrict SaaS connector network access to minimum required endpoints. Implement egress filtering on integration APIs. Review all third-party service trust relationships. Deploy API gateway with request validation.',
    isBuiltin: true,
  },
  {
    id: 'cve-2026-1456',
    cveId: 'CVE-2026-1456',
    title: 'TLS implementation flaw enabling exfiltration inspection bypass',
    severity: 'high',
    escalation: 1,
    description: 'Implementation flaw in the TLS inspection infrastructure allows crafted connections to bypass deep packet inspection. Exfiltration of data through these connections is invisible to network DLP and monitoring. Primarily affects scenarios where data leaves the network.',
    weaknessClasses: ['Detection & Monitoring Deficiency', 'Cryptographic Weakness'],
    assetClasses: ['Network Infrastructure'],
    penalties: [
      { dimKey: 'features', phase: 'see', severity: 18 },
      { dimKey: 'features', phase: 'evaluate', severity: 16 },
      { dimKey: 'resilience', phase: 'see', severity: 12 },
    ],
    effortDays: 12,
    remediationNote: 'Update TLS inspection infrastructure. Review certificate pinning configurations. Audit DLP bypass exceptions. Test with known exfiltration techniques to verify inspection coverage.',
    isBuiltin: true,
  },
  {
    id: 'cve-2026-0634',
    cveId: 'CVE-2026-0634',
    title: 'EDR kernel driver vulnerability enabling defense evasion',
    severity: 'critical',
    escalation: 1,
    description: 'Vulnerability in the EDR agent\'s kernel driver allows attackers to disable endpoint detection and response capabilities. Once exploited, the attacker operates undetected on the compromised endpoint — the defenders\' primary visibility tool is blinded. This is an attack on the defense itself.',
    weaknessClasses: ['Dual-Use Functionality'],
    assetClasses: ['Security Infrastructure', 'Endpoint Devices'],
    penalties: [
      { dimKey: 'features', phase: 'see', severity: 25 },
      { dimKey: 'features', phase: 'evaluate', severity: 22 },
      { dimKey: 'features', phase: 'act', severity: 20 },
      { dimKey: 'resilience', phase: 'see', severity: 18 },
      { dimKey: 'resilience', phase: 'evaluate', severity: 15 },
      { dimKey: 'cadence', phase: 'see', severity: 10 },
    ],
    effortDays: 10,
    remediationNote: 'Apply EDR vendor kernel driver patch immediately. This is the highest-urgency item — the vulnerability disables the primary detection mechanism. Verify EDR agent integrity across all endpoints post-patch. Consider deploying independent canary detection as backup.',
    isBuiltin: true,
  },
  {
    id: 'cve-2026-1567',
    cveId: 'CVE-2026-1567',
    title: 'Database privilege escalation via stored procedure injection',
    severity: 'high',
    escalation: 2,
    description: 'Stored procedure injection vulnerability in the database engine allows authenticated users to escalate to DBA privileges. Enables access to all data in the database instance, including data the user\'s application role should not reach.',
    weaknessClasses: ['Privilege & Entitlement Accumulation'],
    assetClasses: ['Database Systems'],
    penalties: [
      { dimKey: 'features', phase: 'evaluate', severity: 18 },
      { dimKey: 'features', phase: 'achieve', severity: 15 },
      { dimKey: 'governance', phase: 'evaluate', severity: 12 },
      { dimKey: 'governance', phase: 'achieve', severity: 10 },
    ],
    effortDays: 14,
    remediationNote: 'Apply database engine patch. Audit stored procedure permissions. Review database role assignments for least-privilege compliance. Implement database activity monitoring for privilege escalation detection.',
    isBuiltin: true,
  },
  {
    id: 'cve-2026-0289',
    cveId: 'CVE-2026-0289',
    title: 'Cloud storage API misconfiguration enabling public read access',
    severity: 'medium',
    escalation: 2,
    description: 'Default API configuration in the cloud storage service exposes bucket contents to authenticated requests from any account in the cloud provider\'s tenant. Not publicly accessible, but any compromised account in the cloud environment can read all stored data.',
    weaknessClasses: ['Unmanaged Exposure & Shadow Assets'],
    assetClasses: ['File Storage Systems'],
    penalties: [
      { dimKey: 'scope', phase: 'see', severity: 15 },
      { dimKey: 'scope', phase: 'act', severity: 12 },
      { dimKey: 'governance', phase: 'see', severity: 12 },
      { dimKey: 'governance', phase: 'act', severity: 10 },
    ],
    effortDays: 5,
    remediationNote: 'Reconfigure cloud storage bucket policies to deny cross-account access. Implement cloud security posture management (CSPM) scanning. Review all cloud storage configurations against organizational baseline.',
    isBuiltin: true,
  },
];


// ═══════════════════════════════════════════════════════════════════════════
// COMPUTATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find scenarios affected by a CVE.
 * A scenario is affected if it contains ANY of the CVE's weakness classes
 * AND (if asset filter exists) ANY of the CVE's asset classes.
 */
export function getAffectedScenarios(cve) {
  return DATA.filter(s => {
    const hasWeakness = cve.weaknessClasses.some(w => s.weaknesses.includes(w));
    if (!hasWeakness) return false;
    if (!cve.assetClasses || cve.assetClasses.length === 0) return true;
    return cve.assetClasses.some(a => (s.assets || []).includes(a));
  });
}

/**
 * Find objective IDs affected by a CVE (objectives traversed by affected scenarios).
 */
export function getAffectedObjectiveIds(cve) {
  const affected = getAffectedScenarios(cve);
  const objNames = new Set();
  affected.forEach(s => (s.objectives || []).forEach(o => objNames.add(o)));
  return OBJECTIVES.filter(o => objNames.has(o.name)).map(o => o.id);
}

/**
 * Build performance cell overrides from a CVE's penalties.
 * Each penalty is applied to EVERY affected objective.
 * The penalty subtracts from the current cell value, clamped to [0, current].
 */
export function buildCveOverrides(cve, existingOverrides = {}) {
  const objectiveIds = getAffectedObjectiveIds(cve);
  const overrides = { ...existingOverrides };

  objectiveIds.forEach(objId => {
    (cve.penalties || []).forEach(p => {
      const key = `${objId}:${p.dimKey}:${p.phase}`;
      const current = getCellValue(objId, p.dimKey, p.phase, existingOverrides);
      overrides[key] = Math.max(0, current - p.severity);
    });
  });

  return overrides;
}

/**
 * Build combined overrides from multiple active CVEs.
 * Penalties stack — multiple CVEs affecting the same cell compound.
 */
export function buildMultiCveOverrides(cves) {
  let overrides = {};
  cves.forEach(cve => {
    overrides = buildCveOverrides(cve, overrides);
  });
  return overrides;
}

/**
 * Compute the full impact of a single CVE.
 * Returns: baseline risk, degraded risk, delta, affected scenarios with per-scenario detail.
 */
export function computeCveImpact(cve) {
  const affectedScenarios = getAffectedScenarios(cve);
  const affectedObjectiveIds = getAffectedObjectiveIds(cve);

  if (affectedScenarios.length === 0) {
    return {
      affectedScenarios: [],
      affectedObjectiveIds: [],
      baselineRisk: aggregateRisk(computeRiskFromPerformance(DATA, {})),
      degradedRisk: aggregateRisk(computeRiskFromPerformance(DATA, {})),
      portfolioDelta: 0,
      scenarioDetails: [],
    };
  }

  // Baseline: current performance (no CVE)
  const baselineAll = computeRiskFromPerformance(DATA, {});
  const baselineRisk = aggregateRisk(baselineAll);

  // Degraded: performance with CVE penalties applied
  const cveOverrides = buildCveOverrides(cve);
  const degradedAll = computeRiskFromPerformance(DATA, cveOverrides);
  const degradedRisk = aggregateRisk(degradedAll);

  // Per-scenario detail
  const scenarioDetails = affectedScenarios.map(s => {
    const baseline = baselineAll.find(b => b.id === s.id);
    const degraded = degradedAll.find(d => d.id === s.id);
    return {
      id: s.id,
      name: s.name,
      baselineALE: baseline?.rALE ?? 0,
      degradedALE: degraded?.rALE ?? 0,
      delta: (degraded?.rALE ?? 0) - (baseline?.rALE ?? 0),
      pctChange: baseline?.rALE > 0
        ? (((degraded?.rALE ?? 0) - baseline.rALE) / baseline.rALE) * 100
        : 0,
    };
  }).sort((a, b) => b.delta - a.delta);

  // Threshold analysis
  const threshold = 50; // Would come from risk appetite in production
  const baselineBreaches = baselineAll.filter(s => s.rALE > threshold / DATA.length).length;
  const degradedBreaches = degradedAll.filter(s => s.rALE > threshold / DATA.length).length;
  const newBreaches = degradedBreaches - baselineBreaches;

  return {
    affectedScenarios,
    affectedObjectiveIds,
    baselineRisk,
    degradedRisk,
    portfolioDelta: degradedRisk.rALE - baselineRisk.rALE,
    portfolioDeltaPct: baselineRisk.rALE > 0
      ? ((degradedRisk.rALE - baselineRisk.rALE) / baselineRisk.rALE) * 100
      : 0,
    scenarioDetails,
    newThresholdBreaches: newBreaches,
    cveOverrides,
  };
}

/**
 * Compute remediation priority for a CVE.
 * Risk reduction from patching = risk added by CVE = degraded - baseline.
 * Efficiency = risk reduction / effort days.
 */
export function computeRemediationPriority(cve) {
  const impact = computeCveImpact(cve);
  const riskReduction = impact.portfolioDelta; // This is risk ADDED by CVE = risk REMOVED by patching
  const effort = cve.effortDays || 10;
  const efficiency = effort > 0 ? riskReduction / effort : 0;

  return {
    ...cve,
    riskReduction: Math.round(riskReduction * 100) / 100,
    effort,
    efficiency: Math.round(efficiency * 1000) / 1000,
    affectedScenarioCount: impact.affectedScenarios.length,
    affectedObjectiveCount: impact.affectedObjectiveIds.length,
    portfolioDeltaPct: Math.round(impact.portfolioDeltaPct * 10) / 10,
    impact,
  };
}

/**
 * Compute remediation priorities for all CVEs, ranked by efficiency.
 */
export function computeAllRemediationPriorities(cves) {
  return cves
    .map(computeRemediationPriority)
    .sort((a, b) => b.efficiency - a.efficiency);
}

/**
 * Add cumulative reduction to a ranked remediation list.
 */
export function addCumulativeRemediationReduction(ranked) {
  let cumReduction = 0;
  let cumEffort = 0;
  return ranked.map((item, i) => {
    cumReduction += item.riskReduction;
    cumEffort += item.effort;
    return {
      ...item,
      rank: i + 1,
      cumulativeReduction: Math.round(cumReduction * 100) / 100,
      cumulativeEffort: cumEffort,
    };
  });
}


// ═══════════════════════════════════════════════════════════════════════════
// USER CVE MANAGEMENT (localStorage, mirrors user themes pattern)
// ═══════════════════════════════════════════════════════════════════════════

const CVE_STORAGE_KEY = 'top-risk-report-user-cves';

export function loadUserCves() {
  try {
    const raw = localStorage.getItem(CVE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserCves(cves) {
  try {
    localStorage.setItem(CVE_STORAGE_KEY, JSON.stringify(cves));
  } catch (e) {
    console.error('Failed to save CVEs:', e);
  }
}

/**
 * Create a user CVE from form data.
 * Penalties are auto-generated from severity level.
 */
export function createUserCve({ cveId, title, severity, description, weaknessClasses, assetClasses }) {
  const profile = SEVERITY_PENALTY_PROFILES[severity] || SEVERITY_PENALTY_PROFILES.medium;
  return {
    id: 'user-cve-' + Date.now(),
    cveId: cveId || 'CVE-XXXX-XXXX',
    title: title || 'Untitled vulnerability',
    severity,
    escalation: 2, // User-created CVEs default to Level 2
    description: description || '',
    weaknessClasses: weaknessClasses || [],
    assetClasses: assetClasses || [],
    penalties: profile.penalties,
    effortDays: profile.effortDays,
    remediationNote: 'User-assessed vulnerability. Remediation effort and impact are estimated from severity level.',
    isBuiltin: false,
    isUserCreated: true,
    createdAt: Date.now(),
  };
}
