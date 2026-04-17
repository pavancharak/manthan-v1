export type Decision = "ALLOW" | "BLOCK" | "ESCALATE" | "REJECT";

export interface DecisionInput {
[key: string]: any;
}

export interface SchemaField {
type: "string" | "number" | "boolean";
required: boolean;
}

export interface Schema {
schema_version: string;
fields: Record<string, SchemaField>;
}

export interface RuleCondition {
operator: "eq" | "gt" | "lt";
field: string;
value: any;
}

export interface Rule {
id: string;
group: number;
order: number;
requires?: string[];
condition: RuleCondition;
outcome: Decision;
}

export interface RuleSet {
rule_version: string;
rules: Rule[];
}

export interface ValidationResult {
isValid: boolean;
isComplete: boolean;
errors: string[];
missing_fields: string[];
}

export interface DecisionResult {
decision: Decision;
rule_id: string | null;
schema_version: string;
rule_version: string;
explanation: {
reason: string;
details?: any;
};
}
