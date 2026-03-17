// Real v2 scenario data with full names and vocabulary bindings
// Risk quantities are simulated for mockup purposes

export const SCENARIOS = [
  {
    id: "S-01",
    name: "Espionage — Backdoor Implantation for Future Use",
    ttps: ["Software & Service Exploitation", "Availability Attacks & Resource Abuse", "Supply Chain & Trust Exploitation", "Execution, Persistence & Evasion", "Identity & Access Abuse", "Network Traversal & Command Control"],
    weaknesses: ["Necessary Exposed Interfaces", "Software & Input Handling Defects", "Resource & Throughput Ceilings", "Assurance & Validation Deficiency", "Implicit & Transitive Trust", "Detection & Monitoring Deficiency", "Dual-Use Functionality", "Preventive Control Deficiency", "Privilege & Entitlement Accumulation", "Configuration & Policy Drift"],
    objectives: ["Technical Exploitation Entry", "Disruption & Destruction", "Identity & Trust Exploitation Entry", "Persistence, Evasion & Enablement", "Lateral Movement & Staging"],
    assets: ["Email & Collaboration Platforms", "Identity & Access Management Systems", "Network Infrastructure", "Endpoint Devices", "Security Infrastructure"],
    motiveObj: "Capability Acquisition & Use → Broaden Operational Choices",
    freq: 0.85, mag: 14.2, sF: 0.35, sM: 0.6,
    controlGaps: ["Lateral Movement & Staging: Act phase gap", "Persistence, Evasion & Enablement: Achieve phase gap"]
  },
  {
    id: "S-02",
    name: "Espionage — Trade Secrets & Client Intelligence Theft",
    ttps: ["Social Engineering & Human Manipulation", "Identity & Access Abuse", "Execution, Persistence & Evasion", "Data Collection & Exfiltration"],
    weaknesses: ["Governance, Policy & Workforce Deficiency", "Necessary Exposed Interfaces", "Dual-Use Functionality", "Preventive Control Deficiency", "Configuration & Policy Drift", "Implicit & Transitive Trust", "Detection & Monitoring Deficiency", "Privilege & Entitlement Accumulation"],
    objectives: ["Social Engineering Entry", "Technical Exploitation Entry", "Identity & Trust Exploitation Entry", "Data Exfiltration & Disclosure", "Lateral Movement & Staging", "Data Collection & Staging"],
    assets: ["Email & Collaboration Platforms", "Identity & Access Management Systems", "Document Management Systems", "Client Data Repositories"],
    motiveObj: "Information Acquisition & Use → Obtain Proprietary Business Information",
    freq: 1.2, mag: 22.5, sF: 0.4, sM: 0.55,
    controlGaps: ["Data Exfiltration & Disclosure: See and Act phase gaps", "Data Collection & Staging: Evaluate phase gap"]
  },
  {
    id: "S-04",
    name: "Business Email Compromise Wire Fraud",
    ttps: ["Social Engineering & Human Manipulation", "Execution, Persistence & Evasion", "Identity & Access Abuse"],
    weaknesses: ["Governance, Policy & Workforce Deficiency", "Necessary Exposed Interfaces", "Dual-Use Functionality", "Preventive Control Deficiency", "Inherent Design Constraints", "Assurance & Validation Deficiency"],
    objectives: ["Social Engineering Entry", "Technical Exploitation Entry", "Identity & Trust Exploitation Entry", "Transaction & Process Fraud"],
    assets: ["Email & Collaboration Platforms", "Payment & Settlement Systems", "Identity & Access Management Systems"],
    motiveObj: "Fraud, Theft & Illicit Transfer → Steal Monetary Value via Unauthorized Payments",
    freq: 3.5, mag: 4.8, sF: 0.55, sM: 0.7,
    controlGaps: ["Transaction & Process Fraud: Evaluate phase gap"]
  },
  {
    id: "S-05",
    name: "SWIFT & Payment System Fraud",
    ttps: ["Social Engineering & Human Manipulation", "Execution, Persistence & Evasion", "Software & Service Exploitation", "Business Process & Transaction Manipulation", "Security Infrastructure Subversion", "Identity & Access Abuse", "Network Traversal & Command Control"],
    weaknesses: ["Governance, Policy & Workforce Deficiency", "Necessary Exposed Interfaces", "Dual-Use Functionality", "Preventive Control Deficiency", "Software & Input Handling Defects", "Unmanaged Exposure & Shadow Assets", "Implicit & Transitive Trust", "Detection & Monitoring Deficiency", "Privilege & Entitlement Accumulation", "Configuration & Policy Drift"],
    objectives: ["Social Engineering Entry", "Technical Exploitation Entry", "Transaction & Process Fraud", "Persistence, Evasion & Enablement", "Lateral Movement & Staging"],
    assets: ["Payment & Settlement Systems", "Core Banking Systems", "Identity & Access Management Systems", "Network Infrastructure"],
    motiveObj: "Fraud, Theft & Illicit Transfer → Steal Monetary Value via Unauthorized Payments",
    freq: 0.6, mag: 85.0, sF: 0.2, sM: 0.45,
    controlGaps: ["Transaction & Process Fraud: See and Achieve phase gaps", "Lateral Movement & Staging: Act phase gap"]
  },
  {
    id: "S-06",
    name: "Customer Account Takeover & Balance Theft",
    ttps: ["Identity & Access Abuse", "Software & Service Exploitation"],
    weaknesses: ["Inherent Design Constraints", "Preventive Control Deficiency", "Configuration & Policy Drift", "Software & Input Handling Defects", "Unmanaged Exposure & Shadow Assets"],
    objectives: ["Identity & Trust Exploitation Entry", "Technical Exploitation Entry", "Transaction & Process Fraud"],
    assets: ["Customer-Facing Web Applications", "Identity & Access Management Systems", "Core Banking Systems"],
    motiveObj: "Fraud, Theft & Illicit Transfer → Steal or Transfer Balances from Compromised Accounts",
    freq: 8.0, mag: 1.2, sF: 0.6, sM: 0.8,
    controlGaps: ["Transaction & Process Fraud: Achieve phase gap"]
  },
  {
    id: "S-07",
    name: "Data Breach Extortion",
    ttps: ["Software & Service Exploitation", "Availability Attacks & Resource Abuse", "Identity & Access Abuse", "Data Collection & Exfiltration", "Network Traversal & Command Control"],
    weaknesses: ["Necessary Exposed Interfaces", "Software & Input Handling Defects", "Resource & Throughput Ceilings", "Configuration & Policy Drift", "Preventive Control Deficiency", "Cryptographic Weakness", "Detection & Monitoring Deficiency", "Privilege & Entitlement Accumulation", "Implicit & Transitive Trust"],
    objectives: ["Technical Exploitation Entry", "Disruption & Destruction", "Identity & Trust Exploitation Entry", "Data Exfiltration & Disclosure", "Lateral Movement & Staging", "Data Collection & Staging"],
    assets: ["Database Systems", "File Storage Systems", "Identity & Access Management Systems", "Network Infrastructure"],
    motiveObj: "Coercive (Ransom & Extortion) → Extort Payment to Prevent or Limit Data Disclosure",
    freq: 1.8, mag: 35.0, sF: 0.3, sM: 0.5,
    controlGaps: ["Data Exfiltration & Disclosure: See and Evaluate phase gaps", "Data Collection & Staging: Act phase gap"]
  },
  {
    id: "S-08",
    name: "Double-Extortion Ransomware",
    ttps: ["Social Engineering & Human Manipulation", "Execution, Persistence & Evasion", "Software & Service Exploitation", "Availability Attacks & Resource Abuse", "Identity & Access Abuse", "Disruption, Destruction & Integrity Attacks", "Data Collection & Exfiltration", "Security Infrastructure Subversion", "Network Traversal & Command Control"],
    weaknesses: ["Governance, Policy & Workforce Deficiency", "Necessary Exposed Interfaces", "Dual-Use Functionality", "Preventive Control Deficiency", "Software & Input Handling Defects", "Resource & Throughput Ceilings", "Configuration & Policy Drift", "Architectural Fragility & Recovery Constraints", "Response & Containment Deficiency", "Detection & Monitoring Deficiency", "Privilege & Entitlement Accumulation", "Implicit & Transitive Trust"],
    objectives: ["Social Engineering Entry", "Technical Exploitation Entry", "Disruption & Destruction", "Identity & Trust Exploitation Entry", "Data Collection & Staging", "Persistence, Evasion & Enablement", "Lateral Movement & Staging"],
    assets: ["Email & Collaboration Platforms", "Endpoint Devices", "Server Infrastructure", "Backup & Recovery Systems", "Identity & Access Management Systems", "Database Systems", "Network Infrastructure"],
    motiveObj: "Coercive (Ransom & Extortion) → Extort Payment to Restore Operations and Prevent Data Disclosure",
    freq: 2.5, mag: 45.0, sF: 0.35, sM: 0.4,
    controlGaps: ["Disruption & Destruction: Achieve phase gap", "Lateral Movement & Staging: Act phase gap", "Data Collection & Staging: See phase gap"]
  },
  {
    id: "S-09",
    name: "Classic Ransomware — Operational Encryption",
    ttps: ["Social Engineering & Human Manipulation", "Execution, Persistence & Evasion", "Software & Service Exploitation", "Availability Attacks & Resource Abuse", "Disruption, Destruction & Integrity Attacks", "Security Infrastructure Subversion", "Identity & Access Abuse", "Network Traversal & Command Control"],
    weaknesses: ["Governance, Policy & Workforce Deficiency", "Necessary Exposed Interfaces", "Dual-Use Functionality", "Preventive Control Deficiency", "Software & Input Handling Defects", "Resource & Throughput Ceilings", "Unmanaged Exposure & Shadow Assets", "Architectural Fragility & Recovery Constraints", "Response & Containment Deficiency", "Detection & Monitoring Deficiency", "Privilege & Entitlement Accumulation", "Configuration & Policy Drift", "Implicit & Transitive Trust"],
    objectives: ["Social Engineering Entry", "Technical Exploitation Entry", "Disruption & Destruction", "Persistence, Evasion & Enablement", "Lateral Movement & Staging"],
    assets: ["Email & Collaboration Platforms", "Endpoint Devices", "Server Infrastructure", "Backup & Recovery Systems", "Network Infrastructure"],
    motiveObj: "Coercive (Ransom & Extortion) → Extort Payment to Restore Disrupted Business Operations",
    freq: 3.0, mag: 28.0, sF: 0.4, sM: 0.45,
    controlGaps: ["Disruption & Destruction: Achieve phase gap", "Lateral Movement & Staging: Act phase gap"]
  },
  {
    id: "S-10",
    name: "Bulk Data Breach for Dark-Web Sale",
    ttps: ["Software & Service Exploitation", "Identity & Access Abuse", "Data Collection & Exfiltration", "Network Traversal & Command Control"],
    weaknesses: ["Necessary Exposed Interfaces", "Software & Input Handling Defects", "Configuration & Policy Drift", "Implicit & Transitive Trust", "Preventive Control Deficiency", "Detection & Monitoring Deficiency", "Privilege & Entitlement Accumulation", "Unmanaged Exposure & Shadow Assets"],
    objectives: ["Technical Exploitation Entry", "Identity & Trust Exploitation Entry", "Data Exfiltration & Disclosure", "Lateral Movement & Staging", "Data Collection & Staging"],
    assets: ["Database Systems", "File Storage Systems", "Customer-Facing Web Applications", "Identity & Access Management Systems"],
    motiveObj: "Monetize Illicit Assets → Sell Stolen Datasets via Illicit Marketplaces",
    freq: 2.0, mag: 18.0, sF: 0.45, sM: 0.55,
    controlGaps: ["Data Exfiltration & Disclosure: See and Evaluate phase gaps", "Data Collection & Staging: Act phase gap"]
  },
  {
    id: "S-11",
    name: "Infrastructure Dependency Mapping for Future Targeting",
    ttps: ["Software & Service Exploitation", "Availability Attacks & Resource Abuse", "Supply Chain & Trust Exploitation", "Identity & Access Abuse", "Data Collection & Exfiltration", "Network Traversal & Command Control"],
    weaknesses: ["Necessary Exposed Interfaces", "Software & Input Handling Defects", "Resource & Throughput Ceilings", "Assurance & Validation Deficiency", "Implicit & Transitive Trust", "Configuration & Policy Drift", "Detection & Monitoring Deficiency", "Privilege & Entitlement Accumulation"],
    objectives: ["Technical Exploitation Entry", "Disruption & Destruction", "Identity & Trust Exploitation Entry", "Data Collection & Staging", "Lateral Movement & Staging"],
    assets: ["Network Infrastructure", "Server Infrastructure", "Identity & Access Management Systems", "Security Infrastructure"],
    motiveObj: "Conflict Preparation & Response → Map Critical Financial-System Dependencies",
    freq: 0.7, mag: 8.0, sF: 0.3, sM: 0.5,
    controlGaps: ["Data Collection & Staging: Act phase gap", "Lateral Movement & Staging: Evaluate phase gap"]
  },
  {
    id: "S-12",
    name: "Deniable Proxy Operations — Response Threshold Probing",
    ttps: ["Social Engineering & Human Manipulation", "Execution, Persistence & Evasion", "Software & Service Exploitation", "Availability Attacks & Resource Abuse", "Identity & Access Abuse"],
    weaknesses: ["Governance, Policy & Workforce Deficiency", "Necessary Exposed Interfaces", "Dual-Use Functionality", "Preventive Control Deficiency", "Software & Input Handling Defects", "Resource & Throughput Ceilings", "Configuration & Policy Drift"],
    objectives: ["Social Engineering Entry", "Technical Exploitation Entry", "Disruption & Destruction", "Identity & Trust Exploitation Entry", "Data Collection & Staging"],
    assets: ["Email & Collaboration Platforms", "Customer-Facing Web Applications", "Network Infrastructure", "Endpoint Devices"],
    motiveObj: "Conflict Preparation & Response → Probe Response Thresholds and Playbooks",
    freq: 1.0, mag: 5.0, sF: 0.4, sM: 0.6,
    controlGaps: ["Data Collection & Staging: Evaluate phase gap"]
  },
  {
    id: "S-13",
    name: "Integrity Attacks & Disinformation Campaign",
    ttps: ["Software & Service Exploitation", "Social Engineering & Human Manipulation", "Identity & Access Abuse", "Disruption, Destruction & Integrity Attacks", "Business Process & Transaction Manipulation", "Network Traversal & Command Control", "Supply Chain & Trust Exploitation"],
    weaknesses: ["Necessary Exposed Interfaces", "Software & Input Handling Defects", "Assurance & Validation Deficiency", "Inherent Design Constraints", "Configuration & Policy Drift", "Preventive Control Deficiency", "Governance, Policy & Workforce Deficiency", "Implicit & Transitive Trust"],
    objectives: ["Technical Exploitation Entry", "Social Engineering Entry", "Identity & Trust Exploitation Entry", "Information Integrity Attacks", "Lateral Movement & Staging"],
    assets: ["Customer-Facing Web Applications", "Content Management Systems", "Social Media Presence", "Email & Collaboration Platforms", "Identity & Access Management Systems"],
    motiveObj: "Strategic Influence & Perception → Undermine Public and Sector Confidence",
    freq: 0.8, mag: 30.0, sF: 0.3, sM: 0.5,
    controlGaps: ["Information Integrity Attacks: See and Evaluate phase gaps", "Social Engineering Entry: Achieve phase gap"]
  },
  {
    id: "S-14",
    name: "MNPI Exfiltration for Market Front-Running",
    ttps: ["Social Engineering & Human Manipulation", "Execution, Persistence & Evasion", "Identity & Access Abuse", "Data Collection & Exfiltration"],
    weaknesses: ["Governance, Policy & Workforce Deficiency", "Necessary Exposed Interfaces", "Dual-Use Functionality", "Preventive Control Deficiency", "Configuration & Policy Drift", "Implicit & Transitive Trust", "Detection & Monitoring Deficiency", "Privilege & Entitlement Accumulation"],
    objectives: ["Social Engineering Entry", "Technical Exploitation Entry", "Identity & Trust Exploitation Entry", "Data Exfiltration & Disclosure", "Lateral Movement & Staging", "Data Collection & Staging"],
    assets: ["Email & Collaboration Platforms", "Document Management Systems", "Trading Systems", "Identity & Access Management Systems"],
    motiveObj: "Fraud, Theft & Illicit Transfer → Exploit Stolen MNPI for Trading Advantage",
    freq: 1.0, mag: 40.0, sF: 0.35, sM: 0.5,
    controlGaps: ["Data Exfiltration & Disclosure: See phase gap", "Data Collection & Staging: Evaluate and Act phase gaps"]
  },
  {
    id: "S-15",
    name: "Pre-Positioned Destructive Attack on Financial Infrastructure",
    ttps: ["Software & Service Exploitation", "Availability Attacks & Resource Abuse", "Supply Chain & Trust Exploitation", "Disruption, Destruction & Integrity Attacks", "Security Infrastructure Subversion", "Identity & Access Abuse", "Network Traversal & Command Control"],
    weaknesses: ["Necessary Exposed Interfaces", "Software & Input Handling Defects", "Resource & Throughput Ceilings", "Assurance & Validation Deficiency", "Implicit & Transitive Trust", "Architectural Fragility & Recovery Constraints", "Detection & Monitoring Deficiency", "Dual-Use Functionality", "Preventive Control Deficiency", "Privilege & Entitlement Accumulation", "Configuration & Policy Drift"],
    objectives: ["Technical Exploitation Entry", "Disruption & Destruction", "Identity & Trust Exploitation Entry", "Persistence, Evasion & Enablement", "Lateral Movement & Staging"],
    assets: ["Server Infrastructure", "Network Infrastructure", "Backup & Recovery Systems", "Core Banking Systems", "Identity & Access Management Systems", "Security Infrastructure"],
    motiveObj: "Conflict Preparation & Response → Degrade or Destroy Critical Financial Processing on Command",
    freq: 0.3, mag: 120.0, sF: 0.15, sM: 0.35,
    controlGaps: ["Persistence, Evasion & Enablement: See and Evaluate phase gaps", "Disruption & Destruction: Achieve phase gap"]
  },
  {
    id: "S-16",
    name: "Hacktivist DDoS, Defacement & Selective Leak Campaign",
    ttps: ["Software & Service Exploitation", "Availability Attacks & Resource Abuse", "Identity & Access Abuse", "Data Collection & Exfiltration", "Disruption, Destruction & Integrity Attacks", "Network Traversal & Command Control"],
    weaknesses: ["Necessary Exposed Interfaces", "Software & Input Handling Defects", "Resource & Throughput Ceilings", "Configuration & Policy Drift", "Preventive Control Deficiency", "Detection & Monitoring Deficiency", "Privilege & Entitlement Accumulation", "Assurance & Validation Deficiency", "Architectural Fragility & Recovery Constraints", "Implicit & Transitive Trust"],
    objectives: ["Technical Exploitation Entry", "Disruption & Destruction", "Identity & Trust Exploitation Entry", "Data Collection & Staging", "Information Integrity Attacks", "Lateral Movement & Staging"],
    assets: ["Customer-Facing Web Applications", "Network Infrastructure", "Content Management Systems", "Server Infrastructure"],
    motiveObj: "Disruption & Protest → Disrupt Services and Publicly Embarrass Institution",
    freq: 2.0, mag: 8.0, sF: 0.45, sM: 0.6,
    controlGaps: ["Information Integrity Attacks: Act phase gap", "Disruption & Destruction: Achieve phase gap"]
  },
  {
    id: "S-17",
    name: "Initial Access Brokerage Operations",
    ttps: ["Social Engineering & Human Manipulation", "Execution, Persistence & Evasion", "Software & Service Exploitation", "Availability Attacks & Resource Abuse", "Identity & Access Abuse", "Network Traversal & Command Control"],
    weaknesses: ["Governance, Policy & Workforce Deficiency", "Necessary Exposed Interfaces", "Dual-Use Functionality", "Preventive Control Deficiency", "Software & Input Handling Defects", "Resource & Throughput Ceilings", "Inherent Design Constraints", "Configuration & Policy Drift", "Privilege & Entitlement Accumulation", "Implicit & Transitive Trust"],
    objectives: ["Social Engineering Entry", "Technical Exploitation Entry", "Disruption & Destruction", "Identity & Trust Exploitation Entry", "Persistence, Evasion & Enablement", "Lateral Movement & Staging"],
    assets: ["Email & Collaboration Platforms", "Customer-Facing Web Applications", "Endpoint Devices", "Identity & Access Management Systems", "Network Infrastructure"],
    motiveObj: "Monetize Illicit Assets → Harvest and Sell Persistent Network Access",
    freq: 5.0, mag: 2.5, sF: 0.5, sM: 0.7,
    controlGaps: ["Persistence, Evasion & Enablement: Act phase gap"]
  },
  {
    id: "S-18",
    name: "Supply Chain Mass Customer Fraud via Compromised Vendor",
    ttps: ["Supply Chain & Trust Exploitation"],
    weaknesses: ["Assurance & Validation Deficiency", "Implicit & Transitive Trust"],
    objectives: ["Identity & Trust Exploitation Entry", "Transaction & Process Fraud"],
    assets: ["Third-Party Service Integrations", "Customer-Facing Web Applications", "Payment & Settlement Systems"],
    motiveObj: "Fraud, Theft & Illicit Transfer → Conduct Mass Customer-Account Fraud via Compromised Vendor",
    freq: 1.5, mag: 12.0, sF: 0.5, sM: 0.6,
    controlGaps: ["Transaction & Process Fraud: See and Evaluate phase gaps"]
  },
  {
    id: "S-19",
    name: "Multi-Party Triple Extortion Campaign",
    ttps: ["Social Engineering & Human Manipulation", "Execution, Persistence & Evasion", "Software & Service Exploitation", "Availability Attacks & Resource Abuse", "Identity & Access Abuse", "Data Collection & Exfiltration", "Network Traversal & Command Control"],
    weaknesses: ["Governance, Policy & Workforce Deficiency", "Necessary Exposed Interfaces", "Dual-Use Functionality", "Preventive Control Deficiency", "Software & Input Handling Defects", "Resource & Throughput Ceilings", "Configuration & Policy Drift", "Detection & Monitoring Deficiency", "Privilege & Entitlement Accumulation", "Unmanaged Exposure & Shadow Assets", "Implicit & Transitive Trust"],
    objectives: ["Social Engineering Entry", "Technical Exploitation Entry", "Disruption & Destruction", "Identity & Trust Exploitation Entry", "Data Exfiltration & Disclosure", "Lateral Movement & Staging", "Data Collection & Staging"],
    assets: ["Email & Collaboration Platforms", "Server Infrastructure", "Database Systems", "Backup & Recovery Systems", "Identity & Access Management Systems", "Network Infrastructure"],
    motiveObj: "Coercive (Ransom & Extortion) → Extort Payment by Extending Coercive Pressure Beyond the Institution",
    freq: 1.0, mag: 55.0, sF: 0.25, sM: 0.4,
    controlGaps: ["Data Exfiltration & Disclosure: See and Act phase gaps", "Disruption & Destruction: Achieve phase gap", "Data Collection & Staging: Evaluate phase gap"]
  },
  {
    id: "S-20",
    name: "Espionage — Regulatory & Supervisory Intelligence Theft",
    ttps: ["Social Engineering & Human Manipulation", "Execution, Persistence & Evasion", "Identity & Access Abuse", "Data Collection & Exfiltration"],
    weaknesses: ["Governance, Policy & Workforce Deficiency", "Necessary Exposed Interfaces", "Dual-Use Functionality", "Preventive Control Deficiency", "Configuration & Policy Drift", "Implicit & Transitive Trust", "Detection & Monitoring Deficiency", "Privilege & Entitlement Accumulation"],
    objectives: ["Social Engineering Entry", "Technical Exploitation Entry", "Identity & Trust Exploitation Entry", "Data Exfiltration & Disclosure", "Lateral Movement & Staging"],
    assets: ["Email & Collaboration Platforms", "Document Management Systems", "Identity & Access Management Systems"],
    motiveObj: "Information Acquisition & Use → Obtain Regulatory & Supervisory Intelligence",
    freq: 0.8, mag: 20.0, sF: 0.35, sM: 0.55,
    controlGaps: ["Data Exfiltration & Disclosure: See phase gap"]
  },
  {
    id: "S-21",
    name: "AI/ML Decision System Subversion for Fraud",
    ttps: ["Software & Service Exploitation", "AI/ML System Exploitation", "Identity & Access Abuse"],
    weaknesses: ["Necessary Exposed Interfaces", "Software & Input Handling Defects", "Inherent Design Constraints", "Assurance & Validation Deficiency", "Preventive Control Deficiency", "Privilege & Entitlement Accumulation"],
    objectives: ["Technical Exploitation Entry", "Information Integrity Attacks", "Lateral Movement & Staging"],
    assets: ["AI/ML Model Infrastructure", "Data Pipelines", "Core Banking Systems", "Identity & Access Management Systems"],
    motiveObj: "Fraud, Theft & Illicit Transfer → Manipulate AI/ML Decision Systems",
    freq: 0.5, mag: 15.0, sF: 0.55, sM: 0.65,
    controlGaps: ["Information Integrity Attacks: See, Evaluate, and Act phase gaps"]
  },
  {
    id: "S-22",
    name: "Insider Sabotage — Privileged Employee Retribution",
    ttps: ["Disruption, Destruction & Integrity Attacks", "Security Infrastructure Subversion", "Identity & Access Abuse", "Network Traversal & Command Control"],
    weaknesses: ["Architectural Fragility & Recovery Constraints", "Assurance & Validation Deficiency", "Detection & Monitoring Deficiency", "Dual-Use Functionality", "Preventive Control Deficiency", "Privilege & Entitlement Accumulation", "Configuration & Policy Drift", "Implicit & Transitive Trust"],
    objectives: ["Disruption & Destruction", "Persistence, Evasion & Enablement", "Lateral Movement & Staging"],
    assets: ["Server Infrastructure", "Database Systems", "Backup & Recovery Systems", "Network Infrastructure", "Security Infrastructure"],
    motiveObj: "Retribution & Sabotage → Damage Operations, Data Integrity, or Reputation",
    freq: 0.7, mag: 25.0, sF: 0.45, sM: 0.5,
    controlGaps: ["Disruption & Destruction: See and Evaluate phase gaps", "Persistence, Evasion & Enablement: Act phase gap"]
  },
];

