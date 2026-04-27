import { execute } from "../core/engine";
import { loadIntent } from "../core/intentLoader";
import { createHash } from "crypto";

// stable hash (sorted keys)
function hash(obj: any): string {
  return createHash("sha256")
    .update(JSON.stringify(sortKeys(obj)))
    .digest("hex");
}

function sortKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = sortKeys(obj[key]);
        return acc;
      }, {});
  }
  return obj;
}

describe("Determinism (load + execute)", () => {
  const TEST_CASES = [
    {
      name: "ALLOW safe merge",
      signals: {
        isApproved: true,
        hasNewCommitsAfterApproval: false
      }
    },
    {
      name: "BLOCK unapproved",
      signals: {
        isApproved: false,
        hasNewCommitsAfterApproval: false
      }
    },
    {
      name: "BLOCK new commits after approval",
      signals: {
        isApproved: true,
        hasNewCommitsAfterApproval: true
      }
    }
  ];

  for (const testCase of TEST_CASES) {
    test(`deterministic: ${testCase.name}`, () => {
      const runs = 50;
      const hashes = new Set<string>();

      for (let i = 0; i < runs; i++) {
        // 🔑 KEY CHANGE: load inside loop
        const { schema, ruleSet } = loadIntent("pr_merge_safety", "v1");

        const result = execute(
          "pr_merge_safety",
          testCase.signals,
          schema,
          ruleSet
        );

        hashes.add(hash(result));
      }

      expect(hashes.size).toBe(1);
    });
  }
});