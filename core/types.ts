// -----------------------------
// Decision Input
// -----------------------------
export type DecisionInput = Record<string, any>;

// -----------------------------
// Schema
// -----------------------------
export interface Schema {
  schema_version: string;
  system_fields: Record<string, "string" | "number" | "boolean">;
}

// -----------------------------
// Rule Condition (NEW)
// -----------------------------
export type RuleCondition =
  | {
      field: string;
      operator: "eq" | "gt" | "lt";
      value: any;
    }
  | {
      all: RuleCondition[]; // AND
    }
  | {
      any: RuleCondition[]; // OR
    };

// -----------------------------
// Rule
// -----------------------------
export interface Rule {
  id: string;
  group: number;
  order: number;
  outcome: "ALLOW" | "BLOCK" | "ESCALATE";

  // ✅ UPDATED
  condition: RuleCondition;

  requires?: {
    field: string;
    operator: "eq" | "gt" | "lt";
    value: any;
  };
}

// -----------------------------
// Rule Set
// -----------------------------
export interface RuleSet {
  rule_version: string;
  rules: Rule[];
  warnings?: string[];
}

// -----------------------------
// Debug Trace
// -----------------------------
export interface DecisionDebugTrace {
  validation: {
    isValid: boolean;
    errors?: string[];
  };
  completeness: {
    isComplete: boolean;
    missing_fields?: string[];
  };
  evaluation: {
    matched_rule_id: string | null;
    checked_rules: string[];
  };
}

// -----------------------------
// Decision Result (STRICT)
// -----------------------------
export type DecisionResult =
  | {
      status: "INVALID";
      rule_id: null;
      schema_version: string;
      rule_version: string;
      explanation: {
        reason: "invalid_input";
        details: string[];
      };
    }
  | {
      status: "INCOMPLETE";
      rule_id: null;
      schema_version: string;
      rule_version: string;
      explanation: {
        reason: "incomplete_input";
        details: {
          missing_fields: string[];
        };
      };
    }
  | {
      status: "DECIDED";
      decision: "ALLOW" | "BLOCK" | "ESCALATE";
      rule_id: string | null;
      schema_version: string;
      rule_version: string;
      explanation: {
        reason: "rule_matched" | "no_rule_match";
        details?: Rule;
      };
    };

// -----------------------------
// Extended Result (DEBUG SAFE)
// -----------------------------
export type DecisionResultWithDebug = DecisionResult & {
  debug?: DecisionDebugTrace;
};
//
// -----------------------------
// Simple Trace (STEP 1)
// -----------------------------
export interface SimpleTraceItem {
  field: string;
  operator: "eq" | "gt" | "lt";
  expected: any;
  actual: any;
  result: boolean;
}

export type SimpleTrace = SimpleTraceItem[];
//
// -----------------------------
// Structured Trace (NEW)
// -----------------------------
export interface ConditionTrace {
  type: "AND" | "OR" | "LEAF";
  result: boolean;

  field?: string;
  operator?: "eq" | "gt" | "lt";
  expected?: any;
  actual?: any;

  children?: ConditionTrace[];
}