// Custom theme definitions
export const CUSTOM_THEMES = {
  "Phishing & Social Engineering": s => s.ttps.some(t => t.includes("Social Engineering")),
  "Third Party / Supply Chain": s => s.ttps.some(t => t.includes("Supply Chain")) || s.weaknesses.some(w => w.includes("Transitive Trust")),
  "Ransomware & Extortion": s => s.name.toLowerCase().includes("ransomware") || s.name.includes("Extortion"),
  "Insider Threat": s => s.name.includes("Insider") || s.weaknesses.some(w => w.includes("Privilege & Entitlement")),
  "AI / ML Risk": s => s.ttps.some(t => t.includes("AI/ML")),
  "Critical Data Exposure": s => s.ttps.some(t => t.includes("Data Collection") || t.includes("Exfiltration")),
  "Quantum Exposure": s => s.weaknesses.some(w => w.includes("Cryptographic")),
  "Payment & Transaction Fraud": s => s.objectives.some(o => o.includes("Transaction")),
  "Nation-State / Conflict Preparation": s => s.motiveObj.includes("Conflict"),
  "Identity & Credential Exploitation": s => s.ttps.some(t => t.includes("Identity & Access")),
};

// Vocabulary dimension definitions for native themes
export const DIMENSIONS = {
  controls: { label: "Control Objectives", extract: s => s.objectives },
  motiveObj: { label: "Motive–Objectives", extract: s => [s.motiveObj] },
  ttps: { label: "TTP Classes", extract: s => s.ttps },
  weaknesses: { label: "Weakness Classes", extract: s => s.weaknesses },
  assets: { label: "Asset Classes", extract: s => s.assets },
  custom: { label: "Custom Themes", extract: null },
};

