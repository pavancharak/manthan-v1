import { Schema } from "../core/types";
import { handleExecutionApiRequest } from "../execution/api";
import {
  executeDecisionInputRequest,
  executeSignalRequest,
  ExecutionContext,
} from "../execution/sdk";
import { compileRuleSet } from "../rules/compiler";
import { SignalFieldMapping } from "../signals/mapper";

const sampleSchema: Schema = {
  schema_version: "schema.v1",
  fields: {
    age: { type: "number", required: true },
    country: { type: "string", required: true },
    vip: { type: "boolean", required: false },
  },
};

const compiledRuleSet = compileRuleSet(sampleSchema, {
  rule_version: "rules.v1",
  rules: [
    {
      id: "allow-us",
      group: 1,
      order: 1,
      requires: ["country"],
      condition: { field: "country", operator: "eq", value: "US" },
      outcome: "ALLOW",
    },
    {
      id: "block-minor",
      group: 1,
      order: 2,
      requires: ["age"],
      condition: { field: "age", operator: "lt", value: 18 },
      outcome: "BLOCK",
    },
  ],
});

const mappings: SignalFieldMapping[] = [
  {
    source: "NON_AI",
    namespace: "profile",
    key: "age",
    target_field: "age",
  },
  {
    source: "NON_AI",
    namespace: "profile",
    key: "country",
    target_field: "country",
  },
];

const context: ExecutionContext = {
  schema: sampleSchema,
  rule_set: compiledRuleSet,
  mappings,
};

describe("execution layer", () => {
  test("executes decision_input requests through the SDK", () => {
    const result = executeDecisionInputRequest(context, {
      intent: "manual-review",
      input: { age: 30, country: "US" },
    });

    expect(result.mode).toBe("decision_input");
    expect(result.rule_set.rule_version).toBe("rules.v1");
    expect(result.decision_result.decision).toBe("ALLOW");
    expect(result.decision_result.schema_version).toBe("schema.v1");
    expect(result.decision_result.rule_version).toBe("rules.v1");
  });

  test("executes signal_batch requests through the SDK", () => {
    const result = executeSignalRequest(context, {
      intent: "manual-review",
      raw_signal_batch: {
        signal_version: "signals.v1",
        signals: [
          {
            id: "country-signal",
            source: "NON_AI",
            namespace: "profile",
            key: "country",
            value: "US",
          },
          {
            id: "age-signal",
            source: "NON_AI",
            namespace: "profile",
            key: "age",
            value: 30,
          },
        ],
      },
    });

    expect(result.mode).toBe("signal_batch");
    expect(result.signal_batch.signal_version).toBe("signals.v1");
    expect(result.mapping_result.decision_input).toEqual({
      age: 30,
      country: "US",
    });
    expect(result.decision_result.decision).toBe("ALLOW");
  });

  test("returns api success for decision_input mode", () => {
    const response = handleExecutionApiRequest(context, {
      mode: "decision_input",
      intent: "manual-review",
      input: { age: 16, country: "CA" },
    });

    expect(response.status).toBe(200);
    expect(
      (response.body as { decision_result: { decision: string } }).decision_result
        .decision
    ).toBe("BLOCK");
  });

  test("returns api success for signal_batch mode", () => {
    const response = handleExecutionApiRequest(context, {
      mode: "signal_batch",
      intent: "manual-review",
      raw_signal_batch: {
        signal_version: "signals.v1",
        signals: [
          {
            id: "country-signal",
            source: "NON_AI",
            namespace: "profile",
            key: "country",
            value: "US",
          },
          {
            id: "age-signal",
            source: "NON_AI",
            namespace: "profile",
            key: "age",
            value: 30,
          },
        ],
      },
    });

    expect(response.status).toBe(200);
    expect(
      (response.body as { decision_result: { decision: string } }).decision_result
        .decision
    ).toBe("ALLOW");
  });

  test("returns api validation errors for bad mode", () => {
    const response = handleExecutionApiRequest(context, {
      mode: "unknown",
      intent: "manual-review",
    });

    expect(response).toEqual({
      status: 400,
      body: { error: "invalid_mode" },
    });
  });
});
