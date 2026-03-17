import { useState, useCallback } from 'react';
import { CUSTOM_THEMES, DATA } from './data.js';
import ThemeRanked from './components/ThemeRanked.jsx';
import ThemeDetail from './components/ThemeDetail.jsx';
import ThemeScatter from './components/ThemeScatter.jsx';
import ThemeDeepDive from './components/ThemeDeepDive.jsx';
import './styles.css';

const TABS = [
  { key: 'ranked', label: 'Themes ranked' },
  { key: 'detail', label: 'Theme detail' },
  { key: 'scatter', label: 'Risk matrix' },
  { key: 'deepdive', label: 'Deep dive' },
];

export default function App() {
  const [tab, setTab] = useState('ranked');
  const [selectedTheme, setSelectedTheme] = useState('Ransomware & Extortion');
  const [activeCustomThemes, setActiveCustomThemes] = useState([
    'Ransomware & Extortion',
    'Third Party / Supply Chain',
    'Phishing & Social Engineering',
    'Critical Data Exposure',
    'Identity & Credential Exploitation',
  ]);

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
            <optgroup label="Custom themes">
              {Object.keys(CUSTOM_THEMES).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </nav>

      <main className="main-content">
        {tab === 'ranked' && (
          <ThemeRanked
            activeCustomThemes={activeCustomThemes}
            setActiveCustomThemes={setActiveCustomThemes}
            onThemeClick={navigateToTheme}
          />
        )}
        {tab === 'detail' && (
          <ThemeDetail
            themeName={selectedTheme}
            onDeepDive={() => setTab('deepdive')}
          />
        )}
        {tab === 'scatter' && (
          <ThemeScatter
            activeCustomThemes={activeCustomThemes}
            onThemeClick={navigateToTheme}
          />
        )}
        {tab === 'deepdive' && (
          <ThemeDeepDive
            themeName={selectedTheme}
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
