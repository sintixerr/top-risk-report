// ═══════════════════════════════════════════════════════════════════════════
// Control Model — Full Analytical Stack for Top Risk Theme Report
// ═══════════════════════════════════════════════════════════════════════════
//
// Representative mappings for demonstration — not production quality.
// Built session 2026-03-20 from CIS Controls v8.1 mapped to v3 algebra
// control objectives with S/E/A/Ach attribution and requirements grid
// positioning.
//
// The propagation chain:
//   User adjusts safeguard effectiveness →
//   Cycle closure recomputes per objective →
//   Position effectiveness changes →
//   Scenario susceptibility (sF, sM) recomputes →
//   Theme-level ALE changes
//
// ═══════════════════════════════════════════════════════════════════════════

// ─── GRID CONSTANTS ───

export const GRID_ROWS = ["Direct", "Instrument", "Govern"];
export const GRID_COLS = ["Conditions", "TTPs", "Result"];
export const PHASES = ["see", "evaluate", "act", "achieve"];
export const STAGES = ["Initial Access", "Transit", "Payoff"];

// Grid column → Control position mapping
// Conditions (C1) = Position 1: condition prevention/removal — broad, durable, defender's tempo
// TTPs (C2) = Position 2: method blocking — narrow, perishable, attacker's tempo
// Result (C3) = Position 3: state change management — reactive, consequence compression
export const POSITION_MAP = { "Conditions": 1, "TTPs": 2, "Result": 3 };

// Position → risk dimension: which risk quantity does this position primarily reduce?
// Positions 1 & 2 reduce frequency (prevent events). Position 3 reduces magnitude (limit consequences).
export const POSITION_RISK_DIM = { 1: "frequency", 2: "frequency", 3: "magnitude" };


// ═══════════════════════════════════════════════════════════════════════════
// I. CONTROL OBJECTIVES
// ═══════════════════════════════════════════════════════════════════════════
//
// The 10 control objectives from the v2 database. Each is a mechanic's
// conjunction seen from the defensive side — TTP class + weakness surface
// + asset scope = what the defender must stop.
//
// These already appear in data.js on each scenario's `objectives` array.
// This structure adds the 3-legged conjunction description, stage mapping,
// and defensive context.

export const OBJECTIVES = [
  {
    id: "OBJ-01",
    name: "Technical Exploitation Entry",
    stage: "Initial Access",
    conjunction: {
      ttpLeg: "Software & Service Exploitation",
      weaknessLeg: "Software defects, exposed interfaces, unmanaged assets",
      assetLeg: "Internet-facing systems, web applications, server infrastructure",
    },
    description: "Prevent attackers from gaining initial access by exploiting technical vulnerabilities in internet-facing systems and applications.",
    accomplish: "See vulnerability landscape across exposed systems; Evaluate exploitability and exposure severity; Act to patch, harden, or remove vulnerable services; Achieve verified remediation of exploitable conditions on all internet-facing assets.",
  },
  {
    id: "OBJ-02",
    name: "Social Engineering Entry",
    stage: "Initial Access",
    conjunction: {
      ttpLeg: "Social Engineering & Human Manipulation",
      weaknessLeg: "Workforce susceptibility, necessarily exposed communication interfaces",
      assetLeg: "Email platforms, collaboration tools, human operators",
    },
    description: "Prevent attackers from gaining initial access by manipulating people through phishing, pretexting, or other social engineering techniques.",
    accomplish: "See inbound social engineering attempts across communication channels; Evaluate whether communications are malicious or legitimate; Act to block malicious content and alert targeted personnel; Achieve a workforce that resists manipulation and communication channels that filter threats.",
  },
  {
    id: "OBJ-03",
    name: "Identity & Trust Exploitation Entry",
    stage: "Initial Access",
    conjunction: {
      ttpLeg: "Identity & Access Abuse",
      weaknessLeg: "Credential exposure, privilege accumulation, configuration drift in identity systems",
      assetLeg: "Identity & access management systems, authentication infrastructure",
    },
    description: "Prevent attackers from gaining initial access by abusing stolen, weak, or over-privileged credentials and trust relationships.",
    accomplish: "See credential exposure and identity anomalies; Evaluate whether access attempts represent legitimate use or abuse; Act to block unauthorized access and revoke compromised credentials; Achieve identity infrastructure where stolen credentials alone are insufficient for access.",
  },
  {
    id: "OBJ-04",
    name: "Lateral Movement & Staging",
    stage: "Transit",
    conjunction: {
      ttpLeg: "Network Traversal & Command Control, Identity & Access Abuse",
      weaknessLeg: "Implicit transitive trust, privilege accumulation, flat network architecture",
      assetLeg: "Network infrastructure, identity systems, internal servers",
    },
    description: "Prevent attackers who have gained initial access from moving laterally across the environment to reach high-value targets.",
    accomplish: "See internal traversal patterns and privilege usage anomalies; Evaluate whether internal movement represents normal operations or attacker activity; Act to isolate compromised segments and terminate unauthorized sessions; Achieve network architecture where lateral movement requires re-authentication at each boundary.",
  },
  {
    id: "OBJ-05",
    name: "Persistence, Evasion & Enablement",
    stage: "Transit",
    conjunction: {
      ttpLeg: "Execution, Persistence & Evasion",
      weaknessLeg: "Detection gaps, dual-use functionality, insufficient integrity monitoring",
      assetLeg: "Endpoint devices, security infrastructure, server infrastructure",
    },
    description: "Prevent attackers from establishing persistent footholds, evading detection, and building operational capability within the environment.",
    accomplish: "See unauthorized persistence mechanisms and integrity changes; Evaluate whether system modifications represent legitimate operations or attacker implants; Act to remove persistence mechanisms and restore system integrity; Achieve an environment where unauthorized persistence is detected and eliminated faster than it can be re-established.",
  },
  {
    id: "OBJ-06",
    name: "Disruption & Destruction",
    stage: "Payoff",
    conjunction: {
      ttpLeg: "Disruption, Destruction & Integrity Attacks, Availability Attacks",
      weaknessLeg: "Architectural fragility, recovery constraints, insufficient resilience",
      assetLeg: "Server infrastructure, backup & recovery systems, core business systems",
    },
    description: "Prevent attackers from disrupting, destroying, or encrypting systems and data, and minimize impact when disruption occurs.",
    accomplish: "See destructive activity patterns (mass encryption, deletion, integrity attacks); Evaluate scope and velocity of destructive actions; Act to contain destruction and isolate affected systems; Achieve rapid recovery from verified-clean backups with minimized operational downtime.",
  },
  {
    id: "OBJ-07",
    name: "Data Collection & Staging",
    stage: "Transit",
    conjunction: {
      ttpLeg: "Data Collection & Exfiltration (collection phase)",
      weaknessLeg: "Excessive data access privileges, insufficient data activity monitoring",
      assetLeg: "Database systems, file storage, document management systems",
    },
    description: "Prevent attackers from identifying, collecting, and staging sensitive data for exfiltration or disclosure.",
    accomplish: "See anomalous data access patterns and bulk data movement; Evaluate whether data collection represents legitimate business use or attacker staging; Act to terminate unauthorized data access and quarantine staged collections; Achieve data environments where bulk unauthorized access is detectable and interruptible.",
  },
  {
    id: "OBJ-08",
    name: "Data Exfiltration & Disclosure",
    stage: "Payoff",
    conjunction: {
      ttpLeg: "Data Collection & Exfiltration (exfiltration phase)",
      weaknessLeg: "Insufficient outbound monitoring, lack of data loss prevention, encrypted channel abuse",
      assetLeg: "Network egress points, database systems, cloud storage",
    },
    description: "Prevent attackers from exfiltrating collected data to external locations or disclosing it publicly.",
    accomplish: "See outbound data transfers and anomalous egress patterns; Evaluate whether outbound data movement represents legitimate transfers or exfiltration; Act to block unauthorized data transfer and contain disclosure; Achieve egress controls where bulk data exfiltration is prevented or detected within operational windows.",
  },
  {
    id: "OBJ-09",
    name: "Transaction & Process Fraud",
    stage: "Payoff",
    conjunction: {
      ttpLeg: "Business Process & Transaction Manipulation",
      weaknessLeg: "Insufficient transaction validation, process design weaknesses, authorization gaps",
      assetLeg: "Payment & settlement systems, core banking, trading systems",
    },
    description: "Prevent attackers from manipulating business processes and financial transactions to steal value or disrupt operations.",
    accomplish: "See transaction anomalies and process deviations; Evaluate whether unusual transactions represent errors, legitimate exceptions, or fraud; Act to halt fraudulent transactions and freeze compromised processes; Achieve transaction environments with multi-party validation and real-time anomaly detection.",
  },
  {
    id: "OBJ-10",
    name: "Information Integrity Attacks",
    stage: "Payoff",
    conjunction: {
      ttpLeg: "Disruption, Destruction & Integrity Attacks, Business Process Manipulation",
      weaknessLeg: "Insufficient content validation, weak integrity controls, inadequate change management",
      assetLeg: "Content management systems, web applications, social media presence, trading data",
    },
    description: "Prevent attackers from manipulating information, defacing public-facing content, or corrupting data to undermine trust and market integrity.",
    accomplish: "See unauthorized content modifications and data integrity violations; Evaluate whether changes represent legitimate updates or attacker manipulation; Act to revert unauthorized changes and restore data integrity; Achieve content and data environments with cryptographic integrity verification and change audit trails.",
  },
];


