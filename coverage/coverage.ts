export interface CoverageResult {
  usedRules: string[];
  unusedRules: string[];
  escalateCases: {
    reason: string;
    details?: any;
  }[];
  coveragePercent: number; // ✅ NEW
}

export function analyzeCoverage(params: {
  ruleIds: string[];
  usedRules: Set<string>;
  escalateCases: { reason: string; details?: any }[];
}): CoverageResult {
  const { ruleIds, usedRules, escalateCases } = params;

  const used = Array.from(usedRules);
  const unused = ruleIds.filter((id) => !usedRules.has(id));

  // ✅ Coverage calculation
  const coveragePercent =
    ruleIds.length === 0
      ? 100
      : Math.round((used.length / ruleIds.length) * 100);

  return {
    usedRules: used,
    unusedRules: unused,
    escalateCases,
    coveragePercent,
  };
}