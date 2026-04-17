import { execute } from "../core/engine";
import { DecisionInput, DecisionResult, Rule, Schema } from "../core/types";

type EngineResultContract = DecisionResult & {
  schema_version: string;
  rule_version: string;
  explanation: {
    reason: string;
    details?:
      | string[]
      | Rule
      | {
          missing_fields: string[];
        };
  };
};

const sampleSchema: Schema = {
  schema_version: "schema.v1",
  fields: {
    age: { type: "number", required: true },
    country: { type: "string", required: true },
    vip: { type: "boolean", required: false },
  },
};

const sampleRuleSet = {
  rule_version: "rules.v1",
  rules: [
    {
      id: "allow-us-adult",
      group: 1,
      order: 1,
      requires: ["age", "country"],
      condition: {
        field: "country",
        operator: "eq",
        value: "US",
      },
      outcome: "ALLOW",
    },
    {
      id: "block-minor",
      group: 1,
      order: 2,
      requires: ["age"],
      condition: {
        field: "age",
        operator: "lt",
        value: 18,
      },
      outcome: "BLOCK",
    },
  ] as Rule[],
};

function runDecision(input: DecisionInput): EngineResultContract {
  return execute(
    "test-intent",
    input,
    sampleSchema,
    sampleRuleSet
  ) as EngineResultContract;
}

describe("decision engine", () => {
  describe("REJECT", () => {
    test.each([
      {
        name: "invalid type",
        input: {
          age: "30",
          country: "US",
        } as unknown as DecisionInput,
        expectedErrors: ["Invalid type for age"],
      },
      {
        name: "extra field",
        input: {
          age: 30,
          country: "US",
          region: "NA",
        } as unknown as DecisionInput,
        expectedErrors: ["Unexpected field: region"],
      },
    ])(
      "returns REJECT for $name",
      ({ input, expectedErrors }) => {
        const result = runDecision(input);

        expect(result).toEqual({
          decision: "REJECT",
          rule_id: null,
          schema_version: sampleSchema.schema_version,
          rule_version: sampleRuleSet.rule_version,
          explanation: {
            reason: "invalid_input",
            details: expectedErrors,
          },
        });
      }
    );
  });

  describe("ESCALATE", () => {
    test("returns ESCALATE when required fields are missing", () => {
      const input: DecisionInput = {
        age: 30,
      };

      const result = runDecision(input);

      expect(result.decision).toBe("ESCALATE");
      expect(result.rule_id).toBeNull();
      expect(result.schema_version).toBe(sampleSchema.schema_version);
      expect(result.rule_version).toBe(sampleRuleSet.rule_version);
      expect(result.explanation.reason).toBe("incomplete_input");
      expect(result.explanation.details).toEqual({
        missing_fields: ["country"],
      });
    });

    test("returns ESCALATE when input is valid and complete but no rule matches", () => {
      const input: DecisionInput = {
        age: 30,
        country: "CA",
        vip: false,
      };

      const result = runDecision(input);

      expect(result.decision).toBe("ESCALATE");
      expect(result.rule_id).toBeNull();
      expect(result.schema_version).toBe(sampleSchema.schema_version);
      expect(result.rule_version).toBe(sampleRuleSet.rule_version);
      expect(result.explanation.reason).toBe("no_rule_match");
    });
  });

  describe("rule match outcomes", () => {
    test("returns ALLOW when a matching ALLOW rule is found", () => {
      const input: DecisionInput = {
        age: 30,
        country: "US",
        vip: true,
      };

      const result = runDecision(input);

      expect(result.decision).toBe("ALLOW");
      expect(result.rule_id).toBe("allow-us-adult");
      expect(result.schema_version).toBe(sampleSchema.schema_version);
      expect(result.rule_version).toBe(sampleRuleSet.rule_version);
      expect(result.explanation.reason).toBe("rule_matched");
      expect(result.explanation.details).toEqual(sampleRuleSet.rules[0]);
    });

    test("returns BLOCK when a matching BLOCK rule is found", () => {
      const input: DecisionInput = {
        age: 16,
        country: "CA",
        vip: false,
      };

      const result = runDecision(input);

      expect(result.decision).toBe("BLOCK");
      expect(result.rule_id).toBe("block-minor");
      expect(result.schema_version).toBe(sampleSchema.schema_version);
      expect(result.rule_version).toBe(sampleRuleSet.rule_version);
      expect(result.explanation.reason).toBe("rule_matched");
      expect(result.explanation.details).toEqual(sampleRuleSet.rules[1]);
    });
  });
});
