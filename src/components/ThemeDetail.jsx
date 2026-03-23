import { useMemo } from 'react';
import { getThemeScenarios } from '../data.js';
import { ScreenHeader, Legend } from './HelpPanel.jsx';
import { SCREENS, QUANTITIES, fmt } from '../terminology.js';
import { computeModelDrivenMetrics } from '../controlModel.js';

export default function ThemeDetail({ themeName, onDeepDive, onDefenseStatus, onWhatIf, userThemes = [], overrides = {} }) {
  const scenarios = useMemo(() => getThemeScenarios(themeName, userThemes), [themeName, userThemes]);
  const enriched = useMemo(() => scenarios.map(s => computeModelDrivenMetrics(s, overrides)), [scenarios, overrides]);

  const agg = useMemo(() => {
    if (enriched.length === 0) return null;
    const iFreq = enriched.reduce((a, s) => a + s.freq, 0);
    const iMag = enriched.reduce((a, s) => a + s.mag, 0);
    const iALE = enriched.reduce((a, s) => a + s.iALE, 0);
    const rFreq = enriched.reduce((a, s) => a + s.rF, 0);
    const rMag = enriched.reduce((a, s) => a + s.rM, 0);
    const rALE = enriched.reduce((a, s) => a + s.rALE, 0);
    const avgSF = enriched.reduce((a, s) => a + s.sF, 0) / enriched.length;
    const avgSM = enriched.reduce((a, s) => a + s.sM, 0) / enriched.length;
    const leverage = iALE > 0 ? (1 - rALE / iALE) * 100 : 0;
    // Simulated QoQ
    const chgRALE = rALE * 0.08;
    const chgDir = chgRALE > 0 ? 'up' : chgRALE < 0 ? 'down' : 'flat';
    return { iFreq, iMag, iALE, rFreq, rMag, rALE, avgSF, avgSM, leverage, chgRALE, chgDir };
  }, [enriched]);

  if (!agg || enriched.length === 0) return <div className="empty-state">No scenarios match theme "{themeName}"</div>;

  const sorted = [...enriched].sort((a, b) => b.rALE - a.rALE);
  const totalRALE = agg.rALE;
  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div style={{ maxWidth: 800 }}>
      <ScreenHeader
        title={themeName}
        subtitle={SCREENS.detail.subtitle}
        help={SCREENS.detail.help}
      />

      {/* ─── Three big numbers ─── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: QUANTITIES.iALE.label, value: fmt.dollars(agg.iALE), sub: 'Before defenses', color: 'var(--navy)' },
          { label: QUANTITIES.cLev.label, value: `${agg.leverage.toFixed(0)}%`, sub: 'of gross exposure eliminated', color: 'var(--teal)' },
          { label: QUANTITIES.rALE.label, value: fmt.dollars(agg.rALE), sub: 'What we carry', color: 'var(--coral)' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 3, padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--mono)',
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Compact grid: Gross / Defense / Net ─── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={thSt}></th>
                <th style={thSt}>{QUANTITIES.freq.label}</th>
                <th style={thSt}>{QUANTITIES.mag.label}</th>
                <th style={thSt}>Annual exposure</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: 'var(--blue-bg)' }}>
                <td style={{ ...tdSt, fontWeight: 700, color: 'var(--navy)' }}>Gross</td>
                <td style={tdSt}>{agg.iFreq.toFixed(1)} /3yr</td>
                <td style={tdSt}>{fmt.dollars(agg.iMag)}</td>
                <td style={{ ...tdSt, fontWeight: 700 }}>{fmt.dollars(agg.iALE)}</td>
              </tr>
              <tr style={{ background: 'var(--teal-bg)' }}>
                <td style={{ ...tdSt, fontWeight: 700, color: 'var(--teal)' }}>Defense</td>
                <td style={tdSt}>{agg.avgSF.toFixed(2)} freq. reduction</td>
                <td style={tdSt}>{agg.avgSM.toFixed(2)} impact reduction</td>
                <td style={{ ...tdSt, fontWeight: 700 }}>{agg.leverage.toFixed(0)}% effective</td>
              </tr>
              <tr style={{ background: 'var(--coral-bg)' }}>
                <td style={{ ...tdSt, fontWeight: 700, color: 'var(--coral)' }}>Net</td>
                <td style={tdSt}>{agg.rFreq.toFixed(1)} /3yr</td>
                <td style={tdSt}>{fmt.dollars(agg.rMag)}</td>
                <td style={{ ...tdSt, fontWeight: 700 }}>{fmt.dollars(agg.rALE)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Scenario contribution bar ─── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-header-title">Scenarios contributing to {fmt.dollars(totalRALE)} net exposure</span>
          <span className="card-header-meta">{sorted.length} scenarios</span>
        </div>
        <div style={{ padding: 12 }}>
          {/* Stacked bar */}
          <div style={{ display: 'flex', height: 24, borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
            {sorted.map((s, i) => {
              const pct = totalRALE > 0 ? (s.rALE / totalRALE) * 100 : 0;
              return (
                <div key={s.id} title={`${s.id} ${s.name}: ${fmt.dollars(s.rALE)} (${pct.toFixed(0)}%)`}
                  style={{
                    width: `${pct}%`, minWidth: pct > 3 ? 0 : 2,
                    background: 'var(--coral)', opacity: Math.max(0.85 - i * 0.12, 0.3),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontFamily: 'var(--mono)', color: '#fff', fontWeight: 600,
                    borderRight: '1px solid rgba(255,255,255,0.3)',
                  }}>
                  {pct > 14 ? `${s.id} · ${fmt.dollars(s.rALE)}` : pct > 7 ? s.id : ''}
                </div>
              );
            })}
          </div>
          {/* Legend rows */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {sorted.map(s => {
              const pct = totalRALE > 0 ? (s.rALE / totalRALE) * 100 : 0;
              return (
                <div key={s.id} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text)' }}>{s.id}</strong> {s.name} — {fmt.dollars(s.rALE)} ({pct.toFixed(0)}%)
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── QoQ callout ─── */}
      <div className="callout bg-amber" style={{ marginBottom: 16 }}>
        <div className="callout-title">Quarter-over-quarter</div>
        Net exposure {agg.chgDir === 'up' ? 'increased' : 'decreased'} {fmt.dollars(Math.abs(agg.chgRALE))} ({(Math.abs(agg.chgRALE) / agg.rALE * 100).toFixed(0)}%)
        this quarter. Threat likelihood rose while defenses improved marginally — the threat environment is outpacing defensive improvements.
      </div>

      {/* ─── Navigation links to deeper views ─── */}
      <div style={{
        display: 'flex', gap: 10, fontFamily: 'var(--mono)',
      }}>
        <button className="btn" onClick={onDeepDive} style={{ flex: 1, padding: '10px 14px', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 11 }}>Structural analysis →</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Cross-scenario drivers, shared vulnerabilities, investment leverage
          </div>
        </button>
        <button className="btn" onClick={onDefenseStatus} style={{ flex: 1, padding: '10px 14px', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 11 }}>Defense status →</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Which defense cycles are complete, where are the gaps
          </div>
        </button>
        <button className="btn" onClick={onWhatIf} style={{ flex: 1, padding: '10px 14px', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 11 }}>What-if analysis →</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Model investment scenarios, see dollar impact across themes
          </div>
        </button>
      </div>

      {hasOverrides && (
        <div style={{ marginTop: 12, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--teal)', fontWeight: 600 }}>
          Risk quantities reflect {Object.keys(overrides).length} control adjustment{Object.keys(overrides).length > 1 ? 's' : ''}.
        </div>
      )}
    </div>
  );
}

const thSt = { padding: '8px 12px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--mono)' };
const tdSt = { padding: '8px 12px', fontSize: 11, textAlign: 'right', fontFamily: 'var(--mono)' };