// ═══════════════════════════════════════════════════════════════════════════
// II. CIS v8.1 SAFEGUARD MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════
//
// 3 CIS safeguards per objective = 30 total mappings.
// Each safeguard is mapped to:
//   - S/E/A/Ach phases it serves (which cycle phases does this safeguard close?)
//   - Grid position (row × column → who acts, on what conjunction leg)
//   - Default effectiveness (0–100, user-adjustable in the demo)
//
// Deliberate cycle gaps are included — some objectives have See + Evaluate
// but no Act, which is exactly the kind of finding the system should surface.
//
// "effectiveness" represents: given that this safeguard exists, how well
// does the organization implement it? 0 = not implemented, 100 = fully
// effective. This is the primary user-adjustable input in the demo.

export const CIS_MAPPINGS = [

  // ─── OBJ-01: Technical Exploitation Entry ───
  {
    id: "CIS-7.4",
    cisControl: 7,
    cisControlName: "Continuous Vulnerability Management",
    safeguard: "Perform Automated Application Patching",
    objectiveId: "OBJ-01",
    phases: { see: true, evaluate: false, act: true, achieve: true },
    gridRow: "Direct",
    gridCol: "Conditions",
    effectiveness: 65,
    rationale: "Automated patching removes the software defect conditions that exploitation techniques depend on. Closes the cycle at Position 1: the system sees missing patches, acts to deploy them, and verifies installation. Evaluate gap: patching is often applied without risk-based prioritization.",
  },
  {
    id: "CIS-13.3",
    cisControl: 13,
    cisControlName: "Network Monitoring and Defense",
    safeguard: "Deploy Network Intrusion Detection Solutions",
    objectiveId: "OBJ-01",
    phases: { see: true, evaluate: true, act: false, achieve: false },
    gridRow: "Instrument",
    gridCol: "TTPs",
    effectiveness: 72,
    rationale: "Network IDS detects exploitation attempts in transit. Strong See and Evaluate, but this safeguard alone cannot Act to block — it depends on integration with a blocking control (firewall, IPS) to close the cycle. Classic monitoring-without-response gap.",
  },
  {
    id: "CIS-16.11",
    cisControl: 16,
    cisControlName: "Application Software Security",
    safeguard: "Use Standard Hardening Configuration Templates for Databases",
    objectiveId: "OBJ-01",
    phases: { see: false, evaluate: false, act: true, achieve: true },
    gridRow: "Govern",
    gridCol: "Conditions",
    effectiveness: 52,
    rationale: "Configuration hardening prevents exploitable conditions from forming on application infrastructure. Strong Act and Achieve (when the standard is followed), but no independent See or Evaluate — gaps are only found by other controls' scans.",
  },

  // ─── OBJ-02: Social Engineering Entry ───
  {
    id: "CIS-14.1",
    cisControl: 14,
    cisControlName: "Security Awareness and Skills Training",
    safeguard: "Establish and Maintain a Security Awareness Program",
    objectiveId: "OBJ-02",
    phases: { see: true, evaluate: true, act: false, achieve: false },
    gridRow: "Govern",
    gridCol: "Conditions",
    effectiveness: 50,
    rationale: "Awareness training helps the workforce See social engineering attempts and Evaluate their legitimacy. But training alone doesn't Act to block attacks — it depends on individual judgment in the moment. Cycle gap: no structural Act or Achieve.",
  },
  {
    id: "CIS-9.2",
    cisControl: 9,
    cisControlName: "Email and Web Browser Protections",
    safeguard: "Use DNS Filtering Services",
    objectiveId: "OBJ-02",
    phases: { see: false, evaluate: false, act: true, achieve: true },
    gridRow: "Direct",
    gridCol: "TTPs",
    effectiveness: 68,
    rationale: "DNS filtering blocks connections to known malicious domains used in phishing campaigns. Strong Act (blocks the connection) and Achieve (verified block), but no independent See or Evaluate — it blocks based on reputation lists, not real-time analysis.",
  },
  {
    id: "CIS-9.7",
    cisControl: 9,
    cisControlName: "Email and Web Browser Protections",
    safeguard: "Deploy and Maintain Email Server Anti-Malware Protections",
    objectiveId: "OBJ-02",
    phases: { see: true, evaluate: true, act: true, achieve: false },
    gridRow: "Direct",
    gridCol: "TTPs",
    effectiveness: 71,
    rationale: "Email security gateways See inbound messages, Evaluate them against threat indicators, and Act to quarantine malicious content. Achieve gap: limited verification that the filtered state persists (users can retrieve quarantined items, allowlists can be overly broad).",
  },

  // ─── OBJ-03: Identity & Trust Exploitation Entry ───
  {
    id: "CIS-6.4",
    cisControl: 6,
    cisControlName: "Access Control Management",
    safeguard: "Require MFA for Remote Network Access",
    objectiveId: "OBJ-03",
    phases: { see: false, evaluate: true, act: true, achieve: true },
    gridRow: "Direct",
    gridCol: "Conditions",
    effectiveness: 78,
    rationale: "MFA removes the condition where stolen credentials alone grant access. Strong Evaluate (checks second factor), Act (denies access on failure), Achieve (verified authentication state). See gap: MFA doesn't detect that credentials were stolen — it renders the theft ineffective.",
  },
  {
    id: "CIS-5.3",
    cisControl: 5,
    cisControlName: "Account Management",
    safeguard: "Disable Dormant Accounts",
    objectiveId: "OBJ-03",
    phases: { see: true, evaluate: true, act: true, achieve: false },
    gridRow: "Instrument",
    gridCol: "Conditions",
    effectiveness: 62,
    rationale: "Identifies and removes dormant accounts that attackers target (accounts less likely to trigger alerts when used). See (identify inactive accounts), Evaluate (assess dormancy against policy), Act (disable). Achieve gap: often no verification that disabled accounts stay disabled or aren't recreated.",
  },
  {
    id: "CIS-6.5",
    cisControl: 6,
    cisControlName: "Access Control Management",
    safeguard: "Require MFA for All Remote Access",
    objectiveId: "OBJ-03",
    phases: { see: false, evaluate: true, act: true, achieve: true },
    gridRow: "Direct",
    gridCol: "TTPs",
    effectiveness: 74,
    rationale: "Extends MFA beyond network access to all remote authentication — blocking credential abuse techniques even when the attacker has valid passwords. Position 2 (TTP blocking): directly prevents the identity abuse technique from succeeding.",
  },

  // ─── OBJ-04: Lateral Movement & Staging ───
  {
    id: "CIS-12.2",
    cisControl: 12,
    cisControlName: "Network Infrastructure Management",
    safeguard: "Establish and Maintain a Secure Network Architecture",
    objectiveId: "OBJ-04",
    phases: { see: false, evaluate: false, act: true, achieve: true },
    gridRow: "Direct",
    gridCol: "Conditions",
    effectiveness: 55,
    rationale: "Network segmentation removes the implicit trust condition that enables lateral movement. Position 1 Level 1 (architecture): eliminates the condition basin. Strong Act and Achieve, but See and Evaluate gaps — the architecture is set, but there's no continuous monitoring of whether segmentation is intact.",
  },
  {
    id: "CIS-13.5",
    cisControl: 13,
    cisControlName: "Network Monitoring and Defense",
    safeguard: "Manage Access Control for Remote Assets",
    objectiveId: "OBJ-04",
    phases: { see: true, evaluate: true, act: true, achieve: false },
    gridRow: "Direct",
    gridCol: "TTPs",
    effectiveness: 48,
    rationale: "Network access controls detect and block unauthorized internal traversal. See (monitor internal traffic), Evaluate (check against access policies), Act (block unauthorized connections). Achieve gap: difficulty verifying that lateral movement has been fully prevented — attackers may use legitimate protocols.",
  },
  {
    id: "CIS-8.5",
    cisControl: 8,
    cisControlName: "Audit Log Management",
    safeguard: "Collect Detailed Audit Logs",
    objectiveId: "OBJ-04",
    phases: { see: true, evaluate: false, act: false, achieve: false },
    gridRow: "Instrument",
    gridCol: "TTPs",
    effectiveness: 70,
    rationale: "Detailed audit logs provide visibility into lateral movement (authentication events, privilege usage, cross-segment access). Strong See capability, but this safeguard alone provides no Evaluate, Act, or Achieve — it depends entirely on other controls (SIEM, SOC) to close the cycle. Data without analysis.",
  },

  // ─── OBJ-05: Persistence, Evasion & Enablement ───
  {
    id: "CIS-10.1",
    cisControl: 10,
    cisControlName: "Malware Defenses",
    safeguard: "Deploy and Maintain Anti-Malware Software",
    objectiveId: "OBJ-05",
    phases: { see: true, evaluate: true, act: true, achieve: false },
    gridRow: "Direct",
    gridCol: "TTPs",
    effectiveness: 73,
    rationale: "Anti-malware detects known persistence mechanisms (See), evaluates against signature and behavior databases (Evaluate), and quarantines or removes them (Act). Achieve gap: verification that the persistence mechanism is fully eradicated — sophisticated implants may survive initial removal or reinstall from secondary locations.",
  },
  {
    id: "CIS-8.2",
    cisControl: 8,
    cisControlName: "Audit Log Management",
    safeguard: "Collect Audit Logs",
    objectiveId: "OBJ-05",
    phases: { see: true, evaluate: false, act: false, achieve: false },
    gridRow: "Instrument",
    gridCol: "Conditions",
    effectiveness: 75,
    rationale: "Audit log collection provides the raw visibility into system activity needed to detect persistence (process creation, registry changes, scheduled tasks, startup modifications). Critical See capability, but provides no Evaluate, Act, or Achieve alone — depends on SIEM/SOC integration.",
  },
  {
    id: "CIS-4.1",
    cisControl: 4,
    cisControlName: "Secure Configuration of Enterprise Assets and Software",
    safeguard: "Establish and Maintain a Secure Configuration Process",
    objectiveId: "OBJ-05",
    phases: { see: true, evaluate: true, act: true, achieve: true },
    gridRow: "Govern",
    gridCol: "Conditions",
    effectiveness: 58,
    rationale: "Secure configuration baselines prevent the conditions that persistence mechanisms exploit (writable startup locations, permissive execution policies, unmonitored auto-start paths). Full cycle at the governance level: See (audit against baselines), Evaluate (gap identification), Act (remediate drift), Achieve (verified baseline compliance).",
  },

  // ─── OBJ-06: Disruption & Destruction ───
  {
    id: "CIS-11.1",
    cisControl: 11,
    cisControlName: "Data Recovery",
    safeguard: "Establish and Maintain a Data Recovery Process",
    objectiveId: "OBJ-06",
    phases: { see: false, evaluate: false, act: true, achieve: true },
    gridRow: "Direct",
    gridCol: "Result",
    effectiveness: 68,
    rationale: "Data recovery is the core Position 3 (state change management) control for disruption scenarios. When destruction occurs, Act to restore from backups and Achieve operational recovery. No See or Evaluate — this control activates after the disruption, not before. Reduces magnitude by compressing recovery duration.",
  },
  {
    id: "CIS-11.4",
    cisControl: 11,
    cisControlName: "Data Recovery",
    safeguard: "Establish and Maintain an Isolated Instance of Recovery Data",
    objectiveId: "OBJ-06",
    phases: { see: false, evaluate: false, act: true, achieve: true },
    gridRow: "Direct",
    gridCol: "Conditions",
    effectiveness: 55,
    rationale: "Isolated (air-gapped or immutable) backups remove the condition where attackers can destroy recovery capability along with primary data. Position 1 Level 1 (architecture): changes the structural property so the 'backup destruction' conjunction can't form. Reduces frequency of successful destruction by making recovery always available.",
  },
  {
    id: "CIS-13.1",
    cisControl: 13,
    cisControlName: "Network Monitoring and Defense",
    safeguard: "Centralize Security Event Alerting",
    objectiveId: "OBJ-06",
    phases: { see: true, evaluate: true, act: false, achieve: false },
    gridRow: "Instrument",
    gridCol: "TTPs",
    effectiveness: 63,
    rationale: "Centralized alerting detects destructive activity patterns (mass file modification, encryption behavior, deletion events). See and Evaluate are strong — but without connected Act capability, the system alerts without containing. The classic SIEM-without-SOAR gap.",
  },

  // ─── OBJ-07: Data Collection & Staging ───
  {
    id: "CIS-3.12",
    cisControl: 3,
    cisControlName: "Data Protection",
    safeguard: "Segment Data Processing and Storage Based on Sensitivity",
    objectiveId: "OBJ-07",
    phases: { see: false, evaluate: false, act: true, achieve: true },
    gridRow: "Direct",
    gridCol: "Conditions",
    effectiveness: 45,
    rationale: "Data segmentation removes the condition where a single compromised account can access sensitive data across the enterprise. Position 1 (architecture): reduces the blast radius of any single compromise. Low effectiveness score reflects that many organizations have incomplete data classification.",
  },
  {
    id: "CIS-8.11",
    cisControl: 8,
    cisControlName: "Audit Log Management",
    safeguard: "Conduct Audit Log Reviews",
    objectiveId: "OBJ-07",
    phases: { see: true, evaluate: true, act: false, achieve: false },
    gridRow: "Instrument",
    gridCol: "TTPs",
    effectiveness: 52,
    rationale: "Log reviews can detect anomalous data access patterns — bulk queries, after-hours access, unusual data movement. See + Evaluate, but no Act: the review identifies the problem, but a separate response process is needed to intervene. Cycle gap means detection doesn't prevent staging.",
  },
  {
    id: "CIS-6.1",
    cisControl: 6,
    cisControlName: "Access Control Management",
    safeguard: "Establish an Access Granting Process",
    objectiveId: "OBJ-07",
    phases: { see: true, evaluate: true, act: true, achieve: false },
    gridRow: "Govern",
    gridCol: "Conditions",
    effectiveness: 58,
    rationale: "Formal access granting prevents excessive data access privileges from accumulating — the condition that enables attackers to collect data broadly. See (review access grants), Evaluate (check against least-privilege), Act (restrict). Achieve gap: often no verification that granted access remains appropriate over time.",
  },

  // ─── OBJ-08: Data Exfiltration & Disclosure ───
  {
    id: "CIS-13.8",
    cisControl: 13,
    cisControlName: "Network Monitoring and Defense",
    safeguard: "Deploy a Data Loss Prevention Solution",
    objectiveId: "OBJ-08",
    phases: { see: true, evaluate: true, act: true, achieve: false },
    gridRow: "Direct",
    gridCol: "TTPs",
    effectiveness: 45,
    rationale: "DLP detects (See) and classifies (Evaluate) sensitive data in transit, and can block (Act) unauthorized transfers. Achieve gap: DLP has high false-positive rates and is frequently bypassed via encrypted channels or chunked transfers. Low effectiveness reflects operational reality for most deployments.",
  },
  {
    id: "CIS-3.10",
    cisControl: 3,
    cisControlName: "Data Protection",
    safeguard: "Encrypt Sensitive Data in Transit",
    objectiveId: "OBJ-08",
    phases: { see: false, evaluate: false, act: true, achieve: true },
    gridRow: "Direct",
    gridCol: "Result",
    effectiveness: 72,
    rationale: "Transit encryption is Position 3 (state change management): if data IS exfiltrated, encryption reduces the magnitude by limiting what's usable. This doesn't prevent exfiltration — it limits the consequence. Reduces magnitude, not frequency.",
  },
  {
    id: "CIS-12.7",
    cisControl: 12,
    cisControlName: "Network Infrastructure Management",
    safeguard: "Ensure Authorized Remote Devices Use Enterprise VPN and Firewalls",
    objectiveId: "OBJ-08",
    phases: { see: true, evaluate: false, act: true, achieve: false },
    gridRow: "Direct",
    gridCol: "Conditions",
    effectiveness: 64,
    rationale: "Requiring VPN for remote access routes all traffic through enterprise controls, removing the condition where data can leave via unmonitored paths. See (visibility into all remote traffic) and Act (enforce VPN policy), but Evaluate and Achieve gaps.",
  },

  // ─── OBJ-09: Transaction & Process Fraud ───
  {
    id: "CIS-6.8",
    cisControl: 6,
    cisControlName: "Access Control Management",
    safeguard: "Define and Maintain Role-Based Access Control",
    objectiveId: "OBJ-09",
    phases: { see: true, evaluate: true, act: true, achieve: false },
    gridRow: "Direct",
    gridCol: "Conditions",
    effectiveness: 62,
    rationale: "RBAC prevents the condition where a single compromised account can initiate, approve, and execute transactions. Enforces separation of duties. See (audit role assignments), Evaluate (check against least-privilege), Act (revoke excessive roles). Achieve gap: role creep over time often undermines the initial design.",
  },
  {
    id: "CIS-8.12",
    cisControl: 8,
    cisControlName: "Audit Log Management",
    safeguard: "Collect Service Provider Logs",
    objectiveId: "OBJ-09",
    phases: { see: true, evaluate: false, act: false, achieve: false },
    gridRow: "Instrument",
    gridCol: "TTPs",
    effectiveness: 48,
    rationale: "Service provider logs capture transaction activity across payment and settlement systems. Critical See capability for detecting fraudulent transactions, but no Evaluate, Act, or Achieve — entirely dependent on downstream analysis and response processes.",
  },
  {
    id: "CIS-5.4",
    cisControl: 5,
    cisControlName: "Account Management",
    safeguard: "Restrict Administrator Privileges to Dedicated Administrator Accounts",
    objectiveId: "OBJ-09",
    phases: { see: false, evaluate: false, act: true, achieve: true },
    gridRow: "Direct",
    gridCol: "Conditions",
    effectiveness: 66,
    rationale: "Separating admin and user accounts removes the condition where daily-use credentials carry transaction-system privileges. Position 1: condition removal. Act (enforce the separation), Achieve (verified that admin accounts are used only for administrative tasks).",
  },

  // ─── OBJ-10: Information Integrity Attacks ───
  {
    id: "CIS-16.1",
    cisControl: 16,
    cisControlName: "Application Software Security",
    safeguard: "Establish and Maintain a Secure Application Development Process",
    objectiveId: "OBJ-10",
    phases: { see: true, evaluate: true, act: false, achieve: false },
    gridRow: "Govern",
    gridCol: "Conditions",
    effectiveness: 50,
    rationale: "Secure development practices prevent integrity vulnerabilities from being introduced. See (code review, security testing) and Evaluate (assess against secure coding standards). Act and Achieve gaps: the development process identifies issues but remediation depends on development team prioritization and release cycles.",
  },
  {
    id: "CIS-3.14",
    cisControl: 3,
    cisControlName: "Data Protection",
    safeguard: "Log Sensitive Data Access",
    objectiveId: "OBJ-10",
    phases: { see: true, evaluate: false, act: false, achieve: false },
    gridRow: "Instrument",
    gridCol: "TTPs",
    effectiveness: 42,
    rationale: "Logging data access and modifications provides audit trail for detecting unauthorized content changes. See-only: provides visibility but no evaluation, response, or verification. The weakest cycle coverage of any mapped safeguard — included deliberately to demonstrate what data-without-analysis looks like.",
  },
  {
    id: "CIS-18.1",
    cisControl: 18,
    cisControlName: "Penetration Testing",
    safeguard: "Establish and Maintain a Penetration Testing Program",
    objectiveId: "OBJ-10",
    phases: { see: true, evaluate: true, act: false, achieve: false },
    gridRow: "Instrument",
    gridCol: "Conditions",
    effectiveness: 55,
    rationale: "Penetration testing proactively identifies integrity vulnerabilities before attackers find them. Strong See and Evaluate (expert assessment of real exploitability), but Act and Achieve are external to this safeguard — findings must be remediated by other processes.",
  },
];


