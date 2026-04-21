import { execute } from "../core/engine";

const sampleSchema = {
  schema_version: "schema.v1",
  system_fields: {
    age: "number",
    country: "string",
    vip: "boolean",
  },
};

const sampleRuleSet = {
  rule_version: "rules.v1",
  rules: [
    {
      id: "allow-us-adult",
      group: 1,
      order: 1,
      requires: ["system_data.country"],
      condition: {
        field: "system_data.country",
        operator: "eq",
        value: "US",
      },
      outcome: "ALLOW",
    },
    {
      id: "block-minor",
      group: 1,
      order: 2,
      requires: ["system_data.age"],
      condition: {
        field: "system_data.age",
        operator: "lt",
        value: 18,
      },
      outcome: "BLOCK",
    },
  ],
};

function runDecision(input: any) {
  return execute(
    "test-intent",
    input,
    sampleSchema as any,
    sampleRuleSet as any
  );
}

describe("decision engine", () => {
  // -------------------------
  // INVALID
  // -------------------------
  test("invalid type → INVALID", () => {
    const input = {
      system_data: {
        age: "30",
        country: "US",
      },
    };

    const result = runDecision(input);

    expect(result.status).toBe("INVALID");
  });

  test("extra field → INVALID", () => {
    const input = {
      system_data: {
        age: 30,
        country: "US",
        region: "NA",
      },
    };

    const result = runDecision(input);

    expect(result.status).toBe("INVALID");
  });

  // -------------------------
  // INCOMPLETE
  // -------------------------
  test("missing fields → INCOMPLETE", () => {
    const input = {
      system_data: {
        age: 30,
      },
    };

    const result = runDecision(input);

    expect(result.status).toBe("INCOMPLETE");

    if (result.status === "INCOMPLETE") {
      expect(result.explanation.details.missing_fields).toContain("country");
    }
  });

  // -------------------------
  // ESCALATE (no rule match)
  // -------------------------
  test("no rule match → ESCALATE", () => {
    const input = {
      system_data: {
        age: 30,
        country: "CA",
        vip: false,
      },
    };

    const result = runDecision(input);

    expect(result.status).toBe("DECIDED");

    if (result.status === "DECIDED") {
      expect(result.decision).toBe("ESCALATE");
    }
  });

  // -------------------------
  // ALLOW
  // -------------------------
  test("ALLOW rule match", () => {
    const input = {
      system_data: {
        age: 30,
        country: "US",
        vip: true,
      },
    };

    const result = runDecision(input);

    expect(result.status).toBe("DECIDED");

    if (result.status === "DECIDED") {
      expect(result.decision).toBe("ALLOW");
      expect(result.rule_id).toBe("allow-us-adult");
    }
  });

  // -------------------------
  // BLOCK
  // -------------------------
  test("BLOCK rule match", () => {
    const input = {
      system_data: {
        age: 16,
        country: "CA",
        vip: false,
      },
    };

    const result = runDecision(input);

    expect(result.status).toBe("DECIDED");

    if (result.status === "DECIDED") {
      expect(result.decision).toBe("BLOCK");
      expect(result.rule_id).toBe("block-minor");
    }
  });
});