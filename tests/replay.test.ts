import { replayDecisionEvent } from "../core/replay";
import { executeDecisionInputRequest } from "../execution/sdk";

describe("replay system", () => {
  test("replay should match original decision", () => {
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

    const replay = replayDecisionEvent({
      intent: result.intent,
      intent_version: result.intent_version,
      decision_input: result.decision_input,
      decision_result: result.decision_result,
    });

    expect(replay.is_match).toBe(true);
  });
});