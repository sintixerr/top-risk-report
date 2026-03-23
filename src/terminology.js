// ═══════════════════════════════════════════════════════════════════════════
// Terminology — Single Source of Truth for User-Facing Labels
// ═══════════════════════════════════════════════════════════════════════════
//
// Every user-facing string in the demo imports from here.
// Structure: { label: "what users see", formal: "internal term", tip: "tooltip" }
// Currently only `label` renders. `formal` is reserved for a future
// "Technical Reference" toggle.
//
// Session 2026-03-20. Clean labels for practitioner audiences.

// ─── Defense Cycle Phases (formerly S/E/A/Ach) ───

export const DEFENSE_CYCLE = {
  name: { label: "Defense Cycle", formal: "S/E/A/Ach Cycle" },
  description: {
    label: "Effective defense requires four connected phases. Missing any phase means the defense is incomplete — not weak, incomplete.",
    formal: "The See/Evaluate/Act/Achieve cycle is the universal mechanism by which any control produces a result.",
  },
  phases: {
    see:     { label: "Observe",  formal: "See",      abbr: "O",  tip: "Can the organization detect the relevant condition, event, or threat?" },
    evaluate:{ label: "Assess",   formal: "Evaluate",  abbr: "A",  tip: "Can it judge whether what was observed requires action?" },
    act:     { label: "Respond",  formal: "Act",       abbr: "R",  tip: "Can it take action to address the situation?" },
    achieve: { label: "Verify",   formal: "Achieve",   abbr: "V",  tip: "Can it confirm the action produced the intended result?" },
  },
  phaseOrder: ["see", "evaluate", "act", "achieve"],
};

// ─── Control Positions (formerly Position 1/2/3, Grid Columns) ───

export const POSITIONS = {
  name: { label: "Defense Positions", formal: "Control Positions" },
  cols: {
    "Conditions":  { label: "Prevent Conditions",     formal: "Conditions (C1)",  short: "Prevent",  tip: "Remove the environmental weaknesses that make attacks possible. Broad, durable, defender's pace." },
    "TTPs":        { label: "Detect & Block Attacks",  formal: "TTPs (C2)",        short: "Detect",   tip: "Identify and stop attack techniques in progress. Narrow, must be active during the attack." },
    "Result":      { label: "Limit Damage",            formal: "Result (C3)",      short: "Limit",    tip: "Contain impact and restore operations when an attack succeeds. Reactive, reduces cost per incident." },
  },
};

// ─── Grid Rows (formerly Direct/Instrument/Govern) ───

export const POSTURES = {
  rows: {
    "Direct":     { label: "Operational",  formal: "Direct",     tip: "Front-line controls that directly enforce, block, or remediate." },
    "Instrument": { label: "Monitoring",   formal: "Instrument", tip: "Controls that observe, measure, and generate alerts." },
    "Govern":     { label: "Governance",   formal: "Govern",     tip: "Controls that set policy, review performance, and direct resources." },
  },
};

// ─── Attack Structure (formerly Conjunction) ───

export const ATTACK = {
  conjunction: {
    name:   { label: "Attack Requirements",  formal: "Attack Conjunction" },
    description: {
      label: "Every attack step needs three things to succeed. Remove any one and the attack fails.",
      formal: "The perturbation conjunction: method + enabling condition + target.",
    },
  },
  legs: {
    ttp:       { label: "Attack Method",       formal: "TTP Leg",       tip: "What the attacker does — the technique or procedure employed." },
    weakness:  { label: "Vulnerability",        formal: "Weakness Leg",  tip: "What environmental condition makes the attack possible." },
    asset:     { label: "Target",              formal: "Asset Leg",     tip: "What system, data, or resource gets affected." },
  },
  stages: {
    "Initial Access": { label: "Entry",          formal: "Initial Access",  tip: "How the attacker gets in — phishing, exploitation, stolen credentials." },
    "Transit":        { label: "Movement",       formal: "Transit",         tip: "How the attacker moves from entry point to the real target." },
    "Payoff":         { label: "Impact",         formal: "Payoff",          tip: "What the attacker ultimately does — encrypt, steal, disrupt, manipulate." },
  },
};

