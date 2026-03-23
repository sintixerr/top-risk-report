# Session 2026-03-22b — Demo App Changes

*This document records what was built, why, and what design decisions were made. Read once for context; the code is the source of truth.*

---

## What Changed and Why

### The Core Design Insight: Two Structurally Different Queues

The session's most consequential design finding was that the Action Queue (now renamed) was doing two structurally different jobs under one roof. Through vibe-mode discussion, JW identified that "control gap management" and "vulnerability remediation" are algebraically distinct interventions:

**Control Gap Management (strategic):** "Where are the gaps in our defensive cycle, and what should we invest in closing them?" Acts on the S/E/A/Ach mechanism — improving cycle quality at specific positions. The unit of work is a dimension × phase cell. Cadence is quarterly/annual. This is Axiom 2 territory.

**Vulnerability Management (tactical):** "What specific exploitable conditions exist right now, and which should we remediate first?" Acts on the conjunction's condition leg — removing specific items from the vulnerability stock. The unit of work is a CVE mapped to weakness classes. Cadence is continuous. This is Axiom 1 territory, Position 1 Level 3 specifically.

Both use the **same propagation chain** and **same efficiency metric** (risk reduction per effort day). The distinction is structural, not mathematical — different inputs, different cadences, different owners, different algebra positions. The demo audience (GRC practitioners) already works this way — they have separate workstreams for program improvement and vulnerability management. What they DON'T have is both computed from the same structural framework.

### The CVE Impact Mechanism: Option A (Performance Cell Penalties)

Each CVE defines a set of performance cell penalties: which dimensions and phases degrade, by how much, at which objectives. The standard propagation chain handles everything downstream — degraded cells → higher susceptibility → higher scenario risk → portfolio impact. This is the SAME mechanism as the Performance grid's what-if slider and the Action Queue's improvement computations. One propagation chain, three use cases.

Patching a CVE = reversing its penalties = computable risk reduction through the identical chain. This means the Vulnerability Queue's efficiency ranking uses the same math as the Control Gap queue, making cross-comparison meaningful when needed.

### The Analyst Workbench Role

