import { useMemo } from 'react';
import { ScreenHeader } from './HelpPanel.jsx';
import { DATA, CUSTOM_THEMES } from '../data.js';
import { QUANTITIES, fmt } from '../terminology.js';
import { computeRiskFromPerformance, aggregateRisk } from '../performanceModel.js';

export default function ForecastDashboard({ onNavigate, onThemeClick, userThemes = [] }) {
  const enriched = useMemo(() => computeRiskFromPerformance(DATA, {}), []);
  const portfolio = useMemo(() => aggregateRisk(enriched), [enriched]);

  // Simulated threshold
  const threshold = 50; // $M — would come from risk appetite in production
  const exceedingScenarios = enriched.filter(s => s.rALE > threshold / DATA.length);
  const exceedingThemes = useMemo(() => {
    return Object.entries(CUSTOM_THEMES).map(([name, filterFn]) => {
      const matched = enriched.filter(filterFn);
      const ale = matched.reduce((a, s) => a + s.rALE, 0);
      return { name, ale, count: matched.length };
    }).filter(t => t.ale > threshold * 0.3)
      .sort((a, b) => b.ale - a.ale);
  }, [enriched]);

  // Simulated QoQ
  const qoqDelta = portfolio.rALE * 0.08;
  const qoqPct = 8;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <ScreenHeader
        title="Quarterly Forecast Summary"
        subtitle="Your baseline measurement — 22 scenarios, quarterly re-quantification. Every number traces through structure."
        help="This is the single source of analytical truth. All other views derive from this same data. The escalation section below identifies items that may need Type #2 (work priority) or Type #3 (investment) action."
      />

      {/* Big numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Portfolio Exposure', value: fmt.dollars(portfolio.rALE), sub: 'Net annual expected loss', color: 'var(--coral)' },
          { label: 'Gross Exposure', value: fmt.dollars(portfolio.iALE), sub: 'Before defenses', color: 'var(--navy)' },
          { label: 'Defense Effectiveness', value: fmt.pct(portfolio.cLev), sub: 'of gross exposure eliminated', color: 'var(--teal)' },
          { label: 'Quarter-over-Quarter', value: `+${fmt.dollars(qoqDelta)}`, sub: `+${qoqPct}% vs. last quarter`, color: qoqDelta > 0 ? 'var(--coral)' : 'var(--teal)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
            padding: '14px 18px', fontFamily: 'var(--mono)',
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Top scenarios by exposure */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-header-title">Highest-exposure scenarios</span>
          <button className="btn" onClick={() => onNavigate('portfolio')}
            style={{ fontSize: 9, padding: '3px 10px', marginLeft: 8 }}>
            Show All Scenarios →
          </button>
          <span className="card-header-meta" style={{ marginLeft: 'auto' }}>{DATA.length} in baseline</span>
        </div>
        <div style={{ padding: 0 }}>
          {[...enriched].sort((a, b) => b.rALE - a.rALE).slice(0, 8).map((s, i) => {
            const pct = portfolio.rALE > 0 ? (s.rALE / portfolio.rALE * 100) : 0;
            return (
              <div key={s.id} style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 120px 80px',
                padding: '8px 14px', alignItems: 'center',
                borderBottom: '1px solid var(--border-light)',
                fontFamily: 'var(--mono)', fontSize: 11,
              }}>
                <span style={{ fontWeight: 700, color: 'var(--text-dim)', fontSize: 12 }}>{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{s.id} · {s.objectives?.length || 0} objectives</div>
                </div>
                <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--coral)', opacity: 0.5, borderRadius: 3 }} />
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--coral)' }}>{fmt.dollars(s.rALE)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Escalation trigger */}
      <div style={{
        background: exceedingThemes.length > 0 ? '#FFF3E0' : 'var(--teal-bg)',
        border: `1px solid ${exceedingThemes.length > 0 ? '#BA7517' : '#9FE1CB'}`,
        borderRadius: 3, padding: '16px 20px', marginBottom: 20, fontFamily: 'var(--mono)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: exceedingThemes.length > 0 ? '#633806' : 'var(--teal-dark)',
          marginBottom: 8,
        }}>
          {exceedingThemes.length > 0
            ? `⚠ ${exceedingThemes.length} risk themes warrant action`
            : '✓ All risk themes within tolerance'}
        </div>
        {exceedingThemes.length > 0 ? (
          <>
            <div style={{ fontSize: 11, lineHeight: 1.7, marginBottom: 12 }}>
              These themes have significant exposure relative to the ${threshold}M tolerance level.
              This triggers the next question: can existing resources address this, or is new investment needed?
            </div>
            {exceedingThemes.slice(0, 5).map(t => (
              <div key={t.name} style={{
                display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                borderBottom: '1px solid rgba(186,117,23,0.15)', fontSize: 11,
              }}>
                <span style={{ cursor: 'pointer', color: '#633806', fontWeight: 600 }}
                  onClick={() => onThemeClick(t.name, 'detail')}>
                  {t.name}
                </span>
                <span style={{ fontWeight: 700, color: '#BA7517' }}>{fmt.dollars(t.ale)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn btn-active" style={{ fontSize: 10, padding: '6px 14px', background: '#1D9E75', borderColor: '#1D9E75' }}
                onClick={() => onNavigate('actions')}>
                → Prioritize with existing resources (Type #2)
              </button>
              <button className="btn btn-active" style={{ fontSize: 10, padding: '6px 14px', background: '#D85A30', borderColor: '#D85A30' }}
                onClick={() => onNavigate('invest')}>
                → Evaluate new investment (Type #3)
              </button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, lineHeight: 1.7 }}>
            Current defenses are keeping all tracked risk themes within tolerance.
            Continue monitoring through the quarterly cycle.
          </div>
        )}
      </div>

      {/* Quick navigation to other Type #1 views */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button className="btn" onClick={() => onNavigate('ranked')}
          style={{ padding: '12px 16px', textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: 'var(--navy)' }}>
            Risk Concentrations →
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Where does risk accumulate? Ranked by any vocabulary dimension.
          </div>
        </button>
        <button className="btn" onClick={() => onNavigate('scatter')}
          style={{ padding: '12px 16px', textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: 'var(--navy)' }}>
            Risk Landscape →
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Visual positioning against tolerance. Likelihood vs. impact.
          </div>
        </button>
      </div>

      {/* Data note */}
      <div style={{
        marginTop: 20, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)',
        fontStyle: 'italic', lineHeight: 1.6, textAlign: 'center',
      }}>
        Quarterly baseline Q1 2026. 22 scenarios with simulated risk quantities. CIS Controls v8.1 mapped to 10 defensive positions.
        <br />Demonstration data — representative mappings, not production quality.
      </div>
    </div>
  );
}
