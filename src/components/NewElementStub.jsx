import { ScreenHeader } from './HelpPanel.jsx';
import { DEFENSE_CYCLE, ATTACK, fmt } from '../terminology.js';

// ═══════════════════════════════════════════════════════════════════════════
// New Element Analysis — Stub View (Other Element Types)
// ═══════════════════════════════════════════════════════════════════════════
//
// CVE/Vulnerability assessment is now a full screen (VulnerabilityAssessment).
// This stub covers the OTHER element types that follow the same pattern.
// ═══════════════════════════════════════════════════════════════════════════

const ELEMENT_TYPES = [
  {
    key: 'vulnerability',
    label: 'New Vulnerability / CVE',
    icon: '◈',
    color: 'var(--coral)',
    example: 'CVE-2026-XXXXX — Remote code execution in widely deployed library',
    description: 'A new vulnerability is disclosed. Which of our 22 baseline scenarios does it affect? How do risk quantities change? Do priorities reorder?',
    built: true,
    howItWorks: [
      'Select or describe the new vulnerability',
      'System maps it to the closest Weakness Class(es) in the vocabulary',
      'All scenarios containing those weakness classes are identified',
      'Performance penalties are applied to affected control objectives',
      'Risk quantities recompute across all affected scenarios via the standard propagation chain',
      'Remediation action enters the Vulnerability Management queue ranked by efficiency',
      'Output: "This CVE affects N scenarios, shifts portfolio exposure by $X, remediation effort: Y days"',
    ],
  },
  {
    key: 'ttp',
    label: 'New Attack Technique',
    icon: '◎',
    color: 'var(--amber)',
    example: 'Novel AI-assisted phishing technique bypassing current email filtering',
    description: 'A new attack technique emerges. Which scenarios does it enable or strengthen? Which defenses are affected?',
    howItWorks: [
      'Select or describe the new technique',
      'System maps it to the closest TTP Class(es) (e.g., "Social Engineering & Human Manipulation")',
      'All scenarios using those TTP classes are identified',
      'For affected scenarios: the technique may increase inherent frequency or reduce effectiveness of method-blocking controls (Position 2)',
      'Defensive positions traversed by affected scenarios are flagged for review',
      'Output: "This technique strengthens N attack paths, primarily affecting [objectives]. Current defenses at Position 2 may be less effective."',
    ],
  },
  {
    key: 'threat_driver',
    label: 'New Threat Driver',
    icon: '●',
    color: '#791F1F',
    example: 'Geopolitical escalation increases nation-state activity targeting financial infrastructure',
    description: 'A structural or dynamic change in the threat environment. This is a frequency driver — it changes how often scenarios are attempted, not what they look like.',
    howItWorks: [
      'Describe the threat driver change',
      'System identifies which scenarios are affected by motive/objective alignment',
      'Inherent frequency adjusts for affected scenarios (dynamic driver, not structural change)',
      'Risk quantities recompute — this changes ALE without changing the attack structure',
      'Note: this does NOT change scenario composition or control effectiveness — it changes the threat tempo',
      'Output: "This driver increases attempt frequency for N scenarios by ~X%, shifting portfolio exposure by $Y"',
    ],
  },
  {
    key: 'control',
    label: 'New Control / Capability',
    icon: '◉',
    color: 'var(--teal)',
    example: 'Deploying a new NDR (Network Detection & Response) platform',
    description: 'A new defensive capability is being deployed. Which objectives does it serve? Which phase gaps does it close? How much risk does it reduce?',
    howItWorks: [
      'Select or describe the new capability',
      'System maps it to control objective(s) and S/E/A/Ach phases it serves',
      'Performance cells affected are identified in the dimension × phase matrix',
      'For each affected objective: cycle closure status may change (a gap may close)',
      'Risk reduction is computed through the standard propagation chain',
      'Output: "This capability closes the Respond gap at [objective], affecting N scenarios, reducing portfolio exposure by $X"',
    ],
  },
  {
    key: 'asset',
    label: 'New Asset / System',
    icon: '□',
    color: 'var(--navy)',
    example: 'Deploying a new customer-facing API platform',
    description: 'A new system enters the environment. Which existing attack scenarios can now target it? Does it create new attack surface?',
    howItWorks: [
      'Select or describe the new system',
      'System maps it to the closest Asset Class(es) (e.g., "Customer-Facing Web Applications")',
      'All scenarios targeting those asset classes are identified',
      'The new system may increase the target surface for those scenarios',
      'If the system introduces new weakness classes, additional scenarios may become relevant',
      'Output: "This system is exposed to N existing scenarios via [asset classes]. Ensure defensive coverage at [objectives]."',
    ],
  },
  {
    key: 'loss',
    label: 'New Loss Scenario',
    icon: '△',
    color: '#BA7517',
    example: 'New regulatory fine structure changes loss magnitude for data breach scenarios',
    description: 'A change in the loss environment — new regulations, new stakeholder interests, new consequence chains. This changes magnitude, not frequency.',
    howItWorks: [
      'Describe the loss environment change',
      'System identifies which loss scenarios and stakeholder chains are affected',
      'Loss magnitude adjusts for affected scenarios (consequence change, not attack change)',
      'Risk quantities recompute — this changes ALE without changing attack structure or control effectiveness',
      'Output: "This regulatory change increases expected magnitude for N scenarios by ~$X per event, shifting portfolio exposure by $Y"',
    ],
  },
];