// ═══════════════════════════════════════════════════════════════════════════
// III. VOCABULARY HIERARCHY (Priority 2 — Class-Level Matching)
// ═══════════════════════════════════════════════════════════════════════════
//
// Enables "near enough" matching: if a user is looking for "MySQL Database"
// they won't find it in the scenarios, but they can find "Database Systems"
// (the class level) which covers it.

export const ASSET_HIERARCHY = {
  "Data & Information Assets": {
    classes: ["Database Systems", "File Storage Systems", "Client Data Repositories", "Document Management Systems", "Data Pipelines"],
    examples: {
      "Database Systems": ["MySQL", "Oracle", "PostgreSQL", "SQL Server", "MongoDB"],
      "File Storage Systems": ["SharePoint", "Network File Shares", "Cloud Storage (S3, Azure Blob)"],
      "Client Data Repositories": ["CRM Databases", "Customer Data Platforms", "KYC Systems"],
      "Document Management Systems": ["SharePoint DMS", "OpenText", "Box", "Google Workspace"],
      "Data Pipelines": ["ETL Systems", "Kafka Streams", "Data Warehouses"],
    },
  },
  "Operational Infrastructure": {
    classes: ["Server Infrastructure", "Network Infrastructure", "Endpoint Devices", "Backup & Recovery Systems", "Security Infrastructure"],
    examples: {
      "Server Infrastructure": ["Windows Servers", "Linux Servers", "VMware ESXi", "Container Hosts"],
      "Network Infrastructure": ["Firewalls", "Routers", "Switches", "Load Balancers", "DNS Servers"],
      "Endpoint Devices": ["Workstations", "Laptops", "Mobile Devices", "Thin Clients"],
      "Backup & Recovery Systems": ["Backup Servers", "Tape Libraries", "Cloud Backup", "DR Sites"],
      "Security Infrastructure": ["SIEM", "IDS/IPS", "EDR", "PKI", "HSM"],
    },
  },
  "Identity & Access": {
    classes: ["Identity & Access Management Systems", "Email & Collaboration Platforms"],
    examples: {
      "Identity & Access Management Systems": ["Active Directory", "Azure AD", "Okta", "CyberArk"],
      "Email & Collaboration Platforms": ["Exchange Online", "Gmail", "Slack", "Teams"],
    },
  },
  "Business Applications": {
    classes: ["Core Banking Systems", "Payment & Settlement Systems", "Trading Systems", "Customer-Facing Web Applications", "Content Management Systems", "Social Media Presence", "AI/ML Model Infrastructure", "Third-Party Service Integrations"],
    examples: {
      "Core Banking Systems": ["Temenos T24", "FIS Profile", "Jack Henry"],
      "Payment & Settlement Systems": ["SWIFT", "FedWire", "ACH Processing", "Card Processing"],
      "Trading Systems": ["Bloomberg Terminal", "FIX Engine", "Order Management System"],
      "Customer-Facing Web Applications": ["Online Banking Portal", "Mobile Banking App", "Client Portal"],
      "Content Management Systems": ["WordPress", "Drupal", "Adobe AEM"],
      "AI/ML Model Infrastructure": ["MLflow", "SageMaker", "Custom ML Pipelines"],
      "Third-Party Service Integrations": ["API Gateways", "Vendor Feeds", "Cloud SaaS Connectors"],
    },
  },
};

