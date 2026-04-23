import { execute } from "../core/engine";
import { loadIntent } from "../core/intentLoader";

describe("decision engine - pr_merge_safety", () => {
  test("ALLOW safe merge", () => {
    const { schema, ruleSet } = loadIntent("pr_merge_safety", "v1");

    const result = execute(
      "pr_merge_safety",
      {
        isApproved: true,
        hasNewCommitsAfterApproval: false
      },
      schema,
      ruleSet
    );

    expect(result.status).toBe("DECIDED");

    if (result.status === "DECIDED") {
      expect(result.decision).toBe("ALLOW");
      expect(result.rule_id).toBe("allow-safe-merge");
    }
  });

  test("BLOCK unapproved PR", () => {
    const { schema, ruleSet } = loadIntent("pr_merge_safety", "v1");

    const result = execute(
      "pr_merge_safety",
      {
        isApproved: false,
        hasNewCommitsAfterApproval: false
      },
      schema,
      ruleSet
    );

    expect(result.status).toBe("DECIDED");

    if (result.status === "DECIDED") {
      expect(result.decision).toBe("BLOCK");
      expect(result.rule_id).toBe("block-unapproved");
    }
  });

  test("BLOCK new commits after approval", () => {
    const { schema, ruleSet } = loadIntent("pr_merge_safety", "v1");

    const result = execute(
      "pr_merge_safety",
      {
        isApproved: true,
        hasNewCommitsAfterApproval: true
      },
      schema,
      ruleSet
    );

    expect(result.status).toBe("DECIDED");

    if (result.status === "DECIDED") {
      expect(result.decision).toBe("BLOCK");
      expect(result.rule_id).toBe("block-new-commits-after-approval");
    }
  });
});