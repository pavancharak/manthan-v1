import { execute } from "../core/engine";
import { loadIntent } from "../core/intentLoader";

// --------------------------------------
// CONFIG
// --------------------------------------

const intent = "pr_merge_safety";
const version = "v1";

// --------------------------------------
// GENERATOR
// --------------------------------------

function getValues(type: string) {
  if (type === "boolean") return [true, false];
  if (type === "number") return [0, 10000, 10001];
  if (type === "string") return ["", "US", "IN"];
  return [];
}

function generateInputs(fields: Record<string, string>) {
  const keys = Object.keys(fields);

  function helper(index: number, current: any, results: any[]) {
    if (index === keys.length) {
      results.push({
        system_data: { ...current },
      });
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

// --------------------------------------
// VERIFY SYSTEM
// --------------------------------------

function verify() {
  const { schema, ruleSet } = loadIntent(intent, version);

  const inputs = generateInputs(schema.system_fields);

  const ruleUsage = new Set<string>();

  console.log(`🔍 Verifying intent: ${intent}@${version}`);
  console.log(`Total inputs: ${inputs.length}`);

  inputs.forEach((input) => {
    const result = execute(intent, input, schema, ruleSet);

    // determinism check
    const result2 = execute(intent, input, schema, ruleSet);

    if (JSON.stringify(result) !== JSON.stringify(result2)) {
      console.error("❌ NON-DETERMINISM DETECTED", input);
    }

    if (result.rule_id) {
      ruleUsage.add(result.rule_id);
    }
  });

  const allRuleIds = ruleSet.rules.map((r: any) => r.id);

  const unusedRules = allRuleIds.filter((id) => !ruleUsage.has(id));

  if (unusedRules.length > 0) {
    console.error("⚠️ UNUSED RULES:");
    unusedRules.forEach((r: string) => console.error(" -", r));
  } else {
    console.log("✅ All rules covered");
  }

  console.log("✅ Verification complete");
}

// --------------------------------------

verify();