// TTP hierarchy for class matching
export const TTP_HIERARCHY = {
  "Exploitation & Abuse": {
    classes: ["Software & Service Exploitation", "AI/ML System Exploitation"],
    examples: {
      "Software & Service Exploitation": ["SQL Injection", "Remote Code Execution", "Buffer Overflow"],
      "AI/ML System Exploitation": ["Adversarial Input", "Model Poisoning", "Prompt Injection"],
    },
  },
  "Identity & Movement": {
    classes: ["Identity & Access Abuse", "Network Traversal & Command Control"],
    examples: {
      "Identity & Access Abuse": ["Credential Stuffing", "Pass-the-Hash", "Kerberoasting"],
      "Network Traversal & Command Control": ["Lateral Movement", "C2 Beaconing", "DNS Tunneling"],
    },
  },
  "Stealth & Persistence": {
    classes: ["Execution, Persistence & Evasion", "Security Infrastructure Subversion"],
    examples: {
      "Execution, Persistence & Evasion": ["Scheduled Tasks", "Registry Run Keys", "DLL Sideloading"],
      "Security Infrastructure Subversion": ["Log Tampering", "EDR Bypass", "Firewall Rule Manipulation"],
    },
  },
  "Data Operations": {
    classes: ["Data Collection & Exfiltration", "Social Engineering & Human Manipulation"],
    examples: {
      "Data Collection & Exfiltration": ["Bulk Data Download", "Archive Staging", "Cloud Sync Abuse"],
      "Social Engineering & Human Manipulation": ["Spear Phishing", "Pretexting", "Watering Hole"],
    },
  },
  "Impact & Disruption": {
    classes: ["Disruption, Destruction & Integrity Attacks", "Availability Attacks & Resource Abuse", "Business Process & Transaction Manipulation", "Supply Chain & Trust Exploitation"],
    examples: {
      "Disruption, Destruction & Integrity Attacks": ["Ransomware Encryption", "Wiper Malware", "Data Manipulation"],
      "Availability Attacks & Resource Abuse": ["DDoS", "Resource Exhaustion", "Cryptomining"],
      "Business Process & Transaction Manipulation": ["Wire Fraud", "Invoice Manipulation", "Trading Manipulation"],
      "Supply Chain & Trust Exploitation": ["Vendor Compromise", "Software Supply Chain", "Update Hijacking"],
    },
  },
};


