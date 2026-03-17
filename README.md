# Top Risk Theme Report — v3 Design Mockup

Interactive prototype of the Top Risk Theme Report concept from the v3 risk quantification project. Built with Vite + React. Uses real v2 scenario vocabulary data from the Neo4j knowledge graph with simulated risk quantities.

## Four report element types

| Tab | Element type | What it shows |
|---|---|---|
| **Themes ranked** | Type 2 | Multi-dimensional ranking dashboard. Select vocabulary dimensions (control objectives, TTPs, weaknesses, assets, custom themes). Each dimension ranks its elements by a configurable risk quantity. |
| **Theme detail** | Type 1 | Single theme decomposed into inherent → control → residual across frequency, magnitude, and ALE. Side-by-side current values and quarter-over-quarter change. Scenario contribution bar. |
| **Risk matrix** | Type 3 | Scatterplot of themes on residual frequency × residual magnitude axes. Dot size = ALE. Configurable risk appetite boundary. QoQ movement vectors. Click to navigate. |
| **Deep dive** | Type 4 | Structural decomposition of one theme. Control gaps across scenarios (the key diagnostic). Cross-scenario weaknesses, control objectives, assets, and TTP classes with scenario counts and ALE attribution. Investment signal callout. |

## Local development

```bash
cd top-risk-report
npm install
npm run dev
```

Opens at `http://localhost:5173`. Hot module reload is active.

## Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Deploy to Render.com

1. Push this directory to a GitHub repository
2. In Render, create a new **Static Site**
3. Settings:
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
4. Deploy

## Project structure

```
top-risk-report/
├── index.html                  # Entry point (loads fonts, mounts React)
├── package.json                # Vite + React deps
├── vite.config.js              # Vite config
├── src/
│   ├── main.jsx                # React root mount
│   ├── App.jsx                 # Shell: tabs, theme selector, shared state
│   ├── styles.css              # All styles (no CSS modules, no Tailwind)
│   ├── data.js                 # 22 real v2 scenarios + theme definitions + metrics
│   └── components/
│       ├── ThemeRanked.jsx     # Element Type 2: multi-dimension ranked dashboard
│       ├── ThemeDetail.jsx     # Element Type 1: single theme risk decomposition
│       ├── ThemeScatter.jsx    # Element Type 3: frequency × magnitude scatterplot
│       └── ThemeDeepDive.jsx   # Element Type 4: structural deep dive
```

## Data

All scenario data (IDs, names, TTP bindings, weakness bindings, objective bindings, asset bindings, control gaps) is real — queried from the live v2 Neo4j knowledge graph during session 2026-03-16. Risk quantities (frequency, magnitude, susceptibility) are **simulated** — the v2 database has no quantitative data yet.

Theme definitions are constructable from vocabulary elements:
- **Native themes**: Any vocabulary dimension (TTP class, weakness class, control objective, asset class) automatically defines a theme = all scenarios containing that element
- **Custom themes**: User-defined combinations of vocabulary queries (e.g., "Ransomware & Extortion" = any scenario with "ransomware" or "extortion" in the name)

## Design context

This prototype implements the "Top Risk Theme Report" concept from the v3 project's REPORT-DELIVERY.md design work. It exercises the baseline scenario set's third purpose: **flexible aggregation surface** — the same 22 scenarios sliced along any vocabulary dimension to answer different questions without rebuilding analysis.

The four element types correspond to different CISO report needs:
- Type 2 (ranked) → CISO Goal 1: "Know the current state of the risk landscape"
- Type 1 (detail) → CISO Goal 4: "Demonstrate the program is working"
- Type 3 (scatter) → Board/executive risk appetite conversation
- Type 4 (deep dive) → CISO Goal 2: "Direct resources toward what matters most"

See `v3-design/stakeholder-gqim/CISO.md` and `v3-design/REPORT-DELIVERY.md` in the main project for the full design context.

---

*v3 Design Mockup · Session 2026-03-16*
