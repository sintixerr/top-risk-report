import { useState, useMemo } from 'react';
import { ScreenHeader, Legend } from './HelpPanel.jsx';
import { DEFENSE_CYCLE, ATTACK, fmt } from '../terminology.js';
import { OBJECTIVES } from '../controlModel.js';
import {
  PERFORMANCE_DIMENSIONS, MAX_PERFORMANCE,
  getCellValue, computeRiskFromPerformance, computeMaxPerformanceRisk,
  aggregateRisk,
} from '../performanceModel.js';
import { DATA } from '../data.js';

const P = DEFENSE_CYCLE.phases;
const PHASES = ['see', 'evaluate', 'act', 'achieve'];

// ─── PRE-DEFINED INVESTMENT OPTIONS ───
// Each option is a set of performance cell improvements + a cost
// In production, users would construct these interactively

const INVESTMENT_OPTIONS = [
  {
    id: 'opt-a',
    name: 'Option A: Close Response Gaps',
    description: 'Close the Act (Respond) phase gaps at the three highest-exposure objectives. Focus on automation and playbook development.',
    cost: 320, // $K annual
    improvements: [
      // Lateral Movement: improve Act phase across all dimensions
      ...PERFORMANCE_DIMENSIONS.map(d => ({ objId: 'OBJ-04', dim: d.key, phase: 'act', boost: 25 })),
      // Data Collection: improve Act phase
      ...PERFORMANCE_DIMENSIONS.map(d => ({ objId: 'OBJ-07', dim: d.key, phase: 'act', boost: 20 })),
      // Data Exfiltration: improve Act phase
      ...PERFORMANCE_DIMENSIONS.map(d => ({ objId: 'OBJ-08', dim: d.key, phase: 'act', boost: 20 })),
    ],
  },
  {
    id: 'opt-b',
    name: 'Option B: Strengthen Identity Controls',
    description: 'Comprehensive identity security upgrade: improve all phases at Identity & Trust Entry and Lateral Movement. MFA expansion, PAM deployment, NDR integration.',
    cost: 520, // $K annual
    improvements: [
      // Identity Entry: boost all phases, all dimensions
      ...PERFORMANCE_DIMENSIONS.flatMap(d =>
        PHASES.map(p => ({ objId: 'OBJ-03', dim: d.key, phase: p, boost: 15 }))
      ),
      // Lateral Movement: boost all phases, all dimensions
      ...PERFORMANCE_DIMENSIONS.flatMap(d =>
        PHASES.map(p => ({ objId: 'OBJ-04', dim: d.key, phase: p, boost: 12 }))
      ),
    ],
  },
  {
    id: 'opt-c',
    name: 'Option C: Full Resilience Program',
    description: 'Invest across all objectives in the Resilience dimension — immutable backups, redundant paths, fail-closed architecture, adversarial testing. The "survive anything" option.',
    cost: 870, // $K annual
    improvements: [
      // All objectives: boost Resilience dimension across all phases
      ...OBJECTIVES.flatMap(obj =>
        PHASES.map(p => ({ objId: obj.id, dim: 'resilience', phase: p, boost: 20 }))
      ),
      // Also boost Disruption & Destruction specifically (recovery focus)
      ...PERFORMANCE_DIMENSIONS.flatMap(d =>
        PHASES.map(p => ({ objId: 'OBJ-06', dim: d.key, phase: p, boost: 10 }))
      ),
    ],
  },
];

function buildOverridesFromOption(option) {
  const overrides = {};
  option.improvements.forEach(imp => {
    const key = `${imp.objId}:${imp.dim}:${imp.phase}`;
    const current = getCellValue(imp.objId, imp.dim, imp.phase, {});
    const maxPerf = MAX_PERFORMANCE[imp.objId] || 85;
    overrides[key] = Math.min(maxPerf, current + imp.boost);
  });
  return overrides;
}