// ═══════════════════════════════════════════════════════════════════════════
// IV. COMPUTATION FUNCTIONS — The Propagation Chain
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all CIS mappings for a given objective, with optional effectiveness overrides.
 * @param {string} objectiveId - e.g., "OBJ-01"
 * @param {Object} overrides - { "CIS-7.4": 80, ... } user-adjusted effectiveness values
 * @returns {Array} CIS mappings with applied effectiveness
 */
export function getMappingsForObjective(objectiveId, overrides = {}) {
  return CIS_MAPPINGS
    .filter(m => m.objectiveId === objectiveId)
    .map(m => ({
      ...m,
      effectiveness: overrides[m.id] !== undefined ? overrides[m.id] : m.effectiveness,
    }));
}

/**
 * Compute S/E/A/Ach cycle status for an objective.
 * Returns per-phase coverage, depth, gap analysis, and overall closure status.
 */
export function computeCycleStatus(objectiveId, overrides = {}) {
  const mappings = getMappingsForObjective(objectiveId, overrides);

  // Per-phase analysis
  const phaseAnalysis = {};
  for (const phase of PHASES) {
    const contributing = mappings.filter(m => m.phases[phase] && m.effectiveness > 0);
    const avgEff = contributing.length > 0
      ? contributing.reduce((sum, m) => sum + m.effectiveness, 0) / contributing.length
      : 0;
    phaseAnalysis[phase] = {
      covered: contributing.length > 0,
      depth: contributing.length,
      avgEffectiveness: Math.round(avgEff),
      contributors: contributing.map(m => m.id),
    };
  }

  // Cycle closure: all 4 phases must be covered
  const coveredPhases = PHASES.filter(p => phaseAnalysis[p].covered);
  const missingPhases = PHASES.filter(p => !phaseAnalysis[p].covered);
  const cycleClosed = missingPhases.length === 0;

  // Critical gap: Act or Achieve missing means the cycle can't close
  // Even if See and Evaluate work, without Act the system monitors but can't respond
  const hasCriticalGap = !phaseAnalysis.act.covered || !phaseAnalysis.achieve.covered;

  // Overall effectiveness: average across covered phases, penalized for gaps
  const avgCoveredEff = coveredPhases.length > 0
    ? coveredPhases.reduce((sum, p) => sum + phaseAnalysis[p].avgEffectiveness, 0) / coveredPhases.length
    : 0;

  // Gap penalty: cycle gaps dramatically reduce effectiveness
  // - Full cycle closed: no penalty
  // - Missing Act or Achieve (critical gap): 70% penalty — you detect but can't respond
  // - Missing See or Evaluate: 40% penalty — you act but may act blindly
  // - Multiple gaps: compounding
  let gapMultiplier = 1.0;
  if (!phaseAnalysis.act.covered) gapMultiplier *= 0.3;
  if (!phaseAnalysis.achieve.covered) gapMultiplier *= 0.5;
  if (!phaseAnalysis.see.covered) gapMultiplier *= 0.6;
  if (!phaseAnalysis.evaluate.covered) gapMultiplier *= 0.7;

  const effectiveScore = Math.round(avgCoveredEff * gapMultiplier);

  return {
    objectiveId,
    phaseAnalysis,
    coveredPhases,
    missingPhases,
    cycleClosed,
    hasCriticalGap,
    avgCoveredEff: Math.round(avgCoveredEff),
    gapMultiplier: Math.round(gapMultiplier * 100) / 100,
    effectiveScore,
    mappingCount: mappings.length,
  };
}

