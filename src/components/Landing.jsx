import { SCREENS, DEFENSE_CYCLE, ATTACK, CONCEPTS } from '../terminology.js';

export default function Landing({ onNavigate }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 28, paddingTop: 12 }}>
        <div style={{
          fontSize: 9, letterSpacing: '4px', textTransform: 'uppercase',
          color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6,
        }}>
          Interactive Demonstration
        </div>
        <h2 style={{
          fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700,
          color: 'var(--navy)', letterSpacing: '-0.3px', marginBottom: 8,
        }}>
          Three Decisions That Drive Cybersecurity Investment
        </h2>
        <p style={{
          fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)',
          lineHeight: 1.7, maxWidth: 640, margin: '0 auto',
        }}>
          Every security program faces the same three questions, in the same order.
          This system answers each one with numbers that trace through structure —
          from controls, through defensive positions, to dollar exposure.
        </p>
      </div>

      {/* The cascade — three decision types */}
      <div style={{ marginBottom: 28 }}>
        {[
          {
            number: '1',
            title: 'What should we worry about?',
            subtitle: 'Risk Position — Strategic assessment',
            color: 'var(--navy)',
            bg: 'var(--blue-bg)',
            borderColor: '#378ADD',
            description: 'Start here. The quarterly forecast shows where risk concentrates, what exceeds tolerance, and what changed since last quarter. This is what goes to the board.',
            output: 'Thresholds, priorities, and the decision: are current operations sufficient — or do we need to act?',
            tab: 'forecast',
            tabLabel: 'Open Forecast Summary →',
            views: [
              { label: 'Forecast Summary', desc: 'Big-picture numbers, threshold breaches, escalation triggers', tab: 'forecast' },
              { label: 'Concentrations', desc: 'Where risk accumulates — ranked by any vocabulary dimension', tab: 'ranked' },
              { label: 'Landscape', desc: 'Visual positioning — likelihood vs. impact against tolerance', tab: 'scatter' },
            ],
            arrow: true,
          },
          {
            number: '2',
            title: 'What do we do first?',
            subtitle: 'Work Priority — Two workstreams, one framework',
            color: '#1D9E75',
            bg: 'var(--teal-bg)',
            borderColor: '#1D9E75',
            description: 'If Type #1 says "we need to act" — address both strategic gaps and tactical vulnerabilities. Control Gap Management ranks capability improvements. Vulnerability Management ranks specific conditions to remediate. Both use the same structural model and efficiency metric.',
            output: 'Two prioritized queues: strategic improvements to defensive capability, and tactical vulnerability remediations — each ranked by risk reduction per effort.',
            tab: 'actions',
            tabLabel: 'Open Control Gaps →',
            views: [
              { label: 'Control Gaps', desc: 'Strategic: improve S/E/A/Ach cycle quality at specific positions', tab: 'actions' },
              { label: 'Vulnerabilities', desc: 'Tactical: remediate specific CVEs and conditions from the environment', tab: 'vulnqueue' },
              { label: 'Performance', desc: 'Dimension × phase matrix — the structural detail behind both queues', tab: 'performance' },
            ],
            arrow: true,
          },
          {
            number: '3',
            title: 'What new investment do we need?',
            subtitle: 'Investment Analysis — When existing resources aren\'t enough',
            color: '#D85A30',
            bg: 'var(--coral-bg)',
            borderColor: '#D85A30',
            description: 'Only reach for this when Type #2 shows that optimizing existing resources isn\'t sufficient. Compare investment options side by side: cost, risk reduction, ROI, and whether it achieves tolerance.',
            output: 'A business case: options compared, costs quantified, and the structural floor made visible — what investment can fix vs. what must be accepted.',
            tab: 'invest',
            tabLabel: 'Open Investment Comparison →',
            views: [
              { label: 'Compare Options', desc: 'Define investment scenarios, compare risk reduction vs. cost', tab: 'invest' },
              { label: 'Control Value', desc: 'Cost efficiency of current controls — is what we\'re paying worth it?', tab: 'ctmatrix' },
            ],
            arrow: false,
          },
        ].map((type, idx) => (
          <div key={type.number}>
            <div style={{
              background: type.bg, border: `1px solid ${type.borderColor}33`,
              borderLeft: `4px solid ${type.color}`,
              borderRadius: 3, padding: '18px 22px', marginBottom: 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%', background: type.color,
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, flexShrink: 0,
                    }}>
                      {type.number}
                    </span>
                    <div>
                      <div style={{
                        fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: type.color,
                      }}>
                        {type.title}
                      </div>
                      <div style={{
                        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 1,
                      }}>
                        {type.subtitle}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.7, color: 'var(--text)',
                    marginBottom: 8, maxWidth: 560,
                  }}>
                    {type.description}
                  </div>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)',
                    fontStyle: 'italic', lineHeight: 1.5,
                  }}>
                    <strong>Output:</strong> {type.output}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 16 }}>
                  {type.views.map(v => (
                    <button key={v.tab} onClick={() => onNavigate(v.tab)}
                      style={{
                        background: 'rgba(255,255,255,0.6)', border: `1px solid ${type.borderColor}33`,
                        borderRadius: 3, padding: '6px 12px', cursor: 'pointer',
                        textAlign: 'left', fontFamily: 'var(--mono)', transition: 'all 0.12s',
                        minWidth: 200,
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, color: type.color }}>{v.label}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {type.arrow && (
              <div style={{
                textAlign: 'center', padding: '4px 0', fontFamily: 'var(--mono)',
                fontSize: 10, color: 'var(--text-dim)',
              }}>
                <span style={{ fontSize: 14, display: 'block', lineHeight: 1 }}>↓</span>
                <span style={{ fontSize: 9, fontStyle: 'italic' }}>
                  {idx === 0 ? 'If current operations aren\'t sufficient...' : 'If existing resources aren\'t enough...'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* What makes this different */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
        padding: '16px 20px', marginBottom: 20,
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
          letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)',
          marginBottom: 10,
        }}>
          What makes this different from traditional GRC
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, lineHeight: 1.7, color: 'var(--text)' }}>
            <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Enhanced traditional reports</div>
            The quarterly board summary, risk register, and regulatory package still exist — but now every number
            traces through a structural chain. When asked "why this number?" the answer is "click through the chain,"
            not "we had a meeting."
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, lineHeight: 1.7, color: 'var(--text)' }}>
            <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>New capabilities</div>
            The Control Gap and Vulnerability queues, Investment Comparison, and CVE Assessment are things traditional GRC
            <em> cannot produce</em>. They require structural decomposition — knowing which controls reduce which
            conjunctions in which scenarios — that only the formal model provides.
          </div>
        </div>
      </div>

      {/* Analyst workbench + CVE assessment */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20,
      }}>
        <button onClick={() => onNavigate('portfolio')}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 3, padding: '14px 16px', cursor: 'pointer',
            textAlign: 'left', transition: 'all 0.12s', borderLeft: '3px solid #8b5cf6',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
        >
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: '#8b5cf6', marginBottom: 2 }}>
            Scenario Portfolio
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            The 22 baseline scenarios and their risk quantities.
          </div>
        </button>
        <button onClick={() => onNavigate('builder')}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 3, padding: '14px 16px', cursor: 'pointer',
            textAlign: 'left', transition: 'all 0.12s', borderLeft: '3px solid #8b5cf6',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
        >
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: '#8b5cf6', marginBottom: 2 }}>
            Theme Builder
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Build custom risk themes from structural building blocks.
          </div>
        </button>
        <button onClick={() => onNavigate('cveassess')}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 3, padding: '14px 16px', cursor: 'pointer',
            textAlign: 'left', transition: 'all 0.12s', borderLeft: '3px solid var(--amber)',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
        >
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--amber)', marginBottom: 2 }}>
            CVE Assessment
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Map new vulnerabilities to the model. See impact, generate remediation priorities.
          </div>
        </button>
      </div>

      {/* Framework connections */}
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)',
        lineHeight: 1.7, textAlign: 'center', marginBottom: 8,
      }}>
        Built on: MITRE ATT&CK (attack methods) · CIS Controls v8.1 (security practices) · NIST CSF (capability framework) · FAIR-compatible quantities
      </div>

      <div style={{
        textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9,
        color: 'var(--text-dim)', lineHeight: 1.6,
      }}>
        22 real attack scenarios with simulated financial quantities.
        30 CIS Controls v8.1 practices mapped to 10 defensive positions.
        12 demo CVEs with simulated impact profiles.
        <br />
        <strong>Demonstration data — representative mappings, not production quality.</strong>
      </div>
    </div>
  );
}