function OptionCard({ option, baselineRisk, maxRisk, threshold, isSelected, onSelect }) {
  const overrides = useMemo(() => buildOverridesFromOption(option), [option]);
  const improvedScenarios = useMemo(() => computeRiskFromPerformance(DATA, overrides), [overrides]);
  const improvedRisk = useMemo(() => aggregateRisk(improvedScenarios), [improvedScenarios]);

  const reduction = baselineRisk.rALE - improvedRisk.rALE;
  const reductionPct = baselineRisk.rALE > 0 ? (reduction / baselineRisk.rALE) * 100 : 0;
  const roi = option.cost > 0 ? (reduction * 1000 / option.cost) : 0; // $M reduction per $K cost
  const belowThreshold = improvedRisk.rALE < threshold;
  const gapFromBest = improvedRisk.rALE - maxRisk.rALE;
  const gapFromThreshold = improvedRisk.rALE - threshold;

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? 'var(--bg-surface)' : 'var(--bg-card)',
        border: isSelected ? '2px solid var(--navy)' : '1px solid var(--border)',
        borderRadius: 3, padding: '16px 18px', cursor: 'pointer',
        fontFamily: 'var(--mono)', transition: 'all 0.12s',
        flex: 1,
      }}>
      {/* Header */}
      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--navy)', marginBottom: 4 }}>
        {option.name}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
        {option.description}
      </div>

      {/* Key numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 3, padding: '8px 10px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 8, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>Annual cost</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>${option.cost}K</div>
        </div>
        <div style={{ background: 'var(--bg-card)', borderRadius: 3, padding: '8px 10px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 8, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>Risk reduction</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>{fmt.dollars(reduction)}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{reductionPct.toFixed(0)}% of current</div>
        </div>
        <div style={{ background: 'var(--bg-card)', borderRadius: 3, padding: '8px 10px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: 8, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>Return on investment</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: roi > 50 ? 'var(--teal)' : roi > 20 ? 'var(--amber)' : 'var(--coral)' }}>
            {roi.toFixed(0)}×
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>${(reduction * 1000 / option.cost).toFixed(0)} per $1 spent</div>
        </div>
        <div style={{
          background: belowThreshold ? 'var(--teal-bg)' : 'var(--coral-bg)',
          borderRadius: 3, padding: '8px 10px',
          border: `1px solid ${belowThreshold ? '#9FE1CB' : '#FACDCD'}`,
        }}>
          <div style={{ fontSize: 8, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>vs. threshold</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: belowThreshold ? 'var(--teal)' : 'var(--coral)' }}>
            {belowThreshold ? '✓ Below' : '✗ Above'}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
            {belowThreshold
              ? `${fmt.dollars(Math.abs(gapFromThreshold))} below tolerance`
              : `${fmt.dollars(gapFromThreshold)} above tolerance`}
          </div>
        </div>
      </div>

      {/* Residual */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', padding: '6px 0',
        borderTop: '1px solid var(--border-light)', fontSize: 10,
      }}>
        <span style={{ color: 'var(--text-muted)' }}>Residual exposure</span>
        <span style={{ fontWeight: 700, color: 'var(--coral)' }}>{fmt.dollars(improvedRisk.rALE)}</span>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 9,
      }}>
        <span style={{ color: 'var(--text-dim)' }}>Gap from best achievable</span>
        <span style={{ color: gapFromBest > 0.5 ? 'var(--amber)' : 'var(--teal)' }}>{fmt.dollars(gapFromBest)}</span>
      </div>
    </div>
  );
}

