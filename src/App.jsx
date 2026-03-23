import { useState, useCallback, useEffect } from 'react';
import { CUSTOM_THEMES, loadUserThemes, saveUserThemes } from './data.js';
import Landing from './components/Landing.jsx';
import ForecastDashboard from './components/ForecastDashboard.jsx';
import ThemeRanked from './components/ThemeRanked.jsx';
import ThemeDetail from './components/ThemeDetail.jsx';
import ThemeScatter from './components/ThemeScatter.jsx';
import ThemeDeepDive from './components/ThemeDeepDive.jsx';
import ThemeBuilder from './components/ThemeBuilder.jsx';
import ScenarioPortfolio from './components/ScenarioPortfolio.jsx';
import ControlExplorer from './components/ControlExplorer.jsx';
import CycleGapDashboard from './components/CycleGapDashboard.jsx';
import WhatIfReport from './components/WhatIfReport.jsx';
import ControlThemeMatrix from './components/ControlThemeMatrix.jsx';
import PerformanceReport from './components/PerformanceReport.jsx';
import ActionQueue from './components/ActionQueue.jsx';
import InvestmentComparison from './components/InvestmentComparison.jsx';
import NewElementStub from './components/NewElementStub.jsx';
import './styles.css';

// ═══════════════════════════════════════════════════════════════════════════
// NAV STRUCTURE — Organized by the three decision types + analyst workbench
// ═══════════════════════════════════════════════════════════════════════════
//
// The cascade: Type #1 → #2 → #3
//   "What should we worry about?" → "What do we do first?" → "What new investment?"
//
// Hidden views (accessible via drill-down, not in nav):
//   detail, deepdive, gaps, whatif, controls, newelement

