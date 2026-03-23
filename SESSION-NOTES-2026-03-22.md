# Session Notes — Top Risk Theme Report Rebuild

*Session date: 2026-03-20 through 2026-03-22*
*Status: Working session notes. Not a permanent design document — will be absorbed into proper project documentation.*

---

## What Happened

Multi-turn intensive rebuild of the Top Risk Theme Report demo website (`/top-risk-report/`). Started from a working prototype with 7 views and ended with a substantially redesigned application: new architecture, new components, new data layer, cleaned terminology, and a three-layer user model.

## Starting Point

The prototype had been built in a prior session (2026-03-16) with:
- 22 real v2 scenarios with simulated risk quantities
- 7 views: ThemeRanked, ThemeScatter, ThemeDetail, ThemeDeepDive, ScenarioPortfolio, ThemeBuilder, PatchingPrioritization
- Vocabulary-powered theme composition
- No control model — risk quantities were hardcoded per scenario

## What Was Built

### 1. Control Model Data Layer (`controlModel.js`)

**30 CIS Controls v8.1 safeguards** mapped to **10 control objectives** with full attribution:
- S/E/A/Ach (See/Evaluate/Act/Achieve) phase coverage per safeguard
- 3×3 requirements grid positioning (Direct/Instrument/Govern × Conditions/TTPs/Result)
- Default effectiveness ratings (0–100)
- Rationale text explaining each mapping

**Computation chain:**
User adjusts safeguard effectiveness → cycle closure recomputes per objective → position effectiveness changes → scenario susceptibility (sF, sM) recomputes → theme-level ALE changes.

**Key design decisions in the control model:**
- Non-linear susceptibility mapping (effectiveness 0 → sF 0.85, effectiveness 100 → sF 0.05)
- Gap penalty model: missing Act = 70% penalty, missing Achieve = 50% penalty
- Deliberate cycle gaps included — some objectives have See + Evaluate but no Act, which is exactly the kind of finding the system should surface

### 2. Position-Level What-If Abstraction (`positionWhatIf.js`)

Translation layer between reporting-level and analyst-level what-if:
- `translatePositionOverride()` — converts aggregate position effectiveness to proportional safeguard-level overrides
- `computeThemeImpact()` / `computePortfolioImpact()` — theme and portfolio impact computation
- `buildCISControlRanking()` — ranks CIS controls by risk exposure (traces through objectives to scenarios)
- `buildControlThemeMatrix()` — full Controls × Themes cross-reference

### 3. Terminology System (`terminology.js`)

Single source of truth for all user-facing labels. Every string imports from here. Structure: `{ label: "what users see", formal: "internal term", tip: "tooltip" }`. Currently only `label` renders — `formal` is reserved for a future "Technical Reference" toggle.

Key translations:
| Internal | User-facing |
|---|---|
| S/E/A/Ach | Observe / Assess / Respond / Verify (O/A/R/V) |
| Conjunction | Attack requirements |
| Control objective | Control objective (kept — see reasoning below) |
| Cycle closure | Defense completeness |
| Residual ALE | Net annual exposure |
| Inherent frequency | Threat likelihood |
| Control leverage | Defense effectiveness |
| Position 1/2/3 | Prevent Conditions / Detect & Block / Limit Damage |
| Direct/Instrument/Govern | Operational / Monitoring / Governance |

**Naming decision: "Control objective" was kept.** An earlier pass renamed it to "Defensive position" for clean-language reasons, but JW corrected this — "control objective" is the right term. It's used in standard security frameworks and practitioners will recognize it.

### 4. New Components

| Component | Layer | Purpose |
|---|---|---|
| `WhatIfReport.jsx` | Reporting | Position-level what-if with dollar impact per theme. No CIS IDs visible at surface — just objectives and dollars. CIS controls visible on expand. |
| `ControlThemeMatrix.jsx` | Reporting | Controls × Themes cross-reference. 30 CIS controls as rows, 10 themes as columns. Clickable cells show overlap detail: scenario count, ALE at intersection, % of theme. |
| `ControlExplorer.jsx` | Analyst | Granular safeguard-level what-if. Individual CIS safeguard sliders with phase attribution. 3×3 grid, conjunction detail, cycle phase analysis. |
| `CycleGapDashboard.jsx` | Reporting | Defense completeness heatmap. 10 objectives × 4 phases. Expandable rows show CIS controls. |
| `Landing.jsx` | — | System overview. "Typical approach vs. this system" comparison. Three core ideas. Framework comparison table. Entry points. |
| `HelpPanel.jsx` | Shared | Reusable ScreenHeader, HelpPanel, Tip, Legend components. |

### 5. Rewritten Components

All existing views were rewritten with:
- Clean terminology from `terminology.js`
- `ScreenHeader` with title, subtitle, and collapsible "How to read this" help
- Legends and tooltips on non-obvious terms
- Model-driven risk quantities (where applicable)