// ─── Risk Quantities ───

export const QUANTITIES = {
  freq:  { label: "Threat Likelihood",        formal: "Inherent Frequency",  unit: "events / 3yr",  tip: "How often this type of attack is attempted, before any defenses act on it." },
  sF:    { label: "Frequency Reduction",      formal: "Susceptibility (F)",  tip: "How much defenses reduce the likelihood of a successful attack." },
  rF:    { label: "Residual Likelihood",      formal: "Residual Frequency",  unit: "events / 3yr",  tip: "How often attacks actually succeed after defenses." },
  mag:   { label: "Financial Impact",         formal: "Loss Magnitude",      unit: "$M per event",  tip: "Expected cost per successful attack — traced through stakeholder impacts." },
  sM:    { label: "Impact Reduction",         formal: "Susceptibility (M)",  tip: "How much defenses reduce the cost when an attack does succeed." },
  rM:    { label: "Residual Impact",          formal: "Residual Magnitude",  unit: "$M per event",  tip: "Expected cost after defenses limit the damage." },
  iALE:  { label: "Gross Annual Exposure",    formal: "Inherent ALE",        unit: "$M / year",     tip: "Annual expected cost before defenses: likelihood × impact." },
  rALE:  { label: "Net Annual Exposure",      formal: "Residual ALE",        unit: "$M / year",     tip: "Annual expected cost after defenses: what the organization is carrying." },
  cLev:  { label: "Defense Effectiveness",    formal: "Control Leverage",    unit: "%",             tip: "Percentage of gross exposure eliminated by current defenses." },
};

// ─── Structural Concepts ───

export const CONCEPTS = {
  theme: {
    label: "Risk Theme",
    formal: "Theme",
    tip: "A named grouping of related attack scenarios — like 'Ransomware' or 'Third Party Risk'. Themes cross-cut the baseline to answer stakeholder questions.",
  },
  scenario: {
    label: "Attack Scenario",
    formal: "Threat Scenario",
    tip: "A complete, structurally defined attack path — from attacker motivation through specific attack steps to business impact.",
  },
  objective: {
    label: "Defensive Position",
    formal: "Control Objective",
    tip: "A specific point where the organization can defend — defined by what attack method it blocks, what vulnerability it addresses, and what target it protects.",
  },
  baseline: {
    label: "Quarterly Baseline",
    formal: "Baseline Scenario Set",
    tip: "The standing set of 22 attack scenarios measured each quarter — the single source of truth for all risk reports.",
  },
  cycleClosure: {
    label: "Defense Completeness",
    formal: "Cycle Closure",
    tip: "Whether all four defense phases (Observe → Assess → Respond → Verify) are connected and functioning. Incomplete = no effective defense at that position.",
  },
  safeguard: {
    label: "Security Control",
    formal: "CIS Safeguard",
    tip: "A specific security practice from the CIS Controls framework, mapped to a defensive position.",
  },
  effectiveness: {
    label: "Implementation Strength",
    formal: "Effectiveness",
    tip: "How well this security control is implemented in practice (0% = not implemented, 100% = fully effective).",
  },
};

// ─── Screen Descriptions ───

