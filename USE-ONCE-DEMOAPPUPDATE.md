# USE-ONCE: Demo App Restructure Around Three Decision Types

*Use-once planning document. Written session 2026-03-22. Consume into session work, then archive or delete.*
*This document captures the next session's primary build plan for the top-risk-report demo app.*

---

## Context

The demo app (`/top-risk-report/`) has grown from a 4-view prototype (session 2026-03-16) to an 11-view application through sessions 2026-03-20 and 2026-03-22. The views work individually but lack an organizing principle that tells the user *why* these views exist and *in what order* to use them. The three decision types from DECISION-FRAMEWORK.md §I provide that organizing principle.

The demo audience is GRC practitioners new to risk quantification. They are conversationally skilled in traditional risk analysis but not quantification experts. They need to see how it fits together and why. The tool must feel like a real tool across backend, analyst, and reporting functions while teaching the concepts through use.

---

## The Three Decision Types (from DECISION-FRAMEWORK.md §I)

These have a **fixed dependency order** — each tier requires the one(s) above it:

### Type #1: "What should we worry about?"
*Strategic risk assessment. Setting and evaluating limits.*

**The question:** Where does risk concentrate, does it exceed what we'll tolerate, and do we need to change course?

**Decision Framework mapping:** Comparisons 1–4 (how much risk? how much uncertainty? more/less than expected? more/less than acceptable?). Indicator forms: all three (ALE for budgeting, exceedance for appetite, ranking for prioritization).

**CISO Goals served:** Goal 1 (know the landscape), Goal 4 (program working?), Goal 7 (know blind spots).

**Output:** Thresholds, priorities, and the decision of whether current operations are sufficient — or whether Types #2 and #3 are needed.

### Type #2: "Given what we have, what do we do first?"
*Operational prioritization within existing resources.*

**The question:** Given our current budget and people, in what order do we address things to keep risk below the thresholds set by Type #1?

**Decision Framework mapping:** Comparisons 5–7 (where is risk coming from? can we change? how much improvement at best?). Indicator forms: ranking (prioritization) and annualized (cost-benefit within budget).

**CISO Goals served:** Goal 2 (direct resources), Goal 4 (demonstrate effectiveness), Goal 6 (respond to "what about X?").

**Output:** A prioritized action queue within budget constraints.

### Type #3: "What new investment do we need?"
*New capability acquisition when existing resources aren't enough.*

**The question:** What new capabilities would close the gap, at what cost, with what return, and are any worth it?

**Decision Framework mapping:** Comparisons 7–9 (how much improvement? is it worth it? which option is best?). Indicator forms: annualized (ROI) and exceedance (will it get us below threshold?).

**CISO Goals served:** Goal 2 (direct resources), Goal 3 (justify to funders).

**Output:** A business case: options compared, costs quantified, risk reduction projected, "worth it?" answered.

### The Cascade

The three types form a cascade: Type #1 → determines whether #2 or #3 is needed → Type #2 is tried first (optimize existing resources) → Type #3 is the escalation when #2 isn't sufficient. The demo should tell this cascade story — not just contain views for each type, but guide the user through the sequence.

---

## What We Need to Demo Each Type

### Type #1 — Risk Position

**Ideal views:**

1. **Forecast Dashboard (NEW — the synthesis view).** Opens with the answer to the most basic question: "Here's your quarterly baseline — 22 scenarios, $X total exposure, N items exceed tolerance, here's what changed since last quarter." Synthesizes comparisons 1, 3, and 4 in a single opening view. Contains the **escalation trigger**: explicit bridge from "these items exceed tolerance" to "you need Type #2 or Type #3." This is the NWS broadcast.

2. **Risk Concentrations (EXISTS — enhanced).** Where risk accumulates, ranked by any vocabulary dimension. Group-by-anything dropdown already built. Indicator form switching (ALE/Prob/Rank) already built. This is the drill-down from the dashboard: "tell me more about where risk concentrates."

3. **Risk Landscape (EXISTS — enhanced).** Visual positioning against tolerance. Group-by-anything dropdown already built. Tolerance curve already built. This is the board's visual: "where are we relative to appetite?"

4. **Theme Detail (EXISTS — accessible by click-through, not primary tab).** One-pager deep dive on a single risk area. Already built and functional.

**What's missing for Type #1:**
- The Forecast Dashboard (synthesis + escalation trigger)
- Meaningful temporal comparison (simulated "last quarter" baseline instead of seeded-random QoQ)
- Indicator form switching on Theme Detail (currently only on Risk Concentrations)