export default function InvestmentComparison({ userThemes = [] }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [threshold, setThreshold] = useState(50);

  const baselineRisk = useMemo(() => aggregateRisk(computeRiskFromPerformance(DATA, {})), []);
  const maxPerformanceRisk = useMemo(() => aggregateRisk(computeMaxPerformanceRisk(DATA)), []);

  const gapFromMax = baselineRisk.rALE - maxPerformanceRisk.rALE;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <ScreenHeader
        title="Investment Scenario Comparison"
        subtitle="Define investment options, compare side by side. Each option maps to specific performance improvements — the system computes risk reduction, ROI, and whether it achieves tolerance."
        help="Each option card represents a set of control performance improvements with an associated annual cost. Risk reduction is computed by applying the improvements to the performance model and recomputing risk through the full propagation chain. ROI compares the risk reduction to the cost. The 'vs. threshold' indicator shows whether the option achieves the organization's tolerance level."
      />

      {/* Context bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16,
        fontFamily: 'var(--mono)',
      }}>
        {[
          { label: 'Current exposure', value: fmt.dollars(baselineRisk.rALE), color: 'var(--coral)' },
          { label: 'Best achievable', value: fmt.dollars(maxPerformanceRisk.rALE), color: 'var(--teal)' },
          { label: 'Maximum reducible', value: fmt.dollars(gapFromMax), sub: 'even with unlimited investment', color: 'var(--navy)' },
          { label: 'Irreducible residual', value: fmt.dollars(maxPerformanceRisk.rALE), sub: 'structural floor — accept or transfer', color: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
            padding: '10px 14px',
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Threshold slider */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3,
        padding: '10px 16px', marginBottom: 16, fontFamily: 'var(--mono)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
          Risk tolerance threshold
        </span>
        <input type="range" min={5} max={200} value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          style={{ flex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', minWidth: 60 }}>
          {fmt.dollars(threshold)}
        </span>
      </div>

      {/* Option cards side by side */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {INVESTMENT_OPTIONS.map(opt => (
          <OptionCard key={opt.id} option={opt}
            baselineRisk={baselineRisk} maxRisk={maxPerformanceRisk}
            threshold={threshold}
            isSelected={selectedOption === opt.id}
            onSelect={() => setSelectedOption(selectedOption === opt.id ? null : opt.id)}
          />
        ))}
      </div>

      {/* Structural floor callout */}
      <div className="callout bg-amber" style={{ marginBottom: 16 }}>
        <div className="callout-title">The structural floor — what investment can't fix</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.7 }}>
          Even with every control performing at its structural maximum, <strong>{fmt.dollars(maxPerformanceRisk.rALE)}</strong> of
          annual exposure remains. This isn't a resource problem — it's a structural one. Some attack steps have inherent advantages
          that no amount of control investment fully eliminates (zero-day exploitation, human susceptibility to novel social engineering,
          encrypted channel abuse for exfiltration).
          <br /><br />
          Exposure above this floor is an <strong>investment problem</strong> — spend more to reduce it.
          Exposure at or below this floor is a <strong>risk acceptance or transfer problem</strong> — decide whether
          to carry it or insure against it. The line between these two decisions is what this view makes visible.
        </div>
      </div>

      {/* Note about option construction */}
      <div className="callout bg-blue" style={{ marginBottom: 16 }}>
        <div className="callout-title">How investment options connect to the control model</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.7 }}>
          Each option is a set of improvements to specific performance cells in the dimension × phase matrix.
          "Close Response Gaps" improves the Respond phase at high-exposure objectives.
          "Strengthen Identity Controls" improves all phases at identity-related objectives.
          "Full Resilience Program" improves the Resilience dimension across all objectives.
          <br /><br />
          The risk reduction for each option is computed by applying those cell improvements to the performance model,
          recomputing susceptibility for every affected scenario, and summing the portfolio impact.
          This is the same propagation chain the Control Performance view uses — the difference is that here
          you compare multiple improvement sets against each other and against cost.
          <br /><br />
          In production, users would construct options interactively by selecting cells in the Performance grid
          and specifying improvement targets. The pre-defined options here illustrate three different investment philosophies.
        </div>
      </div>

      <div style={{
        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)',
        fontStyle: 'italic', lineHeight: 1.6, textAlign: 'center',
      }}>
        Investment costs and performance improvements are simulated for demonstration.
        Risk reduction is computed from the performance model's propagation chain — the math is real, the inputs are illustrative.
      </div>
    </div>
  );
}