The CVE Assessment screen lives in the Analyst Workbench (not in Type #2). This mirrors the pattern: the Theme Builder (Workbench) produces themes that appear in Type #1 views. The CVE Assessment (Workbench) produces assessed vulnerabilities that appear in the Type #2 Vulnerability Queue. The workbench is where analytical work is done; the decision-type views are where results are consumed.

### Dropdown Nav Redesign

Late in the session, JW requested the nav bar be converted from a horizontal band of tab buttons to four dropdown menus. The old nav was getting crowded (11 tabs across 4 groups). The new nav uses four dropdown buttons — Risk Position, Work Priority, Investment Analysis, Analyst Workbench — each opening a menu panel with item labels and descriptions. The active group and active tab are indicated on the dropdown button itself. Dropdowns close on outside click.

Renames in this pass:
- "Forecast" → "Forecast Summary"
- "Operational Priority" → "Work Priority"

### Small UX Additions

- **"Show All Scenarios →" button** added to the Forecast Summary's "Highest-exposure scenarios" card header, linking to the Analyst Workbench → Scenarios screen. Provides a direct path from the top-8 summary to the full 22-scenario portfolio.
- **NewElementStub.jsx** updated: vulnerability card badge changed from "First to build" to "Built → Open" (clickable, navigates to CVE Assessment). Back navigation buttons updated to point to CVE Assessment and Forecast Summary (not the old Action Queue and Forecast Dashboard labels).

---

## New Files

### `src/cveModel.js` — CVE Data Model and Computation

The data layer for vulnerability assessment. Contains:

- **12 pre-built demo CVEs** with hand-authored impact profiles. Each has: CVE ID, title, severity (critical/high/medium/low), escalation level (1–4 per delivery ops bespoke ladder), description, mapped weakness classes, optional asset class filter, performance penalties array, effort estimate, and remediation guidance.
- **Structural variety across the 12:** CVE-2026-1001 is widespread (15+ scenarios, critical library RCE). CVE-2026-0847 is narrow but catastrophic (SWIFT validation flaw, 2–3 scenarios). CVE-2026-0991 targets magnitude not frequency (backup agent RCE undermines recovery). CVE-2026-1305 is Level 3 escalation (AI pipeline poisoning, nearly novel). CVE-2026-0634 attacks the defense itself (EDR kernel driver evasion).
- **Computation functions:** `getAffectedScenarios()` (weakness class + optional asset filter matching), `buildCveOverrides()` (converts penalty array to performance cell overrides), `computeCveImpact()` (full before/after analysis with per-scenario detail), `computeRemediationPriority()` (risk reduction / effort), `computeAllRemediationPriorities()` (ranked list).
- **User CVE management:** `loadUserCves()` / `saveUserCves()` via localStorage, mirroring the user themes pattern. `createUserCve()` auto-generates penalties from severity level using `SEVERITY_PENALTY_PROFILES`.

### `src/components/VulnerabilityAssessment.jsx` — Analyst Workbench Screen

The analyst's workspace for vulnerability triage. Two modes:

**Mode 1: Pre-built CVEs.** Horizontal scrollable card selector showing all 12 demo CVEs with severity badge, escalation level, and affected scenario count. Click a card → full impact analysis appears below.

**Mode 2: New Assessment.** Form with: CVE ID field, title, severity dropdown, description textarea, weakness class multi-select (buttons from extractVocabulary()), asset class multi-select (optional narrowing). Penalties auto-generated from severity level. Saved CVEs appear in a "Your assessments" section and persist via localStorage.

**Impact Display (4 sections):**
1. CVE Profile — severity badge, escalation badge, description, mapped weakness/asset classes
2. Portfolio Impact — 4 big numbers: risk added, scenarios affected, remediation effort, remediation efficiency
3. Affected Scenarios — table with before/after/delta/% change per scenario, sorted by impact
4. Escalation Assessment — level-specific guidance with remediation note, bridge buttons to Vulnerability Queue and Control Gap Management

Plus a "How this was computed" transparency section explaining the propagation chain.

### `src/components/VulnerabilityQueue.jsx` — Type #2 Tactical Queue

The prioritized remediation view. Shows all CVEs (built-in + user-assessed) ranked by efficiency (risk reduction per effort day).

- **Summary strip:** total risk added by CVEs, count tracked, total effort, portfolio exposure
- **Severity filter:** toggle between All / Critical / High / Medium / Low
- **Cumulative reduction curve:** SVG chart showing diminishing returns from patching in priority order
- **Ranked list:** each CVE with severity dot, affected scenario count, weakness classes, efficiency bar, risk added, effort, cumulative total. Expandable detail with full description and remediation guidance.
- **Cross-reference callout:** explains the two-queue structure — strategic vs. tactical, same framework. Bridge buttons to Control Gap Management and CVE Assessment.

---

## Modified Files

### `src/App.jsx` — Full Rewire (twice)

**First pass:** Added `cveModel.js` imports and CVE state management (`userCves`, `handleSaveCve`, `handleRemoveCve`) mirroring the theme pattern. Nav restructured with Type #2 having 3 tabs and Analyst Workbench having 3 tabs. New routes for `vulnqueue` and `cveassess`.

**Second pass:** Complete nav rewrite from horizontal tab buttons to **four dropdown menus**. Each dropdown is a `NavDropdown` component with: group label button showing active tab indicator, click-to-open panel with item labels + descriptions + active highlighting, outside-click-to-close. Theme selector moved to right side of nav bar with `marginLeft: auto`. Renames: "Forecast" → "Forecast Summary", "Operational Priority" → "Work Priority".

### `src/components/ActionQueue.jsx` — Renamed to Control Gap Management

- Title: "Prioritized Action Queue" → "Control Gap Management"
- Subtitle and help text updated to emphasize strategic/dimensional nature
- **New two-queue context banner** at top showing strategic vs. tactical distinction with clickable link to Vulnerability Queue
- Card header: "Ranked actions" → "Strategic improvements"
- All other functionality unchanged

### `src/components/Landing.jsx` — Updated Cascade Guide

- Type #1 views: "Forecast" → "Forecast Summary"
- Type #2 card subtitle: "Operational Priority" → "Work Priority"
- Type #2 views list: 3 items (Control Gaps, Vulnerabilities, Performance)
- Workbench section: 3-column grid (Scenarios, Theme Builder, CVE Assessment)
- "What's different" section updated for new capabilities
- Demo data note mentions "12 demo CVEs"

### `src/components/ForecastDashboard.jsx` — Renamed + Button

- ScreenHeader title: "Quarterly Risk Forecast" → "Quarterly Forecast Summary"
- Help text: "operational priority" → "work priority"
- **"Show All Scenarios →" button** added to the highest-exposure scenarios card header, navigates to `portfolio` tab

### `src/components/NewElementStub.jsx` — Updated References

- Vulnerability card badge: "First to build" → "Built → Open" (clickable → `cveassess`)
- howItWorks steps updated for vulnerability card to reflect built CVE system
- Back nav buttons: "Action Queue" → "CVE Assessment", "Forecast Dashboard" → "Forecast Summary"
- Header comment and bottom note updated

---

## Design Decisions Made This Session

### D-01: Two separate queues, not one mixed queue

Control Gap Management and Vulnerability Management are separate views under Type #2. The distinction is algebraically real (Axiom 2 cycle quality vs. Axiom 1 condition stock), operationally real (different cadences, owners, inputs), and familiar to the demo audience (GRC practitioners already work this way). A "How these relate" callout in each queue explains the shared framework.

**Alternative considered:** Single mixed queue with type filter. Rejected because mixing "improve your detection architecture" next to "patch this CVE" would confuse practitioners about what the system is saying, even though the math is identical.

### D-02: CVE impact via performance cell penalties (Option A)

Each CVE specifies which performance cells degrade and by how much. The standard propagation chain computes everything downstream. This was chosen over susceptibility multipliers (Option B) or frequency boosts (Option C) because it uses the SAME mechanism as every other what-if in the app — one propagation chain, visible and consistent.

### D-03: CVE Assessment in Analyst Workbench, not Type #2

The assessment screen is analytical work (classification, impact setting). The queue is decision-maker consumption (prioritized list). Same pattern as Theme Builder (workbench) → Theme views (Type #1).

### D-04: User-created CVEs saved like user themes

localStorage with load/save pattern mirroring `loadUserThemes()` / `saveUserThemes()`. User-created CVEs auto-generate penalties from severity level rather than requiring manual penalty authoring.

### D-05: 12 demo CVEs with structural variety

Designed to cover: widespread vs. narrow impact, frequency vs. magnitude degradation, all four escalation levels, attacks on defenders' own tools, novel vs. well-understood vulnerabilities. See `cveModel.js` for the full set with rationale in each CVE's description.

### D-06: Dropdown nav instead of tab band

Four dropdown menus replace the horizontal tab buttons. Groups: Risk Position, Work Priority, Investment Analysis, Analyst Workbench. Each dropdown shows items with descriptions. Active group/tab indicated on the button. Reduces visual crowding from 11+ visible tabs to 4 dropdown triggers.

### D-07: "Forecast" → "Forecast Summary", "Operational Priority" → "Work Priority"

Renaming for clarity and concision. "Forecast Summary" better describes the synthesis/overview nature of that view. "Work Priority" is shorter and more direct than "Operational Priority."

---

## What Was NOT Done

- **Scenario Detail screen** — Objective 2 from the session plan. Deferred to next session. The CVE view would benefit from linking to it (click an affected scenario → see the full chain).
- **CVE penalties affecting the Control Gap queue** — currently the two queues are independent. A future integration could inject active CVE penalties into the performance model before the Control Gap queue generates its improvements, so the strategic queue reflects the current vulnerability landscape.
- **Combined view toggle** — originally discussed as "separate queues with combined toggle." The toggle wasn't built. Both queues use the same efficiency metric so a combined ranking is technically possible; whether it's useful for the demo is unclear.
- **Editing user-created CVEs** — save and remove work; in-place editing of an existing user CVE is not implemented.
- **Connection between CVE Assessment impact display and Performance grid** — the "View in Performance grid" drill-through that would show the degraded cells isn't wired yet.

---

## Tensions Identified and Status

| # | Tension | Status |
|---|---|---|
| T-1 | CVE screen → Scenario Detail connection | Parked. Build Scenario Detail first, then wire. |
| T-2 | Consequence chain empty on loss side | Parked for Scenario Detail session. JW has a temporary fix idea. |
| T-3 | Where Scenario Detail lives in nav | Parked until built. |
| T-4 | CVE impact mechanism | Resolved: Option A (performance cell penalties). |
| T-5 | Number of demo CVEs | Resolved: 12 with structural variety. |
| T-6 (new) | Two independent queues vs. integrated view | Open. Currently independent. Future: CVE penalties could feed into the performance model that the Control Gap queue reads from. |
| T-7 (carried) | Governance as 6th performance dimension | Carried from previous session. Still parked. |

---

## Nav Structure After This Session

```
◈ Landing (cascade guide)

[Dropdown] Risk Position — "What should we worry about?"
├── Forecast Summary
├── Concentrations  
└── Landscape

[Dropdown] Work Priority — "What do we do first?"
├── Control Gaps        (strategic: S/E/A/Ach cycle quality)
├── Vulnerabilities     (tactical: condition stock remediation)
└── Performance         (structural detail behind both)

[Dropdown] Investment Analysis — "What new investment?"
├── Compare Options
└── Control Value

[Dropdown] Analyst Workbench
├── Scenarios
├── Theme Builder
└── CVE Assessment      ← NEW: analyst intake for vulnerability queue

Hidden / Drill-down (accessible via click-through):
├── Theme Detail
├── Structural Analysis (deep dive)
├── Defense Completeness
├── Position What-If
├── Safeguard Explorer
└── New Element (other types stub)
```

---

*Session 2026-03-22b. Built: CVE data model (12 pre-built + user-created), Vulnerability Assessment screen (analyst workbench), Vulnerability Management queue (Type #2 tactical), renamed Action Queue → Control Gap Management, dropdown nav redesign, renames (Forecast Summary, Work Priority). The structural distinction between strategic control gap work and tactical vulnerability remediation is algebraically grounded and familiar to practitioners.*
