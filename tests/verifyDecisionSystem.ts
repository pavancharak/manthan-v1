import { execute } from "../core/engine";
import schema from "../schema/schema.json";
import ruleSet from "../rules/rule_set.json";

// --- value generator ---
function getValues(type: string) {
  if (type === "boolean") return [true, false];
  if (type === "number") return [0, 10000, 10001];
  return [];
}

// --- generate combinations ---
function generateInputs(fields: any) {
  const keys = Object.keys(fields);

  function helper(index: number, current: any, results: any[]) {
    if (index === keys.length) {
      results.push({ ...current });
      return;
    }

    const key = keys[index];
    const values = getValues(fields[key]);

    for (const val of values) {
      current[key] = val;
      helper(index + 1, current, results);
    }
  }

  const results: any[] = [];
  helper(0, {}, results);
  return results;
}

// --- validate result shape ---
function assertValidResult(result: any) {
  if (!result.status) {
    throw new Error("Missing status");
  }

  if (result.status === "DECIDED") {
    if (!["ALLOW", "BLOCK", "ESCALATE"].includes(result.decision)) {
      throw new Error("Invalid outcome");
    }
  }
}

// --- determinism check ---
function assertDeterministic(input: any) {
  const r1 = execute("test", input, schema as any, ruleSet as any);
  const r2 = execute("test", input, schema as any, ruleSet as any);

  if (JSON.stringify(r1) !== JSON.stringify(r2)) {
    throw new Error("Non-deterministic result");
  }

  return r1;
}

// --- main test runner ---
function run() {
  const inputs = generateInputs(schema.system_fields);

  console.log(`Testing ${inputs.length} cases...\n`);

  let passed = 0;

  // 🔥 NEW: track rule usage
  const ruleUsage = new Set<string>();

  for (const input of inputs) {
    try {
      const result = assertDeterministic(input);

      assertValidResult(result);

      if (result.status === "DECIDED") {
        if (!result.decision) {
          throw new Error("Missing decision");
        }

        // 🔥 track rule_id
        if (result.rule_id) {
          ruleUsage.add(result.rule_id);
        }
      }

      passed++;
    } catch (err: any) {
      console.error("❌ Failed input:", input);
      console.error("Error:", err.message);
      process.exit(1);
    }
  }

  console.log(`\n✅ All ${passed} tests passed`);

  // 🔥 NEW: coverage validation
  const allRuleIds = ruleSet.rules.map((r: any) => r.id);

  const unusedRules = allRuleIds.filter((id: string) => !ruleUsage.has(id));

  if (unusedRules.length > 0) {
    console.error("\n❌ Unused rules detected:");
    unusedRules.forEach((r) => console.error(" -", r));
    process.exit(1);
  }

  console.log("\n✅ All rules are covered");
}

run();