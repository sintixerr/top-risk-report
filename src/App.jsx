import { useState, useCallback, useEffect } from 'react';
import { CUSTOM_THEMES, loadUserThemes, saveUserThemes } from './data.js';
import ThemeRanked from './components/ThemeRanked.jsx';
import ThemeDetail from './components/ThemeDetail.jsx';
import ThemeScatter from './components/ThemeScatter.jsx';
import ThemeDeepDive from './components/ThemeDeepDive.jsx';
import ThemeBuilder from './components/ThemeBuilder.jsx';
import ScenarioPortfolio from './components/ScenarioPortfolio.jsx';
import PatchingPrioritization from './components/PatchingPrioritization.jsx';
import './styles.css';

const TABS = [
  { key: 'portfolio', label: 'Scenario portfolio' },
  { key: 'builder', label: 'Theme builder' },
  { key: 'ranked', label: 'Themes ranked' },
  { key: 'scatter', label: 'Risk matrix' },
  { key: 'detail', label: 'Theme detail' },
  { key: 'deepdive', label: 'Deep dive' },
  { key: 'patching', label: 'Patching prioritization' },
];

export default function App() {
  const [tab, setTab] = useState('ranked');
  const [selectedTheme, setSelectedTheme] = useState('Ransomware & Extortion');
  const [activeCustomThemes, setActiveCustomThemes] = useState(
    Object.keys(CUSTOM_THEMES)
  );

  // User-created themes with localStorage persistence
  const [userThemes, setUserThemes] = useState(() => loadUserThemes());

  useEffect(() => {
    saveUserThemes(userThemes);
  }, [userThemes]);

  const handleSaveUserTheme = useCallback((theme) => {
    setUserThemes(prev => {
      const existing = prev.findIndex(t => t.id === theme.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = theme;
        return updated;
      }
      return [...prev, theme];
    });
  }, []);

  const handleRemoveUserTheme = useCallback((id) => {
    setUserThemes(prev => prev.filter(t => t.id !== id));
    // Clean up references
    setActiveCustomThemes(prev => {
      const theme = userThemes.find(t => t.id === id);
      return theme ? prev.filter(n => n !== theme.name) : prev;
    });
  }, [userThemes]);

  const navigateToTheme = useCallback((themeName, targetTab = 'detail') => {
    setSelectedTheme(themeName);
    setTab(targetTab);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="header-label">Risk Quantification Service · Baseline Q1 2026</div>
          <h1 className="header-title">Top Risk Theme Report</h1>
        </div>
        <div className="header-right">
          22 scenarios · Simulated quantities<br />
          v3 Design Mockup
        </div>
      </header>
      <div className="header-line" />

      <nav className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'tab-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-label">{t.label}</span>
          </button>
        ))}

        <div className="tab-theme-select">
          <span className="select-label">Active theme</span>
          <select
            value={selectedTheme}
            onChange={e => setSelectedTheme(e.target.value)}
            className="theme-dropdown"
          >
            <optgroup label="Built-in themes">
              {Object.keys(CUSTOM_THEMES).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </optgroup>
            {userThemes.length > 0 && (
              <optgroup label="Your themes">
                {userThemes.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </nav>

      <main className="main-content">
        {tab === 'ranked' && (
          <ThemeRanked
            activeCustomThemes={activeCustomThemes}
            setActiveCustomThemes={setActiveCustomThemes}
            onThemeClick={navigateToTheme}
            userThemes={userThemes}
          />
        )}
        {tab === 'detail' && (
          <ThemeDetail
            themeName={selectedTheme}
            onDeepDive={() => setTab('deepdive')}
            userThemes={userThemes}
          />
        )}
        {tab === 'scatter' && (
          <ThemeScatter
            activeCustomThemes={activeCustomThemes}
            onThemeClick={navigateToTheme}
            userThemes={userThemes}
          />
        )}
        {tab === 'deepdive' && (
          <ThemeDeepDive
            themeName={selectedTheme}
            userThemes={userThemes}
          />
        )}
        {tab === 'portfolio' && (
          <ScenarioPortfolio />
        )}
        {tab === 'patching' && (
          <PatchingPrioritization userThemes={userThemes} />
        )}
        {tab === 'builder' && (
          <ThemeBuilder
            userThemes={userThemes}
            onSave={handleSaveUserTheme}
            onRemove={handleRemoveUserTheme}
            onNavigate={navigateToTheme}
          />
        )}
      </main>

      <footer className="app-footer">
        <span>Top Risk Theme Report · {TABS.find(t => t.key === tab)?.label} · Baseline Q1 2026</span>
        <span>v3 Design Mockup · Session 2026-03-16</span>
      </footer>
    </div>
  );
}
