export interface CostReport {
  totalRules: number;
  evaluatedRules: number;
  suggestionsGenerated: number;
  simulationCases: number;
  estimatedCostScore: number;
}

export function analyzeCost(params: {
  ruleCount: number;
  evaluatedRules: number;
  suggestions: number;
  simulations: number;
}): CostReport {
  const { ruleCount, evaluatedRules, suggestions, simulations } = params;

  // simple heuristic scoring
  const estimatedCostScore =
    ruleCount * 1 +
    evaluatedRules * 2 +
    suggestions * 1 +
    simulations * 1;

  return {
    totalRules: ruleCount,
    evaluatedRules,
    suggestionsGenerated: suggestions,
    simulationCases: simulations,
    estimatedCostScore,
  };
}