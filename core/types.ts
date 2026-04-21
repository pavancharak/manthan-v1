// -----------------------------
// Decision Input
// -----------------------------
export interface DecisionInput {
  user_input?: Record<string, any>;
  system_data?: Record<string, any>;
}

// -----------------------------
// Schema
// -----------------------------
export interface Schema {
  schema_version: string;
  system_fields: Record<string, "string" | "number" | "boolean">;
}

// -----------------------------
// Rule
// -----------------------------
export interface Rule {
  id: string;
  group: number;
  order: number;
  outcome: "ALLOW" | "BLOCK" | "ESCALATE";
  condition: {
    field: string;
    operator: "eq" | "gt" | "lt";
    value: any;
  };
  requires?: string[];
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