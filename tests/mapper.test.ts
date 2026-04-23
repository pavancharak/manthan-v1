import { mapSignalsToDecisionInput } from "../signals/mapper";

describe("mapper - pr_merge_safety", () => {
  test("maps signals to decision input correctly", () => {
    const schema = {
      system_fields: {
        isApproved: "boolean",
        hasNewCommitsAfterApproval: "boolean",
      },
    } as any;

    const mappings = [
      {
        source: "NON_AI",
        namespace: "pr",
        key: "approved",
        target_field: "isApproved",
      },
      {
        source: "NON_AI",
        namespace: "pr",
        key: "new_commits",
        target_field: "hasNewCommitsAfterApproval",
      },
    ];

    const signal_batch = {
      signals: [
        {
          source: "NON_AI",
          namespace: "pr",
          key: "approved",
          value: true,
        },
        {
          source: "NON_AI",
          namespace: "pr",
          key: "new_commits",
          value: false,
        },
      ],
    } as any;

    const result = mapSignalsToDecisionInput(
      signal_batch,
      schema,
      mappings
    );

    expect(result.decision_input.isApproved).toBe(true);
    expect(result.decision_input.hasNewCommitsAfterApproval).toBe(false);
  });
});