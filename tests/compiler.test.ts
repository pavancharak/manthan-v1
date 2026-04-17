import { compileRuleSet } from "../rules/compiler";
import { Schema } from "../core/types";

const sampleSchema: Schema = {
  schema_version: "schema.v1",
  fields: {
    age: { type: "number", required: true },
    country: { type: "string", required: true },
    vip: { type: "boolean", required: false },
  },
};

describe("rule compiler", () => {
  test("compiles and orders rules deterministically", () => {
    const result = compileRuleSet(sampleSchema, {
      rule_version: "rules.v1",
      rules: [
        {
          id: "block-minor",
          group: 2,
          order: 1,
          requires: ["age"],
          condition: { field: "age", operator: "lt", value: 18 },
          outcome: "BLOCK",
        },
        {
          id: "allow-us",
          group: 1,
          order: 2,
          requires: ["country"],
          condition: { field: "country", operator: "eq", value: "US" },
          outcome: "ALLOW",
        },
        {
          id: "escalate-vip",
          group: 1,
          order: 1,
          requires: ["vip"],
          condition: { field: "vip", operator: "eq", value: true },
          outcome: "ESCALATE",
        },
      ],
    });

    expect(result.rule_version).toBe("rules.v1");
    expect(result.rules.map((rule) => rule.id)).toEqual([
      "escalate-vip",
      "allow-us",
      "block-minor",
    ]);
  });

  test("rejects condition value type mismatch", () => {
    expect(() =>
      compileRuleSet(sampleSchema, {
        rule_version: "rules.v1",
        rules: [
          {
            id: "bad-type",
            group: 1,
            order: 1,
            condition: { field: "age", operator: "gt", value: "18" },
            outcome: "ALLOW",
          },
        ],
      })
    ).toThrow("Rule bad-type has condition value type mismatch for age");
  });

  test("rejects conflicting rules with same condition and different outcomes", () => {
    expect(() =>
      compileRuleSet(sampleSchema, {
        rule_version: "rules.v1",
        rules: [
          {
            id: "allow-us",
            group: 1,
            order: 1,
            condition: { field: "country", operator: "eq", value: "US" },
            outcome: "ALLOW",
          },
          {
            id: "block-us",
            group: 1,
            order: 2,
            condition: { field: "country", operator: "eq", value: "US" },
            outcome: "BLOCK",
          },
        ],
      })
    ).toThrow("Conflicting rules for country");
  });

  test("rejects duplicate rule ids", () => {
    expect(() =>
      compileRuleSet(sampleSchema, {
        rule_version: "rules.v1",
        rules: [
          {
            id: "duplicate",
            group: 1,
            order: 1,
            condition: { field: "country", operator: "eq", value: "US" },
            outcome: "ALLOW",
          },
          {
            id: "duplicate",
            group: 1,
            order: 2,
            condition: { field: "country", operator: "eq", value: "CA" },
            outcome: "BLOCK",
          },
        ],
      })
    ).toThrow("Duplicate rule id: duplicate");
  });

  test("rejects duplicate group and order slots", () => {
    expect(() =>
      compileRuleSet(sampleSchema, {
        rule_version: "rules.v1",
        rules: [
          {
            id: "rule-a",
            group: 1,
            order: 1,
            condition: { field: "country", operator: "eq", value: "US" },
            outcome: "ALLOW",
          },
          {
            id: "rule-b",
            group: 1,
            order: 1,
            condition: { field: "country", operator: "eq", value: "CA" },
            outcome: "BLOCK",
          },
        ],
      })
    ).toThrow("Duplicate rule order: 1:1");
  });

  test("rejects unknown condition fields", () => {
    expect(() =>
      compileRuleSet(sampleSchema, {
        rule_version: "rules.v1",
        rules: [
          {
            id: "bad-field",
            group: 1,
            order: 1,
            condition: { field: "region", operator: "eq", value: "NA" },
            outcome: "ALLOW",
          },
        ],
      })
    ).toThrow("Rule bad-field references unknown condition field region");
  });

  test("rejects unknown requires fields", () => {
    expect(() =>
      compileRuleSet(sampleSchema, {
        rule_version: "rules.v1",
        rules: [
          {
            id: "bad-requires",
            group: 1,
            order: 1,
            requires: ["region"],
            condition: { field: "country", operator: "eq", value: "US" },
            outcome: "ALLOW",
          },
        ],
      })
    ).toThrow("Rule bad-requires references unknown required field region");
  });

  test("rejects invalid operators", () => {
    expect(() =>
      compileRuleSet(sampleSchema, {
        rule_version: "rules.v1",
        rules: [
          {
            id: "bad-operator",
            group: 1,
            order: 1,
            condition: { field: "country", operator: "neq", value: "US" },
            outcome: "ALLOW",
          },
        ],
      })
    ).toThrow("Rule bad-operator has invalid operator");
  });

  test("rejects invalid outcomes", () => {
    expect(() =>
      compileRuleSet(sampleSchema, {
        rule_version: "rules.v1",
        rules: [
          {
            id: "bad-outcome",
            group: 1,
            order: 1,
            condition: { field: "country", operator: "eq", value: "US" },
            outcome: "PASS",
          },
        ],
      })
    ).toThrow("Rule bad-outcome has invalid outcome");
  });

  // ✅ NEW — SHADOW DETECTION
  test("warns for shadowed rules", () => {
    const result = compileRuleSet(sampleSchema, {
      rule_version: "rules.v1",
      rules: [
        {
          id: "rule-1",
          group: 1,
          order: 1,
          condition: { field: "country", operator: "eq", value: "US" },
          outcome: "ALLOW",
        },
        {
          id: "rule-2",
          group: 1,
          order: 2,
          condition: { field: "country", operator: "eq", value: "US" },
          outcome: "ALLOW",
        },
      ],
    });

    expect(result.warnings).toBeDefined();
    expect(result.warnings!.some((w) => w.includes("shadowed"))).toBe(true);
  });

  // ✅ NEW — COVERAGE GAP DETECTION
  test("warns for missing field coverage", () => {
    const result = compileRuleSet(sampleSchema, {
      rule_version: "rules.v1",
      rules: [
        {
          id: "rule-1",
          group: 1,
          order: 1,
          condition: { field: "country", operator: "eq", value: "US" },
          outcome: "ALLOW",
        },
      ],
    });

    expect(result.warnings).toBeDefined();
    expect(
      result.warnings!.some((w) =>
        w.includes("No rule covers")
      )
    ).toBe(true);
  });
});