/**
 * Compute per-position effectiveness for an objective.
 * Returns effectiveness at each control position (C1, C2, C3).
 */
export function computePositionEffectiveness(objectiveId, overrides = {}) {
  const mappings = getMappingsForObjective(objectiveId, overrides);

  const positions = {};
  for (const col of GRID_COLS) {
    const positionMappings = mappings.filter(m => m.gridCol === col && m.effectiveness > 0);
    const avgEff = positionMappings.length > 0
      ? positionMappings.reduce((sum, m) => sum + m.effectiveness, 0) / positionMappings.length
      : 0;
    const phases = {};
    for (const phase of PHASES) {
      phases[phase] = positionMappings.some(m => m.phases[phase]);
    }
    positions[col] = {
      position: POSITION_MAP[col],
      riskDimension: POSITION_RISK_DIM[POSITION_MAP[col]],
      mappingCount: positionMappings.length,
      avgEffectiveness: Math.round(avgEff),
      phases,
      safeguards: positionMappings.map(m => m.id),
    };
  }
  return positions;
}

/**
 * Compute scenario susceptibility from its objectives' control model.
 * Returns computed sF (frequency susceptibility) and sM (magnitude susceptibility).
 *
 * Logic:
 * - Each scenario traverses N objectives
 * - Each objective has an effectiveScore from cycle analysis
 * - Objectives at Positions 1 & 2 contribute to frequency reduction
 * - Objectives at Position 3 contribute to magnitude reduction
 * - Higher effectiveScore = lower susceptibility (better defense)
 *
 * The conversion: effectiveScore (0-100) → susceptibility (0-1)
 * susceptibility = 1 - (effectiveScore / 100)
 * A score of 0 → susceptibility 1.0 (no control, everything gets through)
 * A score of 100 → susceptibility 0.0 (perfect control, nothing gets through)
 */