const TAB_GROUPS = [
  {
    key: 'position',
    label: 'Risk Position',
    sublabel: 'What should we worry about?',
    color: 'var(--navy)',
    tabs: [
      { key: 'forecast', label: 'Forecast' },
      { key: 'ranked', label: 'Concentrations' },
      { key: 'scatter', label: 'Landscape' },
    ],
  },
  {
    key: 'priority',
    label: 'Operational Priority',
    sublabel: 'What do we do first?',
    color: '#1D9E75',
    tabs: [
      { key: 'actions', label: 'Action Queue' },
      { key: 'performance', label: 'Performance' },
    ],
  },
  {
    key: 'investment',
    label: 'Investment Analysis',
    sublabel: 'What new investment?',
    color: '#D85A30',
    tabs: [
      { key: 'invest', label: 'Compare Options' },
      { key: 'ctmatrix', label: 'Control Value' },
    ],
  },
  {
    key: 'workbench',
    label: 'Analyst Workbench',
    sublabel: '',
    color: '#8b5cf6',
    tabs: [
      { key: 'portfolio', label: 'Scenarios' },
      { key: 'builder', label: 'Theme Builder' },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);

// Views accessible via drill-down (not in nav)
const HIDDEN_VIEWS = ['detail', 'deepdive', 'gaps', 'whatif', 'controls', 'newelement'];

export default function App() {
  const [tab, setTab] = useState('landing');
  const [selectedTheme, setSelectedTheme] = useState('Ransomware & Extortion');
  const [activeCustomThemes, setActiveCustomThemes] = useState(
    Object.keys(CUSTOM_THEMES)
  );
  const [controlOverrides, setControlOverrides] = useState({});
  const [userThemes, setUserThemes] = useState(() => loadUserThemes());

  useEffect(() => {
    setActiveCustomThemes(prev => {
      const userNames = userThemes.map(t => t.name);
      const missing = userNames.filter(n => !prev.includes(n));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });
  }, [userThemes]);

  useEffect(() => { saveUserThemes(userThemes); }, [userThemes]);

  const handleSaveUserTheme = useCallback((theme) => {
    setUserThemes(prev => {
      const existing = prev.findIndex(t => t.id === theme.id);
      if (existing >= 0) {
        const updated = [...prev];
        const oldName = updated[existing].name;
        updated[existing] = theme;
        if (oldName !== theme.name) {
          setActiveCustomThemes(act => act.map(n => n === oldName ? theme.name : n));
        }
        return updated;
      }
      return [...prev, theme];
    });
    setActiveCustomThemes(prev => prev.includes(theme.name) ? prev : [...prev, theme.name]);
  }, []);

  const handleRemoveUserTheme = useCallback((id) => {
    setUserThemes(prev => {
      const theme = prev.find(t => t.id === id);
      if (theme) setActiveCustomThemes(act => act.filter(n => n !== theme.name));
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const navigateToTheme = useCallback((themeName, targetTab = 'detail') => {
    setSelectedTheme(themeName);
    setTab(targetTab);
  }, []);

  const activeGroup = TAB_GROUPS.find(g => g.tabs.some(t => t.key === tab));
  const isLanding = tab === 'landing';
  const isHidden = HIDDEN_VIEWS.includes(tab);
  const themeViews = ['ranked', 'detail', 'deepdive', 'scatter'];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="header-label">Risk Quantification Service · Baseline Q1 2026</div>
          <h1 className="header-title">
            <span onClick={() => setTab('landing')} style={{ cursor: 'pointer', transition: 'opacity 0.12s' }}
              onMouseOver={e => { e.currentTarget.style.opacity = '0.7'; }}
              onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}>
              Top Risk Theme Report
            </span>
          </h1>
        </div>
        <div className="header-right">
          <div>22 scenarios · 10 control objectives · 30 CIS controls</div>
          <div>Simulated quantities · v3 Design Demo</div>
        </div>
      </header>
      <div className="header-line" />

      <nav className="nav-bar">
        <button className={`nav-home ${isLanding ? 'nav-home-active' : ''}`}
          onClick={() => setTab('landing')} title="Decision cascade guide">◈</button>

        {TAB_GROUPS.map(group => (
          <div key={group.key} className="nav-group">
            <div className="nav-group-label" style={{ color: group.color }}>
              {group.label}
              {group.sublabel && (
                <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 4, fontSize: 8 }}>
                  {group.sublabel}
                </span>
              )}
            </div>
            <div className="nav-group-tabs">
              {group.tabs.map(t => (
                <button key={t.key}
                  className={`nav-tab ${tab === t.key ? 'nav-tab-active' : ''}`}
                  onClick={() => setTab(t.key)}
                  style={tab === t.key ? { background: group.color, borderColor: group.color } : {}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {themeViews.includes(tab) && (
          <div className="nav-theme-select">
            <span className="select-label">Theme</span>
            <select value={selectedTheme} onChange={e => setSelectedTheme(e.target.value)} className="theme-dropdown">
              <optgroup label="Built-in themes">
                {Object.keys(CUSTOM_THEMES).map(n => <option key={n} value={n}>{n}</option>)}
              </optgroup>
              {userThemes.length > 0 && (
                <optgroup label="Your themes">
                  {userThemes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>
        )}
      </nav>

      {/* Breadcrumb for hidden/drill-down views */}
      {isHidden && (
        <div style={{
          padding: '6px 20px', fontFamily: 'var(--mono)', fontSize: 10,
          color: 'var(--text-muted)', background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ cursor: 'pointer', color: 'var(--navy)', fontWeight: 600 }}
            onClick={() => {
              // Navigate back to the most sensible parent
              if (tab === 'detail' || tab === 'deepdive') setTab('ranked');
              else if (tab === 'gaps' || tab === 'controls' || tab === 'whatif') setTab('performance');
              else if (tab === 'newelement') setTab('actions');
              else setTab('forecast');
            }}>
            ← Back
          </span>
          <span>·</span>
          <span>
            {tab === 'detail' && `Theme Detail: ${selectedTheme}`}
            {tab === 'deepdive' && `Structural Analysis: ${selectedTheme}`}
            {tab === 'gaps' && 'Defense Completeness Dashboard'}
            {tab === 'whatif' && 'Position-Level What-If'}
            {tab === 'controls' && 'Safeguard Explorer'}
            {tab === 'newelement' && 'New Element Analysis'}
          </span>
        </div>
      )}

      {!isLanding && !isHidden && (
        <div className="baseline-indicator">
          <span>Quarterly Baseline Q1 2026</span>
          <span className="baseline-sep">·</span>
          <span>22 attack scenarios</span>
          <span className="baseline-sep">·</span>
          <span>CIS Controls v8.1</span>
          {Object.keys(controlOverrides).length > 0 && (
            <>
              <span className="baseline-sep">·</span>
              <span style={{ color: 'var(--teal)', fontWeight: 600 }}>
                {Object.keys(controlOverrides).length} control{Object.keys(controlOverrides).length > 1 ? 's' : ''} adjusted
              </span>
            </>
          )}
        </div>
      )}

      <main className="main-content">
        {/* ═══ Landing ═══ */}
        {isLanding && <Landing onNavigate={setTab} />}

        {/* ═══ TYPE #1 — RISK POSITION ═══ */}
        {tab === 'forecast' && (
          <ForecastDashboard
            onNavigate={setTab}
            onThemeClick={navigateToTheme}
            userThemes={userThemes}
          />
        )}
        {tab === 'ranked' && (
          <ThemeRanked activeCustomThemes={activeCustomThemes}
            setActiveCustomThemes={setActiveCustomThemes}
            onThemeClick={navigateToTheme} userThemes={userThemes} />
        )}
        {tab === 'scatter' && (
          <ThemeScatter activeCustomThemes={activeCustomThemes}
            onThemeClick={navigateToTheme} userThemes={userThemes} />
        )}

        {/* ═══ TYPE #2 — OPERATIONAL PRIORITY ═══ */}
        {tab === 'actions' && (
          <ActionQueue
            onNavigate={setTab}
            onThemeClick={navigateToTheme}
            userThemes={userThemes}
          />
        )}
        {tab === 'performance' && (
          <PerformanceReport userThemes={userThemes} />
        )}

        {/* ═══ TYPE #3 — INVESTMENT ANALYSIS ═══ */}
        {tab === 'invest' && (
          <InvestmentComparison userThemes={userThemes} />
        )}
        {tab === 'ctmatrix' && (
          <ControlThemeMatrix userThemes={userThemes} />
        )}

        {/* ═══ ANALYST WORKBENCH ═══ */}
        {tab === 'portfolio' && <ScenarioPortfolio />}
        {tab === 'builder' && (
          <ThemeBuilder userThemes={userThemes}
            onSave={handleSaveUserTheme} onRemove={handleRemoveUserTheme}
            onNavigate={navigateToTheme} />
        )}

        {/* ═══ HIDDEN / DRILL-DOWN VIEWS ═══ */}
        {tab === 'detail' && (
          <ThemeDetail themeName={selectedTheme}
            onDeepDive={() => setTab('deepdive')}
            onDefenseStatus={() => setTab('gaps')}
            onWhatIf={() => setTab('whatif')}
            userThemes={userThemes} overrides={controlOverrides} />
        )}
        {tab === 'deepdive' && (
          <ThemeDeepDive themeName={selectedTheme}
            userThemes={userThemes} overrides={controlOverrides} />
        )}
        {tab === 'gaps' && (
          <CycleGapDashboard overrides={controlOverrides} />
        )}
        {tab === 'whatif' && (
          <WhatIfReport overrides={controlOverrides}
            setOverrides={setControlOverrides} userThemes={userThemes} />
        )}
        {tab === 'controls' && (
          <ControlExplorer overrides={controlOverrides}
            setOverrides={setControlOverrides} />
        )}
        {tab === 'newelement' && (
          <NewElementStub onNavigate={setTab} />
        )}
      </main>

      <footer className="app-footer">
        <span>
          Top Risk Theme Report
          {!isLanding && activeGroup && <> · {activeGroup.label} · {ALL_TABS.find(t => t.key === tab)?.label}</>}
          {isHidden && <> · Drill-down view</>}
        </span>
        <span>v3 Design Demo · Three Decision Types</span>
      </footer>
    </div>
  );
}
