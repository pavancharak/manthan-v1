// -----------------------------
// MOCK INTENT LOADER (ISOLATED TESTING)
// -----------------------------

jest.mock("../core/intentLoader", () => ({
  loadIntent: () => ({
    schema: {
      user_fields: [],
      system_fields: {
        always: "boolean",
      },
      schema_version: "v1",
    },
    ruleSet: {
      rule_version: "v1",
      rules: [
        {
          id: "allow-all",
          group: 1,
          order: 1,
          outcome: "ALLOW",
          condition: {
            field: "always",
            operator: "eq",
            value: true,
          },
        },
      ],
    },
  }),
}));

// -----------------------------

import { executeDecisionInputRequest } from "../execution/sdk";
import { executeWithVerification } from "../execution/gateway";

// -----------------------------
// MOCK EXECUTOR
// -----------------------------

async function mockExecutor(action: string, params: any) {
  return { executed: true, action, params };
}

// -----------------------------
// UNIQUE EVENT ID GENERATOR
// -----------------------------

let eventCounter = 0;

// -----------------------------
// HELPER: VALID REQUEST (TOKEN BASED)
// -----------------------------

function getValidExecutionRequest() {
  eventCounter++;

  const decision = executeDecisionInputRequest({
    intent: "test_intent",
    intent_version: "v1",
    input: {
      system_data: {
        always: true, // ✅ correct shape → rule matches → ALLOW
      },
    } as any,
  });

  return {
    decision_token: decision.decision_token,
    action: "merge_pr",
    event_id: "evt_" + eventCounter,
  };
}

// -----------------------------
// TESTS
// -----------------------------

describe("Security Tests (Token Based)", () => {
  test("should execute valid request", async () => {
    const request = getValidExecutionRequest();

    const result = await executeWithVerification(
      request as any,
      mockExecutor
    );

    expect(result.executed).toBe(true);
  });

  test("should reject tampered token", async () => {
    const request = getValidExecutionRequest();

    // tamper token
    request.decision_token = request.decision_token + "tampered";

    await expect(
      executeWithVerification(request as any, mockExecutor)
    ).rejects.toThrow();
  });

  test("should reject unauthorized action", async () => {
    const request = getValidExecutionRequest();

    request.action = "hacked_action";

    await expect(
      executeWithVerification(request as any, mockExecutor)
    ).rejects.toThrow("Action not allowed");
  });

  test("should reject replay attack", async () => {
    const request = getValidExecutionRequest();

    // first execution → success
    await executeWithVerification(request as any, mockExecutor);

    // second execution → must fail
    await expect(
      executeWithVerification(request as any, mockExecutor)
    ).rejects.toThrow("Replay detected");
  });
});