// Sort options
export const SORT_OPTIONS = [
  { key: "rALE", label: "Residual ALE", fmt: v => "$" + v.toFixed(1) + "M" },
  { key: "iALE", label: "Inherent ALE", fmt: v => "$" + v.toFixed(1) + "M" },
  { key: "freq", label: "Inherent Frequency", fmt: v => v.toFixed(2) + " /3yr" },
  { key: "rF", label: "Residual Frequency", fmt: v => v.toFixed(2) + " /3yr" },
  { key: "mag", label: "Loss Magnitude", fmt: v => "$" + v.toFixed(1) + "M" },
  { key: "cLev", label: "Control Leverage", fmt: v => v.toFixed(0) + "%" },
];

// Compute derived metrics
export function computeMetrics(s) {
  const rF = s.freq * s.sF;
  const rM = s.mag * s.sM;
  return {
    ...s,
    iALE: s.freq * s.mag,
    rF,
    rM,
    rALE: rF * rM,
    cLev: (1 - (rF * rM) / (s.freq * s.mag)) * 100,
  };
}

// Simulated quarter-over-quarter change
export function computeChange(s) {
  const seed = s.id.charCodeAt(2) * 7 + (s.id.length > 3 ? s.id.charCodeAt(3) * 3 : 0);
  const delta = ((seed % 40) - 18) / 100;
  const m = computeMetrics(s);
  return {
    rALE: m.rALE * delta,
    iALE: m.iALE * delta,
    freq: m.freq * delta,
    rF: m.rF * delta,
    mag: m.mag * delta,
    cLev: m.cLev * delta * 0.3,
  };
}