**ThemeDetail** was stripped to a one-pager format: three big numbers → compact grid → scenario contribution bar → QoQ callout → navigation links to deeper views. The analytical foundation section that was previously on this page was removed (it's accessible via Structural Analysis drill-down).

**ThemeRanked** was simplified to a clean ranked table as the primary view, with multi-dimension ranking hidden behind "Rank by other dimensions." CIS Controls added as a first-class rankable dimension.

---

## Architectural Decisions and Their Reasoning

### Three-Layer User Model

The most important architectural decision of the session. Screens are separated by **who opens them and why**:

**Reporting** — Stakeholder screens. The CISO, board, risk committee open these directly to answer their own questions. What-if controls operate at the objective level (aggregate effectiveness → dollar impact). No safeguard IDs at the surface level.

**Analyst** — Back-office screens. The person assembling reports from building blocks generated by the configuration side. They build themes, diagnose structural gaps, adjust individual safeguards. What-if controls operate at the safeguard level with full structural detail.

**Configuration** (future) — System builders. Position design, control mapping, scenario engineering, vocabulary management. Not built yet, but the architecture leaves room.

**The boundary test:** "Would a CISO open this screen to answer their own question?" Yes = Reporting. No = Analyst.

**What-if grain differs by layer:**
| Layer | What the user adjusts | What they see |
|---|---|---|
| Reporting | Objective-level aggregate effectiveness | Dollar impact on themes |
| Analyst | Individual CIS safeguard effectiveness | Cycle closure changes, scenario-level deltas |

This maps to the delivery model's encapsulation principle (DELIVERY-OPERATIONS.md §V): the reporting layer is the boundary; the analyst layer crosses into the analytical core.

### Defense Status Is a Report

The defense completeness heatmap (CycleGapDashboard) was initially placed in the "Analysis" layer. JW corrected: it answers "Is the program working?" (CISO Goal 4, Q4.1/Q4.4). That's Report Type 2: Program Effectiveness. A CISO opens this screen directly — it belongs in Reporting.

### CIS Controls as First-Class Citizens

CIS controls were initially buried — visible only inside expandable sections on the What-If and Defense Status views. JW identified this as a major gap: controls need to be:
1. A rankable dimension on Top Themes (added)
2. Visible in their own cross-reference view against themes (Controls × Themes matrix added)
3. Expandable in Defense Status and What-If (already done)
4. The primary working surface in the Analyst-layer Safeguard What-If

### "Control Objective" Not "Defensive Position"

An earlier terminology pass renamed "control objective" to "defensive position" for clean-language reasons. JW corrected: "control objective" is the right term. The system uses it in a specific way that aligns with how practitioners understand it, and the term appears in standard frameworks. The rename was reverted.

### Terminology Cleanup Approach

Decision: **Clean labels only, structured for future footnotes.** The `terminology.js` file stores both `label` and `formal` fields, but only `label` renders. A future "Technical Reference" toggle could surface the formal terms. This was chosen over three options:
1. Clean only (no formal terms anywhere) — too rigid
2. Footnotes visible by default — too cluttered
3. Toggle (chosen) — clean by default, depth available on demand

---

## Navigation Structure (Current)

```
RISK REPORTING:
  Top Themes          — RT1: "Where do we stand?"
  Risk Landscape      — RT1: Visual positioning
  Theme Detail        — RT1: "Tell me about this one"
  Defense Status      — RT2: "Is the program working?"
  Controls × Themes   — Cross-reference: how controls relate to themes
  What-If             — RT3: "What happens if we invest?"

ANALYST TOOLS:
  Theme Builder       — Construct custom risk themes
  All Scenarios       — The full baseline portfolio
  Structural Analysis — Cross-scenario decomposition
  Safeguard What-If   — Granular CIS safeguard adjustments
```

Plus drill-downs (not in primary nav):
- Theme Detail → Structural Analysis (carries theme context)
- Defense Status → click row → CIS controls expanded
- What-If → click objective → CIS controls expanded

---

## Bugs Fixed During Session

1. **Custom themes not appearing in Top Themes or Risk Landscape** — `activeCustomThemes` state wasn't being updated when user themes were saved. Fixed with a `useEffect` sync + explicit add on save.

2. **Duplicate theme panel in advanced dimensions** — `activeDims` defaulted to `['custom']` which duplicated the main table. Fixed: default to `[]`, exclude 'custom' from advanced picker entirely.

3. **Custom themes not appearing in What-If Report** — `themeImpacts` only iterated `Object.keys(CUSTOM_THEMES)`. Fixed: merged with `userThemes.map(t => t.name)`.

---

## GQIM Alignment

The screen architecture maps to the CISO profile's report types:

| Screen | CISO Report Type | CISO Goal |
|---|---|---|
| Top Themes | RT1: Quarterly Risk Posture | Goal 1: Know the landscape |
| Risk Landscape | RT1 (visual layer) | Goal 1 |
| Theme Detail | RT1 (per-theme detail) | Goal 1 |
| Defense Status | RT2: Program Effectiveness | Goal 4: Is the program working? |
| Controls × Themes | (cross-reference, serves RT2 + RT3) | Goals 2, 4 |
| What-If | RT3: Investment Prioritization | Goal 2: Direct resources |
| Structural Analysis | RT3 (deep analytical layer) | Goal 2 |

Report Types 4 (Regulatory), 5 (Ad-Hoc Assessment), and 6 (Coverage & Confidence) are not yet represented in the demo.

---

## Decision Framework Alignment

The What-If Report operationalizes Decision Framework comparisons 5–9:
- Comparison 5 (where is risk coming from?) — objective-level attribution
- Comparison 7 (how much improvement at best?) — slider to see max reduction
- Comparison 9 (which option is best?) — compare positions by delta

The reporting layer's theme views operationalize comparisons 1–4:
- Comparison 1 (how much risk?) — Top Themes ranked values
- Comparison 3 (more or less than expected?) — QoQ change toggle
- Comparison 4 (more or less than acceptable?) — tolerance threshold on Risk Landscape

---

## What's Not Done / Known Gaps

### Missing Screens
- No "Trends over time" view (RT2 needs this — Q4.2, Q4.3)
- No regulatory/compliance view (RT4)
- No "What about X?" rapid assessment view (RT5)
- No coverage/confidence assessment (RT6)
- No indicator form switching (Annualized / Exceedance / Ranking — Axiom 5)

### UX Issues Still Open
- Screens still feel somewhat cluttered — JW's "minimum content per mission" principle needs another pass
- The nav bar has many tabs — may need grouping or progressive disclosure
- The Landing page needs updating to reflect the current Reporting/Analyst architecture
- The ThemeBuilder instructions are verbose

### Data/Model Gaps
- Risk quantities are simulated — no real estimation data
- CIS mappings are representative, not production quality (30 mappings across 10 objectives)
- No vocabulary hierarchy search surfaced in the UI (Priority 2 feature exists in controlModel.js but isn't used)
- The control model doesn't yet feed back into the existing views' sF/sM values in all cases

### Terminology Consistency
- Some components may still have stale terminology from earlier passes
- The `terminology.js` SCREENS descriptions may not match current screen content after restructuring

---

## File Inventory (Current State)

```
/top-risk-report/src/
  App.jsx                    — Main app, 2-layer nav, shared state
  controlModel.js            — 10 objectives, 30 CIS mappings, computation chain
  positionWhatIf.js          — Position-level translation, CIS analytics, matrix builder
  terminology.js             — All user-facing labels (label/formal/tip)
  data.js                    — 22 scenarios, vocabulary bindings, theme definitions
  styles.css                 — Original styles
  navStyles.css              — Navigation layer styles
  main.jsx                   — Entry point
  components/
    Landing.jsx              — System overview / entry point
    ThemeRanked.jsx           — Top Themes report (with CIS dimension)
    ThemeScatter.jsx          — Risk Landscape scatter
    ThemeDetail.jsx           — One-pager theme report
    CycleGapDashboard.jsx     — Defense Status heatmap
    ControlThemeMatrix.jsx    — Controls × Themes cross-reference (new)
    WhatIfReport.jsx          — Position-level what-if (new)
    ThemeDeepDive.jsx         — Structural analysis drill-down
    ControlExplorer.jsx       — Safeguard-level what-if (analyst)
    ScenarioPortfolio.jsx     — All scenarios table
    ThemeBuilder.jsx          — Custom theme builder
    HelpPanel.jsx             — ScreenHeader, HelpPanel, Tip, Legend
    PatchingPrioritization.jsx — Orphaned (not in nav, to be removed)
```

---

## Key Design Principles Established

1. **Three-layer separation:** Reporting / Analyst / Configuration. Each layer has its own what-if grain.
2. **Task-oriented screens:** Each screen answers one question a specific user would ask.
3. **CIS controls are first-class:** Visible as a rankable dimension, in their own cross-reference view, and expandable in every relevant context.
4. **Clean terminology by default:** No internal jargon in user-facing labels. Formal terms available for future toggle.
5. **Progressive disclosure:** Summary views answer the task question. Structural detail is one click away, never in the way.
6. **Same baseline, many views:** The NWS analogy — measure once, report many times. Every view is a different cut through the same 22-scenario baseline.
7. **The boundary test:** "Would a CISO open this screen?" determines Reporting vs. Analyst placement.

---

*Session notes written 2026-03-22. These should be reviewed against the project's formal documentation (REPORT-DELIVERY.md, DECISION-FRAMEWORK.md, DELIVERY-OPERATIONS.md) and any findings promoted to the appropriate documents via the update-documentation skill.*