export default function NewElementStub({ onNavigate }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <ScreenHeader
        title="New Element Analysis"
        subtitle='Something new has appeared — a vulnerability, a technique, a threat, a system. What does it mean for your risk position? This view answers: "given this change, what moves?"'
        help="This view implements the bespoke escalation assessment from the delivery architecture. When something new appears, the system maps it to existing vocabulary, identifies affected scenarios, recomputes risk quantities, and shows how priorities change. CVE/Vulnerability assessment is fully built — other element types follow the same structural pattern."
      />

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
        padding: '16px 20px', marginBottom: 20, fontFamily: 'var(--mono)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--navy)', marginBottom: 8,
        }}>
          How this connects to the decision cascade
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.7, color: 'var(--text)' }}>
          A new element entering the environment is a <strong>trigger event</strong> — it may change your risk position
          (Type #1), reorder your work priorities (Type #2), or create an investment need that didn't exist before (Type #3).
          This view is the entry point: it answers "what changed?" so you can decide which decision type to engage.
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.7, color: 'var(--text)', marginTop: 8 }}>
          The system handles this through a <strong>four-level escalation</strong>:
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 10,
        }}>
          {[
            { level: '1', label: 'Already covered', desc: 'Existing scenarios account for this — baseline answers the question', color: 'var(--teal-bg)' },
            { level: '2', label: 'Update existing', desc: 'Affected scenarios exist — update their quantities with new data', color: 'var(--blue-bg)' },
            { level: '3', label: 'Compose new', desc: 'New scenario needed — compose from existing vocabulary building blocks', color: 'var(--amber-bg)' },
            { level: '4', label: 'New territory', desc: 'Genuinely novel — may need new vocabulary before composition', color: 'var(--coral-bg)' },
          ].map(l => (
            <div key={l.level} style={{
              background: l.color, borderRadius: 3, padding: '10px 12px',
              fontFamily: 'var(--mono)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Level {l.level}</div>
              <div style={{ fontWeight: 600, fontSize: 10, marginBottom: 4 }}>{l.label}</div>
              <div style={{ fontSize: 9, lineHeight: 1.5, opacity: 0.8 }}>{l.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Element type cards */}
      <div style={{
        fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 700,
        letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)',
        marginBottom: 10,
      }}>
        Element types — what can appear?
      </div>

      {ELEMENT_TYPES.map((el, idx) => (
        <div key={el.key} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
          padding: '16px 20px', marginBottom: 10, fontFamily: 'var(--mono)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: el.color, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{el.icon}</span>
                {el.label}
                {el.built ? (
                  <span style={{
                    fontSize: 8, padding: '2px 6px', borderRadius: 2,
                    background: 'var(--teal-bg)', color: 'var(--teal-dark)', fontWeight: 700,
                    letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
                  }} onClick={() => onNavigate('cveassess')}>
                    Built → Open
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5, maxWidth: 600 }}>
                {el.description}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)', borderRadius: 3, padding: '10px 14px',
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>
              Example
            </div>
            <div style={{ fontSize: 11, color: 'var(--text)', fontStyle: 'italic' }}>
              "{el.example}"
            </div>
          </div>

          <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>
            How it would work
          </div>
          <div style={{ paddingLeft: 4 }}>
            {el.howItWorks.map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, padding: '3px 0', fontSize: 10,
                lineHeight: 1.5, color: 'var(--text)',
                borderBottom: i < el.howItWorks.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <span style={{ fontWeight: 700, color: el.color, minWidth: 16 }}>{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Back navigation */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn" onClick={() => onNavigate('cveassess')}
          style={{ padding: '10px 16px', textAlign: 'left', flex: 1 }}>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: 'var(--amber)' }}>
            ← CVE Assessment
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Map vulnerabilities to the model — the built version of this concept
          </div>
        </button>
        <button className="btn" onClick={() => onNavigate('forecast')}
          style={{ padding: '10px 16px', textAlign: 'left', flex: 1 }}>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, color: 'var(--navy)' }}>
            ← Forecast Summary
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Quarterly baseline — the big picture
          </div>
        </button>
      </div>

      <div style={{
        marginTop: 20, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)',
        fontStyle: 'italic', lineHeight: 1.6, textAlign: 'center',
      }}>
        CVE/Vulnerability assessment is fully built — see the CVE Assessment screen in the Analyst Workbench.
        Other element types follow the same structural pattern and will be built in future sessions.
      </div>
    </div>
  );
}
