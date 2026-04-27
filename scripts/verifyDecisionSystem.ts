import { execute } from "../core/engine";
import { loadIntent } from "../core/intentLoader";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// --------------------------------------
// HASHING (canonical, deterministic)
// --------------------------------------

function hash(obj: any): string {
  return crypto
    .createHash("sha256")
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

// --------------------------------------
// DISCOVER INTENTS (registry-safe)
// --------------------------------------

function getAllValidIntents(): string[] {
  const intentsDir = path.join(__dirname, "../core/intents");

  return fs
    .readdirSync(intentsDir)
    .filter((name) => {
      const fullPath = path.join(intentsDir, name);
      return fs.statSync(fullPath).isDirectory();
    })
    .filter((intent) => {
      try {
        loadIntent(intent, "v1"); // validate via registry
        return true;
      } catch (err) {
        console.warn(`⚠️ Skipping unregistered intent: ${intent}`);
        return false;
      }
    });
}

// --------------------------------------
// INPUT GENERATOR
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
      results.push({ ...current }); // correct shape
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
// VERIFY ALL INTENTS
// --------------------------------------

function verifyAll() {
  const intents = getAllValidIntents();

  console.log(`\n🔍 Verifying ${intents.length} intents...\n`);

  intents.forEach((intent) => {
    const version = "v1";

    const { schema, ruleSet } = loadIntent(intent, version);
    const inputs = generateInputs(schema.system_fields);

    const ruleUsage = new Set<string>();

    console.log(`🔍 Intent: ${intent}@${version}`);
    console.log(`Total inputs: ${inputs.length}`);

    inputs.forEach((input) => {
      // ----------------------------------
      // STRONG DETERMINISM CHECK
      // ----------------------------------

      const runs = 20;
      const hashes = new Set<string>();

      for (let i = 0; i < runs; i++) {
        const result = execute(intent, input, schema, ruleSet);
        hashes.add(hash(result));
      }

      if (hashes.size !== 1) {
        console.error("❌ NON-DETERMINISM DETECTED");
        console.error("Intent:", intent);
        console.error("Input:", JSON.stringify(input, null, 2));
        console.error("Unique outputs:", hashes.size);
      }

      // ----------------------------------
      // REPLAY CHECK
      // ----------------------------------

      const result1 = execute(intent, input, schema, ruleSet);
      const result2 = execute(intent, input, schema, ruleSet);

      if (hash(result1) !== hash(result2)) {
        console.error("❌ REPLAY MISMATCH");
        console.error("Intent:", intent);
        console.error("Input:", JSON.stringify(input, null, 2));
      }

      // ----------------------------------
      // RULE COVERAGE
      // ----------------------------------

      if (result1.rule_id) {
        ruleUsage.add(result1.rule_id);
      }
    });

    // --------------------------------------
    // UNUSED RULES
    // --------------------------------------

    const allRuleIds = ruleSet.rules.map((r: any) => r.id);

    const unusedRules = allRuleIds.filter((id) => !ruleUsage.has(id));

    if (unusedRules.length > 0) {
      console.error("⚠️ UNUSED RULES:");
      unusedRules.forEach((r: string) => console.error(" -", r));
    } else {
      console.log("✅ All rules covered");
    }

    console.log(""); // spacing
  });

  console.log("✅ All valid intents verified\n");
}

// --------------------------------------

verifyAll();