export function computeScenarioSusceptibility(scenario, overrides = {}) {
  const objectiveNames = scenario.objectives || [];

  // Match scenario objectives to our OBJECTIVES by name
  const matchedObjectives = OBJECTIVES.filter(o => objectiveNames.includes(o.name));

  if (matchedObjectives.length === 0) {
    return { sF: 0.5, sM: 0.5, objectiveDetails: [] };
  }

  const objectiveDetails = matchedObjectives.map(obj => {
    const cycle = computeCycleStatus(obj.id, overrides);
    const positions = computePositionEffectiveness(obj.id, overrides);

    // This objective's contribution to frequency vs magnitude
    const freqPositions = ["Conditions", "TTPs"];
    const magPositions = ["Result"];

    const freqScore = freqPositions
      .map(p => positions[p].avgEffectiveness)
      .filter(e => e > 0);
    const magScore = magPositions
      .map(p => positions[p].avgEffectiveness)
      .filter(e => e > 0);

    const avgFreqEff = freqScore.length > 0
      ? freqScore.reduce((a, b) => a + b, 0) / freqScore.length
      : 0;
    const avgMagEff = magScore.length > 0
      ? magScore.reduce((a, b) => a + b, 0) / magScore.length
      : 0;

    return {
      objectiveId: obj.id,
      objectiveName: obj.name,
      stage: obj.stage,
      cycleStatus: cycle,
      positions,
      freqEffectiveness: Math.round(avgFreqEff * cycle.gapMultiplier),
      magEffectiveness: Math.round(avgMagEff * cycle.gapMultiplier),
    };
  });

  // Aggregate across objectives
  // sF: average frequency effectiveness across all objectives, converted to susceptibility
  const freqEffValues = objectiveDetails.map(d => d.freqEffectiveness).filter(v => v > 0);
  const magEffValues = objectiveDetails.map(d => d.magEffectiveness).filter(v => v > 0);

  const avgFreqEff = freqEffValues.length > 0
    ? freqEffValues.reduce((a, b) => a + b, 0) / freqEffValues.length
    : 0;
  const avgMagEff = magEffValues.length > 0
    ? magEffValues.reduce((a, b) => a + b, 0) / magEffValues.length
    : 0;

  // Convert effectiveness (0-100) to susceptibility (0-1)
  // We use a non-linear mapping to make the demo more realistic:
  // effectiveness 0 → sF = 0.85 (some natural filtering even without controls)
  // effectiveness 50 → sF = 0.45
  // effectiveness 100 → sF = 0.05 (never truly zero)
  const effToSusc = (eff) => {
    const normalized = eff / 100;
    return Math.max(0.05, Math.min(0.85, 0.85 - normalized * 0.8));
  };

  return {
    sF: Math.round(effToSusc(avgFreqEff) * 100) / 100,
    sM: Math.round(effToSusc(avgMagEff) * 100) / 100,
    objectiveDetails,
    objectiveCount: matchedObjectives.length,
    avgFreqEffectiveness: Math.round(avgFreqEff),
    avgMagEffectiveness: Math.round(avgMagEff),
  };
}

/**
 * Compute full risk metrics for a scenario using the control model.
 * Replaces the hardcoded sF/sM with model-derived values.
 */
