import { DecisionResult, Rule, RuleCondition } from "./types";

export function buildExplanation(
  result: DecisionResult,
  input: Record<string, unknown>
) {
  // ❌ No rule matched
  if (result.status !== "DECIDED" || !result.rule_id) {
    return {
      summary: "No rule matched",
      reason: result.explanation.reason,
      input_snapshot: input,
    };
  }

  const rule = result.explanation.details as Rule;

  // ✅ structured trace
  const trace = (rule as any).__trace;

  const condition = rule.condition;
  const requires = rule.requires;

  // -----------------------------
  // SUMMARY
  // -----------------------------
  let summary = "";

  if (result.decision === "BLOCK") {
    summary = "Action blocked by policy";
  } else if (result.decision === "ALLOW") {
    summary = "Action allowed by policy";
  } else {
    summary = "Action requires escalation";
  }

  // -----------------------------
  // CONDITION STRING
  // -----------------------------
  let reason = explainCondition(condition);

  // -----------------------------
  // REQUIRES
  // -----------------------------
  if (requires) {
    reason += ` AND ${requires.field} ${requires.operator} ${requires.value}`;
  }

  return {
    summary,
    matched_rule: rule.id,
    reason,

    // ✅ NEW: structured tree trace
    trace: formatTraceTree(trace),

    input_snapshot: input,
  };
}

// -----------------------------
// STRUCTURED TRACE FORMATTER
// -----------------------------
function formatTraceTree(trace: any, indent: number = 0): string {
  if (!trace) return "";

  const pad = "  ".repeat(indent);

  // LEAF
  if (trace.type === "LEAF") {
    const symbol = trace.result ? "✔" : "✖";
    return `${pad}${symbol} ${trace.field} ${trace.operator} ${trace.expected} (actual: ${trace.actual})`;
  }

  // AND / OR
  const symbol = trace.result ? "✔" : "✖";

  const header = `${pad}${trace.type} (${symbol})`;

  const children = (trace.children || [])
    .map((c: any) => formatTraceTree(c, indent + 1))
    .join("\n");

  return `${header}\n${children}`;
}

// -----------------------------
// RECURSIVE CONDITION EXPLAINER
// -----------------------------
function explainCondition(condition: RuleCondition): string {
  if ("all" in condition) {
    return "(" + condition.all.map(explainCondition).join(" AND ") + ")";
  }

  if ("any" in condition) {
    return "(" + condition.any.map(explainCondition).join(" OR ") + ")";
  }

  return `${condition.field} ${condition.operator} ${condition.value}`;
}