### Type #2 — Operational Priority

**Ideal views:**

1. **Prioritized Action Queue (NEW — the most valuable missing piece).** The single output a security operations audience needs most. "Here are your top actions with existing resources, ranked by risk reduction per unit of operational effort." Each item: what to do, at which position, which dimension/phase cell to improve, affecting which scenarios, reducing risk by how much, what "done" looks like. Shows cumulative risk reduction curve — the point of diminishing returns is visible.

   **Simulated data needed:** Per-action effort estimates (days/FTE or similar). These would be generated similarly to TCO data — per CIS safeguard or per dimension×phase cell. The ranking algorithm: sort by (risk reduction ÷ effort estimate), show cumulative reduction.

2. **Control Performance (EXISTS — the structural hub).** Where are the gaps, how do they map to risk? The dimension × phase matrix shows the structural detail behind the action queue. Already built with grouping, display modes, and what-if.

   **Enhancement needed:** The what-if should explicitly label two modes: "Operational reallocation" (Type #2 — budget-neutral, improve this by reducing attention elsewhere) and "New investment" (Type #3 — additional budget). Even if the math is identical, the framing teaches the user these are different decisions.

3. **Structural Analysis (EXISTS — accessible by click-through).** Cross-scenario drivers, highest-leverage remediation targets. Already built. Moves here from Analyst Tools because it answers "what should I fix first within this theme?" — Type #2 reasoning.

**What's missing for Type #2:**
- The Prioritized Action Queue (the #1 missing piece)
- Effort estimates per action (simulated data)
- "New finding" entry point ("a CVE dropped — show me impact on baseline and priority reordering")
- Budget-neutral vs. new-investment framing on Control Performance's what-if
- Cumulative risk reduction visualization

### Type #3 — Investment Analysis

**Ideal views:**

1. **Investment Scenario Comparison (NEW).** Define 2–3 investment options, each with a cost and a set of performance improvements (mapped to Control Performance cells). Compare side by side: risk reduction, ROI, whether each achieves threshold. Answers CISO Q3.2–Q3.4. Shows: "even with Option C at $870K, residual risk for Data Exfiltration remains $X because the max achievable ceiling is 85% — this is a risk acceptance or transfer conversation, not an investment conversation."

2. **Control Value (EXISTS — enhanced).** Cost vs. risk managed for existing controls. Efficiency ratios. Already built with TCO data and group-by-anything columns.

   **Enhancement needed:** Connect to Investment Scenario Comparison — "based on this efficiency analysis, here are the highest-ROI investment candidates."

**What's missing for Type #3:**
- Investment Scenario Comparison (define options, compare, evaluate vs. threshold)
- Cost-to-threshold analysis ("minimum investment to stay within appetite")
- Degradation analysis ("if budget cut 20%, what degrades?")
- Explicit "above maximum achievable" surfacing (risk acceptance/transfer trigger)

### Foundation / Analyst Workbench

**Views (existing, repositioned):**
- Scenario Portfolio — the baseline data. Stays.
- Theme Builder — construct custom themes. Stays.
- Safeguard What-If (ControlExplorer) — granular CIS safeguard tuning. Becomes a drill-down from Control Performance, not a primary tab.

### Views to Remove from Primary Nav
- **Defense Status (CycleGapDashboard)** — subsumed by Control Performance in "By Phase" display mode grouped by Control Objective. Same data, better presented.
- **What-If Report (WhatIfReport)** — subsumed by Control Performance's what-if sidebar (operational scenarios) and Control Value's efficiency analysis (investment scenarios).
- **Safeguard What-If (ControlExplorer)** — becomes a drill-down from Control Performance, not standalone.

---

## Proposed Nav Structure

```
TYPE #1 — RISK POSITION
  Forecast Dashboard    (NEW)  — "Here's where we stand. Here's what exceeds tolerance."
  Risk Concentrations   (EXISTS) — "Where does risk accumulate?"
  Risk Landscape        (EXISTS) — "Visual positioning against appetite"
  [Theme Detail]        (click-through, not primary tab)

TYPE #2 — OPERATIONAL PRIORITY
  Action Queue          (NEW)  — "What to do first with existing resources"
  Control Performance   (EXISTS) — "Where are the structural gaps?"
  [Structural Analysis] (click-through from theme or action item)

TYPE #3 — INVESTMENT ANALYSIS
  Investment Comparison (NEW)  — "Define options, compare, evaluate vs. threshold"
  Control Value         (EXISTS) — "Is what we're paying worth it?"

ANALYST WORKBENCH
  Scenario Portfolio    (EXISTS) — "The baseline data"
  Theme Builder         (EXISTS) — "Construct custom themes"
```

**Primary views: 7** (3 existing + 4 new, but 3 old views removed = net +1)
**Analyst views: 2** (unchanged)
**Drill-downs: 3** (Theme Detail, Structural Analysis, Safeguard detail — accessible by click-through)

---

## How This Relates to the Larger Project

### The demo app makes the project's abstract design work concrete

The three decision types in DECISION-FRAMEWORK.md §I are described as organizational decision needs. The demo app implements them as interactive views. This is the first time the Decision Framework's structure becomes something a person can click through, which will:

1. **Validate the Decision Framework itself.** Does the cascade (Type #1 → #2 → #3) feel natural when navigated interactively? Do the comparison types (1–9) map cleanly to UI interactions? Where does the framework predict a user need that the app doesn't serve?

2. **Test the algebra's claims operationally.** The flexible aggregation surface (Axiom 4), indicator form switching (Axiom 5), structural decomposition (Axioms 1–3), and the conjunction's asymmetry (condition removal leverage) are all exercised by specific user interactions. The demo is a functional test of whether the algebra's properties produce useful analytical capabilities.

3. **Validate the CISO GQIM profile.** The nav structure maps to CISO Goals 1–7 and Report Types 1–6. The demo reveals whether the goal/question hierarchy produces views that practitioners actually want, and whether report types cluster the way the GQIM derivation predicts.

4. **Inform the v3 database design.** Every "simulated data" label in the demo marks a future data requirement for the v3 Neo4j database: dimension × phase performance data, TCO per safeguard, effort estimates per action, "last quarter" temporal snapshots, max achievable ceilings per objective. These become schema requirements.

5. **Test the three-layer user model.** The Reporting/Analyst/Configuration separation (established session 2026-03-20) maps to the demo's three decision types: Types #1–#3 are reporting-layer views consumed by different roles. The Analyst Workbench is the analyst layer. The configuration layer (position design, control mapping, scenario engineering) is not yet in the demo but the architecture leaves room.

### The system "powers and enhances" traditional reporting

**Enhanced traditional reports (Type #1):**
- The quarterly board summary is the Forecast Dashboard — same content CISOs produce today, but now every number traces to structure
- The risk register is Risk Concentrations — same ranked list, but now sortable by any vocabulary dimension with indicator form switching
- The regulatory package is the structural transparency that the algebra produces as a byproduct — methodology documentation, assessment evidence, scenario-level precision

**New report types the traditional approach can't produce (Types #2 and #3):**
- The Prioritized Action Queue — requires structural decomposition (which actions reduce which conjunctions in which scenarios) that only the algebra provides
- The Investment Scenario Comparison — requires the what-if propagation chain (cell change → susceptibility → risk) that only the formal model supports
- Cost-to-threshold — requires connecting risk quantities to cost data through the structural model
- The "difference from best achievable" — requires max performance ceilings, which require understanding structural limitations of control positions

This distinction matters for the demo audience: they should see that the system makes their existing reports better AND gives them entirely new capabilities they couldn't have without the formal approach.

### Connects to delivery operations

The Forecast Dashboard implements the baseline forecast publication (DELIVERY-OPERATIONS.md §II). The Action Queue implements the decision support service's Type #2 output. The Investment Comparison implements the Type #3 output. The escalation trigger in the dashboard implements the bespoke escalation assessment (DELIVERY-OPERATIONS.md §VI). The what-if modes implement the four-level escalation: Level 1 (baseline already answers), Level 2 (updated data on existing scenario), Level 3 (composed from existing building blocks), Level 4 (genuinely new territory).

---

## Tensions

### T-01: Control Performance serves all three types, muddying its purpose
Control Performance's what-if slider doesn't distinguish between "rearranging operations" (Type #2) and "investing new money" (Type #3). For the demo audience, blurring these undermines the story that these are structurally different decisions. **Proposed resolution:** Label the what-if as having two modes with different framings, even if the math is identical.

### T-02: The action queue is the most valuable missing piece and the hardest to fake
A real action queue requires structural analysis (which we have), effort estimates per action (which we don't), and a constraint model (budget, headcount, time — which we don't). **Proposed resolution:** Simulate effort estimates like we simulate TCO. The ranking algorithm (risk reduction ÷ effort) is real; the input data is simulated. Mark clearly.

### T-03: The cascade story needs navigation that guides, not just organizes
Tabs organized by decision type is necessary but not sufficient. The demo needs to guide the user through the cascade. **Question:** Should the Landing page become this guided workflow, or should it stay as a general overview?

### T-04: Too many views for a first-time audience
11 tabs is overwhelming. The three-decision-type structure helps, but each type really only needs 1–2 primary views plus drill-downs. **Proposed resolution:** 7 primary + 2 analyst + 3 drill-downs (see nav structure above). Removes 3 existing views that are subsumed.

### T-05: "Enhanced traditional" vs. "new capability" distinction should be explicit
The demo should show both: "here's your traditional board summary, now with traceable numbers" AND "here's something you've never had: a ranked action list where every item is quantified." The contrast is the value proposition. **Question:** Should the Landing page frame this distinction explicitly?

### T-06: Governance as 6th performance dimension (carried from session)
The algebra specifies 5 dimensions. The demo uses 6. Parked — do whatever is easiest, revisit formally.

### T-07: Max performance ceiling formalization (carried from session)
The concept that max achievable performance <100% for structural reasons connects to the algebra's treatment of inherent conjunction limitations. Noted for future formalization in RISK-DYNAMICS-SPEC.md and/or ALGEBRA-OF-RISK.md.

### T-08: Performance cell requirements definition (carried from session)
"Chance requirements will be met over time" implies defined requirements at each dimension × phase intersection. These don't exist yet. The demo simulates; the formal project needs to design what "requirements" means at this granularity.

---

## Questions for JW (to resolve at start of next session)

**Q1:** The Prioritized Action Queue — build with simulated effort data in the next session, or defer? It's the single highest-impact addition for the Type #2 story.

**Q2:** The Investment Scenario Comparison — build in next session, or defer? It's the Type #3 anchor view. Define options, compare side by side, evaluate whether any achieves threshold.

**Q3:** The Forecast Dashboard — build as the opening view that synthesizes the baseline and triggers the cascade? This replaces the current Landing page's role.

**Q4:** Should the Landing page become the cascade workflow guide (walking through Type #1 → #2 → #3 with entry points), or stay as a general overview with the nav structure doing the work?

**Q5:** How many primary views is right? Proposal: 7 primary + 2 analyst + 3 drill-downs. Removes Defense Status, What-If Report, and Safeguard What-If as standalone tabs.

**Q6:** The "new finding" entry point for Type #2 ("a CVE drops — show me impact") — important enough for next session, or future?

---

## Execution Plan

### Phase 1: Restructure nav and remove subsumed views
- Reorganize App.jsx tabs into three decision-type groups + analyst workbench
- Remove Defense Status, What-If Report, Safeguard What-If from primary nav
- Update Landing page to frame the three decision types and cascade

### Phase 2: Build the Forecast Dashboard (Type #1 anchor)
- Synthesis view: total exposure, threshold breaches, QoQ change summary
- Escalation trigger: "N items exceed tolerance → go to Type #2 or #3"
- Simulated "last quarter" baseline for meaningful temporal comparison

### Phase 3: Build the Prioritized Action Queue (Type #2 anchor)
- Simulate effort estimates per action (per CIS safeguard or per dim×phase cell)
- Ranking algorithm: risk reduction ÷ effort, cumulative reduction curve
- Each item: what, where, which scenarios, how much reduction, what "done" looks like
- Budget constraint visualization: "this is where diminishing returns begin"

### Phase 4: Build the Investment Scenario Comparison (Type #3 anchor)
- Define 2–3 investment options (sets of cell changes + cost)
- Compare side by side: risk reduction, ROI, below-threshold achievement
- Surface max-achievable ceiling: "even with unlimited investment, residual = $X"
- Cost-to-threshold: "minimum investment to achieve tolerance"

### Phase 5: Wire cross-view navigation
- Risk Concentrations → Theme Detail → Structural Analysis → Control Performance
- Forecast Dashboard → escalation → Action Queue or Investment Comparison
- Control Value → Control Performance (scope → quality navigation)
- Action Queue items → Control Performance cell (action → structural detail)

### Phase 6: Add indicator form switching to remaining views
- Theme Detail, Control Performance risk panels, Control Value

### Phase 7: UX polish
- Apply "minimum content per mission" principle
- Trim screen density
- Ensure clean progressive disclosure

---

*Written session 2026-03-22. Consume at start of next session. This is a planning document, not a permanent design document — findings should be promoted to REPORT-DELIVERY.md, DECISION-FRAMEWORK.md, or other formal documents as appropriate via the update-documentation skill.*