export const SCREENS = {
  landing: {
    title: "System Overview",
    subtitle: "A formal reasoning system for cybersecurity risk — connecting threats, defenses, and consequences through traceable structure.",
  },
  ranked: {
    title: "Risk Themes — Ranked",
    subtitle: "All risk themes ranked by exposure. Switch dimensions to see rankings by attack methods, vulnerabilities, targets, or defensive positions.",
    help: "Each panel ranks elements within a vocabulary dimension by their aggregate risk exposure. Click any row to expand and see contributing scenarios. Use the sort dropdown to change the ranking criterion. Toggle 'Change' to see quarter-over-quarter movement.",
  },
  scatter: {
    title: "Risk Landscape",
    subtitle: "Risk themes plotted by likelihood vs. financial impact. Dot size shows total annual exposure. The dashed curve marks the risk tolerance boundary.",
    help: "Themes above and to the right of the tolerance curve exceed the organization's stated risk appetite. Arrows show how each theme has moved since last quarter. Click any dot to see its detail view.",
  },
  detail: {
    title: "Theme Detail",
    subtitle: "Full risk breakdown for one theme — threat picture, defense performance, residual exposure, and the analytical chain that produced these numbers.",
    help: "The top grid shows three layers: Gross (threat before defenses), Defense (how much defenses reduce risk), and Net (what the organization carries). Below, the Analytical Foundation shows every defensive position this theme depends on, with defense completeness status. Click any position to explore its controls.",
  },
  controls: {
    title: "Control Explorer",
    subtitle: "Interactive defense model — see how security controls map to defensive positions, where defense gaps exist, and how changes would affect risk.",
    help: "Select a defensive position on the left. The grid shows which CIS controls are mapped to each cell. The four-phase indicators (O/A/R/V) show whether the defense cycle is complete. Adjust control sliders to model 'what-if' scenarios — the impact panel on the right shows how every affected scenario's risk would change.",
  },
  deepdive: {
    title: "Structural Analysis",
    subtitle: "What's driving this theme's risk — shared vulnerabilities, defensive gaps, and where investment has the most leverage across all scenarios in the theme.",
    help: "This view decomposes a theme into its structural components: which scenarios contribute, which vulnerabilities appear across multiple scenarios (highest leverage for remediation), which defensive positions are traversed, and where defense cycle gaps exist.",
  },
  gaps: {
    title: "Defense Completeness Dashboard",
    subtitle: "Bird's-eye view of defense cycle health across all 10 defensive positions. Red cells indicate phases with no coverage — where the organization has structural blind spots.",
    help: "Each row is a defensive position. The four columns show whether each phase of the defense cycle (Observe, Assess, Respond, Verify) has coverage. A position where the cycle doesn't complete provides no effective defense regardless of what individual controls exist. The 'Score' reflects effectiveness penalized for gaps.",
  },
  portfolio: {
    title: "Scenario Portfolio",
    subtitle: "All 22 baseline attack scenarios with risk quantities. The complete measurement set from which all themes and reports are derived.",
    help: "This is the quarterly baseline — the single source of truth. Every other view in this report is a different cut through this same data. Sort by any column. The scatter chart below shows each scenario's likelihood vs. impact with a risk tolerance curve.",
  },
  builder: {
    title: "Theme Builder",
    subtitle: "Construct custom risk themes by selecting attack methods, vulnerabilities, targets, or defensive positions. Themes are vocabulary queries — structural cross-cuts through the baseline.",
    help: "Select values in one or more dimensions. Within a dimension, scenarios matching ANY selected value qualify (OR logic). Across dimensions, scenarios must match ALL dimensions with selections (AND logic). Save themes to use them across all report views.",
  },
};

// ─── Severity / Status Labels ───

export const STATUS = {
  cycleClosed:   { label: "Complete",       formal: "Cycle Closed",   color: "var(--teal)" },
  criticalGap:   { label: "Critical Gap",   formal: "Critical Gap",   color: "var(--coral)" },
  weakCoverage:  { label: "Partial",        formal: "Weak Coverage",  color: "var(--amber)" },
  gap:           { label: "Gap",            formal: "Phase Gap",      color: "var(--coral)" },
};

// ─── Formatting Helpers ───

export const fmt = {
  dollars: (v) => `$${v.toFixed(1)}M`,
  freq: (v) => `${v.toFixed(2)} /3yr`,
  pct: (v) => `${v.toFixed(0)}%`,
  pctSigned: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`,
  dollarsSigned: (v) => `${v >= 0 ? '+' : '−'}$${Math.abs(v).toFixed(1)}M`,
};
