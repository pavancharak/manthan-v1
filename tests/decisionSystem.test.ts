import { execute } from "../core/engine";
import { loadIntent } from "../core/intentLoader";

describe("Manthan Decision System", () => {
  const { schema, ruleSet } = loadIntent("pr_merge_safety", "v1");

  const inputs = [
    {
      system_data: {
        isApproved: true,
        hasNewCommitsAfterApproval: false,
      },
    },
    {
      system_data: {
        isApproved: false,
        hasNewCommitsAfterApproval: false,
      },
    },
    {
      system_data: {
        isApproved: true,
        hasNewCommitsAfterApproval: true,
      },
    },
  ];

  test("deterministic decisions", () => {
    inputs.forEach((input) => {
      const r1 = execute("pr_merge_safety", input, schema, ruleSet);
      const r2 = execute("pr_merge_safety", input, schema, ruleSet);

      expect(r1).toEqual(r2);
    });
  });

  test("valid decision states", () => {
    inputs.forEach((input) => {
      const result = execute("pr_merge_safety", input, schema, ruleSet);

      expect(["INVALID", "INCOMPLETE", "DECIDED"]).toContain(result.status);

      if (result.status === "DECIDED") {
        expect(["ALLOW", "BLOCK", "ESCALATE"]).toContain(result.decision);
      }
    });
  });
});