// ═══════════════════════════════════════════════════════════════════════════
// Indicator Forms — Three Ways to Express the Same Risk
// ═══════════════════════════════════════════════════════════════════════════
//
// Axiom 5 (F×M independence): The same frequency and magnitude estimates
// support multiple ways of expressing risk without re-estimating.
//
// Three indicator forms for three different executive conversations:
//
// 1. ANNUALIZED EXPECTED LOSS (ALE)
//    "Our ransomware exposure is $67M/year"
//    Used for: budgeting, cost-benefit analysis, investment justification
//    Computation: F × M (already computed everywhere)
//
// 2. LOSS EXCEEDANCE PROBABILITY
//    "There's a 42% chance we exceed $50M in ransomware losses in 3 years"
//    Used for: risk appetite conversations, board-level threshold decisions
//    Computation: Poisson model — P(at least one event with loss > T) over horizon
//
// 3. ORDINAL RANKING
//    "Ransomware is our #2 risk, up from #4 last quarter"
//    Used for: prioritization, trend tracking, executive summaries
//    Computation: Position in sorted list by selected quantity
//
// ═══════════════════════════════════════════════════════════════════════════

export const INDICATOR_FORMS = [
  {
    key: 'ale',
    label: 'Annual Exposure',
    short: 'ALE',
    description: 'Expected annual cost — for budgeting and cost-benefit analysis',
    conversation: 'How much should we budget for this risk?',
  },
  {
    key: 'exceedance',
    label: 'Exceedance Probability',
    short: 'Prob.',
    description: 'Chance of exceeding a loss threshold — for risk appetite decisions',
    conversation: 'How likely are we to exceed our tolerance?',
  },
  {
    key: 'ranking',
    label: 'Ranked Position',
    short: 'Rank',
    description: 'Ordinal position among peers — for prioritization and trending',
    conversation: 'What should we worry about most?',
  },
];

/**
 * Compute loss exceedance probability for a set of scenarios.
 *
 * Model: events arrive as a Poisson process with rate = sum of residual frequencies.
 * Each event has a magnitude drawn from the scenario's rM.
 * P(aggregate loss > threshold in horizon) is approximated using:
 *   - P(at least one event) = 1 - e^(-totalRF * horizon / 3)
 *   - P(single event loss > threshold) = fraction of scenarios whose rM > threshold
 *   - Combined: simplified compound probability
 *
 * For the demo, we use a more intuitive approximation:
 *   P(loss > T) ≈ 1 - e^(-sum of rF_i for scenarios where rM_i > T/3)
 *   The /3 adjusts for partial losses and multi-event aggregation
 *
 * @param {Array} scenarios - enriched scenario objects with rF, rM
 * @param {number} threshold - loss threshold in $M
 * @param {number} horizon - time horizon in years (default 3)
 * @returns {number} probability 0-100
 */
export function computeExceedanceProbability(scenarios, threshold, horizon = 3) {
  if (!scenarios || scenarios.length === 0 || threshold <= 0) return 0;

  // Rate of events that could individually cause losses approaching the threshold
  // An event with rM >= threshold/2 could plausibly contribute to exceeding threshold
  // (either alone or combined with another event in the same period)
  const relevantRate = scenarios
    .filter(s => s.rM >= threshold * 0.3) // scenarios whose magnitude is in the ballpark
    .reduce((sum, s) => sum + s.rF, 0);

  // Also consider aggregate: many small events can sum to exceed threshold
  const totalALE = scenarios.reduce((sum, s) => sum + s.rALE, 0);
  const aggregateRate = totalALE > 0 ? Math.min(totalALE / threshold, 5) : 0;

  // Blended rate: max of event-based and aggregate-based
  const effectiveRate = Math.max(relevantRate, aggregateRate * 0.7);

  // Poisson: P(at least one event in horizon)
  // Adjust frequency: our rF is "events per 3-year period"
  const adjustedRate = effectiveRate * (horizon / 3);
  const probability = (1 - Math.exp(-adjustedRate)) * 100;

  return Math.min(99.9, Math.max(0.1, probability));
}

/**
 * Format a risk value according to the selected indicator form.
 *
 * @param {object} params
 * @param {string} params.form - 'ale', 'exceedance', or 'ranking'
 * @param {number} params.ale - the ALE value
 * @param {number} params.rank - the ordinal rank (1-based)
 * @param {number} params.totalRanked - total items being ranked
 * @param {number} params.exceedanceProb - the exceedance probability (0-100)
 * @returns {string} formatted display value
 */
export function formatIndicator({ form, ale, rank, totalRanked, exceedanceProb }) {
  switch (form) {
    case 'ale':
      return `$${ale.toFixed(1)}M`;
    case 'exceedance':
      if (exceedanceProb === undefined || exceedanceProb === null) return '—';
      return `${exceedanceProb.toFixed(0)}%`;
    case 'ranking':
      if (rank === undefined || rank === null) return '—';
      return `#${rank}${totalRanked ? ` of ${totalRanked}` : ''}`;
    default:
      return `$${ale.toFixed(1)}M`;
  }
}

/**
 * Get the sort value for a row based on indicator form.
 * ALE: sort by dollar value. Exceedance: sort by probability. Ranking: sort by ALE (ranking IS the sort).
 */
export function getIndicatorSortValue(form, item) {
  switch (form) {
    case 'ale': return item.ale ?? item.val ?? 0;
    case 'exceedance': return item.exceedanceProb ?? 0;
    case 'ranking': return item.ale ?? item.val ?? 0;
    default: return item.ale ?? item.val ?? 0;
  }
}

/**
 * Enrich a list of grouped items with indicator form data.
 * Each item should have: { name, val (ALE), scenarios [...] }
 *
 * @param {Array} items - rows from buildDimensionData or similar
 * @param {string} form - indicator form key
 * @param {number} exceedanceThreshold - for exceedance form, the $ threshold
 * @returns {Array} items enriched with ale, exceedanceProb, rank
 */
export function enrichWithIndicatorForms(items, form, exceedanceThreshold = 50) {
  // Compute exceedance for all items
  const enriched = items.map(item => ({
    ...item,
    ale: item.val ?? 0,
    exceedanceProb: computeExceedanceProbability(item.scenarios || [], exceedanceThreshold),
  }));

  // Sort by the relevant indicator to assign ranks
  const sorted = [...enriched].sort((a, b) => {
    const va = getIndicatorSortValue(form, a);
    const vb = getIndicatorSortValue(form, b);
    return Math.abs(vb) - Math.abs(va);
  });

  sorted.forEach((item, i) => { item.rank = i + 1; });

  // Create a map to assign ranks back
  const rankMap = {};
  sorted.forEach(item => { rankMap[item.name] = item.rank; });
  enriched.forEach(item => { item.rank = rankMap[item.name]; });
  enriched.totalRanked = enriched.length;

  return enriched;
}
