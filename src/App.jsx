import { useState, useCallback, useEffect, useRef } from 'react';
import { CUSTOM_THEMES, loadUserThemes, saveUserThemes } from './data.js';
import { loadUserCves, saveUserCves } from './cveModel.js';
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
import VulnerabilityAssessment from './components/VulnerabilityAssessment.jsx';
import VulnerabilityQueue from './components/VulnerabilityQueue.jsx';
import './styles.css';

// ═══════════════════════════════════════════════════════════════════════════
// NAV STRUCTURE — Four dropdown menus
// ═══════════════════════════════════════════════════════════════════════════

const TAB_GROUPS = [
  {
    key: 'position',
    label: 'Risk Position',
    sublabel: 'What should we worry about?',
    color: 'var(--navy)',
    tabs: [
      { key: 'forecast', label: 'Forecast Summary', desc: 'Big-picture numbers, thresholds, escalation' },
      { key: 'ranked', label: 'Concentrations', desc: 'Where risk accumulates — any dimension' },
      { key: 'scatter', label: 'Landscape', desc: 'Likelihood vs. impact against tolerance' },
    ],
  },
  {
    key: 'priority',
    label: 'Work Priority',
    sublabel: 'What do we do first?',
    color: '#1D9E75',
    tabs: [
      { key: 'actions', label: 'Control Gaps', desc: 'Strategic: improve cycle quality' },
      { key: 'vulnqueue', label: 'Vulnerabilities', desc: 'Tactical: remediate specific conditions' },
      { key: 'performance', label: 'Performance', desc: 'Dimension × phase structural detail' },
    ],
  },
  {
    key: 'investment',
    label: 'Investment Analysis',
    sublabel: 'What new investment?',
    color: '#D85A30',
    tabs: [
      { key: 'invest', label: 'Compare Options', desc: 'Side-by-side investment scenarios' },
      { key: 'ctmatrix', label: 'Control Value', desc: 'Cost efficiency of current controls' },
    ],
  },
  {
    key: 'workbench',
    label: 'Analyst Workbench',
    sublabel: '',
    color: '#8b5cf6',
    tabs: [
      { key: 'portfolio', label: 'Scenarios', desc: 'All 22 baseline scenarios' },
      { key: 'builder', label: 'Theme Builder', desc: 'Custom risk themes from vocabulary' },
      { key: 'cveassess', label: 'CVE Assessment', desc: 'Map new vulnerabilities to the model' },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);
const HIDDEN_VIEWS = ['detail', 'deepdive', 'gaps', 'whatif', 'controls', 'newelement'];

// ─── Dropdown Menu Component ───
function NavDropdown({ group, currentTab, onSelect, openKey, setOpenKey }) {
  const ref = useRef(null);
  const isOpen = openKey === group.key;
  const isActiveGroup = group.tabs.some(t => t.key === currentTab);
  const activeTab = group.tabs.find(t => t.key === currentTab);

  const toggle = () => setOpenKey(isOpen ? null : group.key);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenKey(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, setOpenKey]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={toggle}
        style={{
          fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
          padding: '6px 14px', borderRadius: 3, cursor: 'pointer',
          border: isActiveGroup ? `2px solid ${group.color}` : '1px solid var(--border)',
          background: isActiveGroup ? `${group.color}0D` : 'var(--bg-card)',
          color: isActiveGroup ? group.color : 'var(--text)',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.12s', whiteSpace: 'nowrap',
        }}
        onMouseOver={e => { if (!isActiveGroup) e.currentTarget.style.borderColor = group.color; }}
        onMouseOut={e => { if (!isActiveGroup) e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <span>{group.label}</span>
        {isActiveGroup && activeTab && (
          <span style={{
            fontSize: 9, opacity: 0.7, fontWeight: 400,
          }}>
            · {activeTab.label}
          </span>
        )}
        <span style={{
          fontSize: 8, transition: 'transform 0.15s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          opacity: 0.5,
        }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderTop: `3px solid ${group.color}`,
          borderRadius: '0 0 4px 4px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100, minWidth: 240, overflow: 'hidden',
        }}>
          {group.sublabel && (
            <div style={{
              padding: '8px 14px 6px', fontFamily: 'var(--mono)', fontSize: 9,
              color: group.color, fontWeight: 600, fontStyle: 'italic',
              borderBottom: '1px solid var(--border-light)',
            }}>
              {group.sublabel}
            </div>
          )}
          {group.tabs.map(t => {
            const isCurrent = currentTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { onSelect(t.key); setOpenKey(null); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--mono)', transition: 'background 0.1s',
                  background: isCurrent ? `${group.color}0D` : 'transparent',
                  borderLeft: isCurrent ? `3px solid ${group.color}` : '3px solid transparent',
                }}
                onMouseOver={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--bg-surface)'; }}
                onMouseOut={e => { if (!isCurrent) e.currentTarget.style.background = isCurrent ? `${group.color}0D` : 'transparent'; }}
              >
                <div style={{
                  fontSize: 11, fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? group.color : 'var(--text)',
                }}>
                  {t.label}
                </div>
                {t.desc && (
                  <div style={{
                    fontSize: 9, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4,
                  }}>
                    {t.desc}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
  const [tab, setTab] = useState('landing');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('Ransomware & Extortion');
  const [activeCustomThemes, setActiveCustomThemes] = useState(
    Object.keys(CUSTOM_THEMES)
  );
  const [controlOverrides, setControlOverrides] = useState({});
  const [userThemes, setUserThemes] = useState(() => loadUserThemes());
  const [userCves, setUserCves] = useState(() => loadUserCves());
  const [performanceTarget, setPerformanceTarget] = useState(null);

  useEffect(() => {
    setActiveCustomThemes(prev => {
      const userNames = userThemes.map(t => t.name);
      const missing = userNames.filter(n => !prev.includes(n));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });
  }, [userThemes]);

  useEffect(() => { saveUserThemes(userThemes); }, [userThemes]);
  useEffect(() => { saveUserCves(userCves); }, [userCves]);

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

  const handleSaveCve = useCallback((cve) => {
    setUserCves(prev => {
      const existing = prev.findIndex(c => c.id === cve.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = cve;
        return updated;
      }
      return [...prev, cve];
    });
  }, []);

  const handleRemoveCve = useCallback((id) => {
    setUserCves(prev => prev.filter(c => c.id !== id));
  }, []);

  const navigateToTheme = useCallback((themeName, targetTab = 'detail') => {
    setSelectedTheme(themeName);
    setTab(targetTab);
  }, []);

  const navigateToPerformance = useCallback((target) => {
    setPerformanceTarget(target);
    setTab('performance');
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

      {/* ═══ DROPDOWN NAV BAR ═══ */}
      <nav className="nav-bar" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 20px',
      }}>
        <button className={`nav-home ${isLanding ? 'nav-home-active' : ''}`}
          onClick={() => setTab('landing')} title="Decision cascade guide">◈</button>

        {TAB_GROUPS.map(group => (
          <NavDropdown
            key={group.key}
            group={group}
            currentTab={tab}
            onSelect={setTab}
            openKey={openDropdown}
            setOpenKey={setOpenDropdown}
          />
        ))}

        {/* Theme selector — appears when in theme-relevant views */}
        {themeViews.includes(tab) && (
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--mono)',
          }}>
            <span style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Theme</span>
            <select value={selectedTheme} onChange={e => setSelectedTheme(e.target.value)}
              style={{
                fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 8px',
                borderRadius: 2, border: '1px solid var(--border)', background: 'var(--bg-card)',
              }}>
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
              if (tab === 'detail' || tab === 'deepdive') setTab('ranked');
              else if (tab === 'gaps' || tab === 'controls' || tab === 'whatif') setTab('performance');
              else if (tab === 'newelement') setTab('cveassess');
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
            {tab === 'newelement' && 'New Element Analysis (Other Types)'}
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
        {isLanding && <Landing onNavigate={setTab} />}

        {tab === 'forecast' && (
          <ForecastDashboard onNavigate={setTab} onThemeClick={navigateToTheme} userThemes={userThemes} />
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

        {tab === 'actions' && (
          <ActionQueue onNavigate={setTab} onNavigateToPerformance={navigateToPerformance}
            onThemeClick={navigateToTheme} userThemes={userThemes} />
        )}
        {tab === 'vulnqueue' && (
          <VulnerabilityQueue userCves={userCves} onNavigate={setTab} />
        )}
        {tab === 'performance' && (
          <PerformanceReport userThemes={userThemes}
            initialTarget={performanceTarget}
            onTargetConsumed={() => setPerformanceTarget(null)} />
        )}

        {tab === 'invest' && <InvestmentComparison userThemes={userThemes} />}
        {tab === 'ctmatrix' && <ControlThemeMatrix userThemes={userThemes} />}

        {tab === 'portfolio' && <ScenarioPortfolio />}
        {tab === 'builder' && (
          <ThemeBuilder userThemes={userThemes}
            onSave={handleSaveUserTheme} onRemove={handleRemoveUserTheme}
            onNavigate={navigateToTheme} />
        )}
        {tab === 'cveassess' && (
          <VulnerabilityAssessment userCves={userCves}
            onSaveCve={handleSaveCve} onRemoveCve={handleRemoveCve} onNavigate={setTab} />
        )}

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
        {tab === 'gaps' && <CycleGapDashboard overrides={controlOverrides} />}
        {tab === 'whatif' && (
          <WhatIfReport overrides={controlOverrides}
            setOverrides={setControlOverrides} userThemes={userThemes} />
        )}
        {tab === 'controls' && (
          <ControlExplorer overrides={controlOverrides}
            setOverrides={setControlOverrides} />
        )}
        {tab === 'newelement' && <NewElementStub onNavigate={setTab} />}
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