// Pre-computed enriched data
export const DATA = SCENARIOS.map(s => ({
  ...computeMetrics(s),
  chg: computeChange(s),
}));

// Build dimension ranking data
export function buildDimensionData(dimKey, sortKey, showChg, activeCustomThemes) {
  if (dimKey === "custom") {
    return Object.entries(CUSTOM_THEMES)
      .filter(([name]) => activeCustomThemes.includes(name))
      .map(([name, filterFn]) => {
        const matched = DATA.filter(filterFn);
        const val = matched.reduce((a, s) => a + (showChg ? s.chg[sortKey] : s[sortKey]), 0);
        return { name, val, count: matched.length, scenarios: matched };
      })
      .sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
  }
  const dim = DIMENSIONS[dimKey];
  const map = {};
  DATA.forEach(s => {
    dim.extract(s).forEach(e => {
      if (!map[e]) map[e] = { scenarioIds: new Set(), scenarios: [], val: 0 };
      if (!map[e].scenarioIds.has(s.id)) {
        map[e].scenarioIds.add(s.id);
        map[e].scenarios.push(s);
      }
      map[e].val += showChg ? s.chg[sortKey] : s[sortKey];
    });
  });
  return Object.entries(map)
    .map(([name, d]) => ({ name, val: d.val, count: d.scenarios.length, scenarios: d.scenarios }))
    .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
    .slice(0, 10);
}

// Get scenarios for a theme
export function getThemeScenarios(themeName) {
  const customFn = CUSTOM_THEMES[themeName];
  if (customFn) return DATA.filter(customFn);
  // Check native dimensions
  for (const dim of Object.values(DIMENSIONS)) {
    if (!dim.extract) continue;
    const matched = DATA.filter(s => dim.extract(s).includes(themeName));
    if (matched.length > 0) return matched;
  }
  return [];
}
