import { executeDecisionInputRequest } from "../execution/sdk";

describe("replay system", () => {
  test("replay should produce same token", () => {
    const input = {
      system_data: {
        isApproved: true,
        hasNewCommitsAfterApproval: false,
      },
    };

    const result1 = executeDecisionInputRequest({
      intent: "pr_merge_safety",
      intent_version: "v1",
      input: input as any,
    });

    const result2 = executeDecisionInputRequest({
      intent: "pr_merge_safety",
      intent_version: "v1",
      input: input as any,
    });

    expect(result1.decision_token).toBe(result2.decision_token);
  });
});