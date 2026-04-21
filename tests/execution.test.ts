import {
  executeDecisionInputRequest,
  executeSignalRequest,
} from "../execution/sdk";
import { handleExecutionApiRequest } from "../execution/api";

describe("execution layer", () => {
  test("decision_input execution", () => {
    const result = executeDecisionInputRequest({
      intent: "pr_merge_safety",
      intent_version: "v1",
      input: {
        system_data: {
          isApproved: true,
          hasNewCommitsAfterApproval: false,
        },
      },
    });

    expect(result.mode).toBe("decision_input");
    expect(result.decision_result.status).toBe("DECIDED");

    if (result.decision_result.status === "DECIDED") {
      expect(result.decision_result.decision).toBe("ALLOW");
    }
  });

  test("signal_batch execution", () => {
    const result = executeSignalRequest({
      intent: "pr_merge_safety",
      intent_version: "v1",
      raw_signal_batch: {
        signal_version: "v1",
        signals: [
          {
            id: "sig-1", // ✅ FIX
            source: "NON_AI",
            namespace: "pr",
            key: "isApproved",
            value: true,
          },
          {
            id: "sig-2", // ✅ FIX
            source: "NON_AI",
            namespace: "pr",
            key: "hasNewCommitsAfterApproval",
            value: false,
          },
        ],
      },
      mappings: [
        {
          source: "NON_AI",
          namespace: "pr",
          key: "isApproved",
          target_field: "isApproved",
        },
        {
          source: "NON_AI",
          namespace: "pr",
          key: "hasNewCommitsAfterApproval",
          target_field: "hasNewCommitsAfterApproval",
        },
      ],
    });

    expect(result.mode).toBe("signal_batch");
    expect(result.decision_result.status).toBe("DECIDED");
  });

  test("API handler works", () => {
    const response = handleExecutionApiRequest({
      mode: "decision_input",
      intent: "pr_merge_safety",
      intent_version: "v1",
      input: {
        system_data: {
          isApproved: false,
          hasNewCommitsAfterApproval: false,
        },
      },
    });

    expect(response.status).toBe(200);
  });
});