export function computeModelDrivenMetrics(scenario, overrides = {}) {
  const susc = computeScenarioSusceptibility(scenario, overrides);
  const rF = scenario.freq * susc.sF;
  const rM = scenario.mag * susc.sM;
  return {
    ...scenario,
    sF: susc.sF,
    sM: susc.sM,
    rF,
    rM,
    iALE: scenario.freq * scenario.mag,
    rALE: rF * rM,
    cLev: (1 - (rF * rM) / (scenario.freq * scenario.mag)) * 100,
    _controlModel: susc, // attach full model detail for drill-down
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// V. INTEGRATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get objective by name (matches the strings used in data.js scenarios)
 */
export function getObjectiveByName(name) {
  return OBJECTIVES.find(o => o.name === name) || null;
}

/**
 * Get all objectives for a scenario
 */
export function getScenarioObjectives(scenario) {
  return (scenario.objectives || [])
    .map(name => getObjectiveByName(name))
    .filter(Boolean);
}

/**
 * Get all CIS safeguards relevant to a scenario (across all its objectives)
 */
export function getScenarioSafeguards(scenario, overrides = {}) {
  const objectives = getScenarioObjectives(scenario);
  const allMappings = objectives.flatMap(obj =>
    getMappingsForObjective(obj.id, overrides)
  );
  // Deduplicate by CIS ID (same safeguard may appear for multiple objectives)
  const seen = new Set();
  return allMappings.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

/**
 * Find the best vocabulary match for a user query using the hierarchy.
 * Returns matches at class level and domain level.
 * Priority 2: "near enough" matching.
 */
export function findVocabularyMatch(query, hierarchy) {
  const q = query.toLowerCase();
  const results = [];

  for (const [domain, data] of Object.entries(hierarchy)) {
    // Check domain name
    if (domain.toLowerCase().includes(q)) {
      results.push({ level: "domain", name: domain, matchType: "domain" });
    }

    // Check class names
    for (const cls of data.classes) {
      if (cls.toLowerCase().includes(q)) {
        results.push({ level: "class", name: cls, domain, matchType: "exact" });
      }
    }

    // Check examples (instance-level matching → returns parent class)
    if (data.examples) {
      for (const [cls, examples] of Object.entries(data.examples)) {
        for (const ex of examples) {
          if (ex.toLowerCase().includes(q)) {
            results.push({
              level: "instance",
              name: ex,
              parentClass: cls,
              domain,
              matchType: "near",
              suggestion: `"${ex}" is covered by the "${cls}" class in ${domain}`,
            });
          }
        }
      }
    }
  }

  return results;
}

/**
 * Get a summary of cycle gaps across all objectives.
 * Useful for the "requirements gap" visualization.
 */
export function getAllCycleGaps(overrides = {}) {
  return OBJECTIVES.map(obj => {
    const cycle = computeCycleStatus(obj.id, overrides);
    return {
      objectiveId: obj.id,
      objectiveName: obj.name,
      stage: obj.stage,
      ...cycle,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// VI. TCO DATA — Simulated Annual Cost per Safeguard ($K)
// ═══════════════════════════════════════════════════════════════════════════

export const CIS_TCO = {
  'CIS-7.4':  320,   // Automated patching — licensing, infrastructure, patch management staff
  'CIS-13.3': 420,   // Network IDS — sensors, management platform, analyst time
  'CIS-16.11': 85,   // DB hardening templates — configuration management tooling
  'CIS-14.1': 180,   // Security awareness — platform, content, phishing simulation, staff time
  'CIS-9.2':   75,   // DNS filtering — cloud service subscription
  'CIS-9.7':  350,   // Email anti-malware — gateway licensing, management, tuning
  'CIS-6.4':  220,   // MFA for remote access — token/app licensing, integration, support
  'CIS-5.3':   65,   // Dormant account mgmt — IAM tooling (shared cost), process time
  'CIS-6.5':  280,   // MFA for all remote — broader deployment than 6.4
  'CIS-12.2': 520,   // Secure network architecture — segmentation hardware, design, maintenance
  'CIS-13.5': 310,   // Remote access control — NAC platform, policy management
  'CIS-8.5':  240,   // Detailed audit logs — storage, collection infrastructure, SIEM feed
  'CIS-10.1': 380,   // Anti-malware — endpoint protection platform, management, response
  'CIS-8.2':  190,   // Audit log collection — log aggregation infrastructure
  'CIS-4.1':  145,   // Secure configuration process — CIS benchmark tooling, compliance scanning
  'CIS-11.1': 450,   // Data recovery process — backup infrastructure, DR site, testing
  'CIS-11.4': 280,   // Isolated recovery data — air-gapped/immutable storage, replication
  'CIS-13.1': 480,   // Centralized alerting — SIEM platform, correlation rules, analyst staff
  'CIS-3.12': 165,   // Data segmentation by sensitivity — classification tooling, DLP integration
  'CIS-8.11': 130,   // Audit log reviews — analyst time, review tooling
  'CIS-6.1':   95,   // Access granting process — workflow tooling, approval automation
  'CIS-13.8': 350,   // DLP — endpoint + network DLP, policy management, tuning
  'CIS-3.10': 125,   // Transit encryption — TLS management, certificate infrastructure
  'CIS-12.7': 290,   // VPN + firewall for remote — VPN infrastructure, firewall rules
  'CIS-6.8':  155,   // RBAC — role management tooling, periodic review process
  'CIS-8.12':  85,   // Service provider logs — API integration, ingestion pipeline
  'CIS-5.4':   75,   // Dedicated admin accounts — PAM tooling (shared cost), process
  'CIS-16.1': 250,   // Secure SDLC — SAST/DAST tooling, security review process, training
  'CIS-3.14': 110,   // Sensitive data access logging — DAM tooling, storage
  'CIS-18.1': 380,   // Penetration testing program — external vendor, internal red team, remediation tracking
};

export function getSafeguardTCO(cisId) {
  return CIS_TCO[cisId] || 100;
}

export function getObjectiveTCO(objectiveId, overrides = {}) {
  const mappings = getMappingsForObjective(objectiveId, overrides);
  return mappings.reduce((sum, m) => sum + getSafeguardTCO(m.id), 0);
}

/**
 * Get the grid view: all mappings organized as a 3×3 grid per objective.
 * Returns a structure suitable for visual grid rendering.
 */
export function getObjectiveGrid(objectiveId, overrides = {}) {
  const mappings = getMappingsForObjective(objectiveId, overrides);
  const grid = {};

  for (const row of GRID_ROWS) {
    grid[row] = {};
    for (const col of GRID_COLS) {
      const cellMappings = mappings.filter(m => m.gridRow === row && m.gridCol === col);
      const phases = {};
      for (const phase of PHASES) {
        phases[phase] = cellMappings.some(m => m.phases[phase] && m.effectiveness > 0);
      }
      grid[row][col] = {
        mappings: cellMappings,
        phases,
        avgEffectiveness: cellMappings.length > 0
          ? Math.round(cellMappings.reduce((s, m) => s + m.effectiveness, 0) / cellMappings.length)
          : 0,
        empty: cellMappings.length === 0,
      };
    }
  }

  return grid;
}
