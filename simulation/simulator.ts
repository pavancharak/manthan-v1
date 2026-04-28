import { executeDecisionInputRequest } from "../execution/sdk";
import { logDecisionEvent } from "../events/logger";
import { analyzeCoverage } from "../coverage/coverage";
import { generateSuggestions } from "../ai/suggestions";
import { analyzeCost } from "../cost/analyzer";

import fs from "fs";
import path from "path";

// --------------------------------------
// TYPES
// --------------------------------------

type IntentConfig = {
  intent: string;
  version: string;
};

type Schema = {
  system_fields: Record<string, "boolean" | "string" | "number">;
};

type Condition =
  | { field: string; operator?: string; value: any }
  | { and: Condition[] }
  | { or: Condition[] };

type Rule = {
  id: string;
  condition: Condition;
};

// --------------------------------------
// LOAD ALL INTENTS
// --------------------------------------

function loadAllIntents(): IntentConfig[] {
  const basePath = path.join(__dirname, "../core/intents");

  const intents: IntentConfig[] = [];

  fs.readdirSync(basePath).forEach((intent) => {
    fs.readdirSync(path.join(basePath, intent)).forEach((version) => {
      intents.push({ intent, version });
    });
  });

  return intents;
}

// --------------------------------------
// GENERATOR (FINAL BALANCED)
// --------------------------------------

function generateInputs(
  schema: Schema,
  rules: Rule[]
): Record<string, any>[] {
  const keys = Object.keys(schema.system_fields);

  function getBase(): Record<string, any> {
    const base: Record<string, any> = {};

    keys.forEach((k) => {
      const t = schema.system_fields[k];

      if (t === "boolean") base[k] = false;
      if (t === "string") base[k] = "";
      if (t === "number") base[k] = 0;
    });

    return base;
  }

  function satisfy(cond: Condition): Record<string, any> {
    const input = getBase();

    if ("field" in cond) {
      const { field, value, operator } = cond;

      if (operator === "gt") input[field] = value + 1;
      else if (operator === "lt") input[field] = value - 1;
      else if (operator === "gte") input[field] = value;
      else if (operator === "lte") input[field] = value;
      else input[field] = value;

      return input;
    }

    if ("and" in cond) {
      cond.and.forEach((c) => {
        if ("field" in c) {
          const { field, value, operator } = c;

          if (operator === "gt") input[field] = value + 1;
          else if (operator === "lt") input[field] = value - 1;
          else input[field] = value;
        }
      });

      return input;
    }

    if ("or" in cond) {
      return satisfy(cond.or[0]);
    }

    return input;
  }

  const cases: Record<string, any>[] = [];

  // --------------------------------------
  // 1. Minimal rule coverage
  // --------------------------------------

  rules.forEach((rule) => {
    cases.push(satisfy(rule.condition));
  });

  // --------------------------------------
  // 🔥 2. Pairwise boolean combinations (critical fix)
  // --------------------------------------

  const boolKeys = keys.filter(
    (k) => schema.system_fields[k] === "boolean"
  );

  for (let i = 0; i < boolKeys.length; i++) {
    for (let j = i + 1; j < boolKeys.length; j++) {
      const input = getBase();

      input[boolKeys[i]] = true;
      input[boolKeys[j]] = true;

      cases.push(input);
    }
  }

  // --------------------------------------
  // Dedup
  // --------------------------------------

  const unique = new Map<string, Record<string, any>>();
  cases.forEach((c) => unique.set(JSON.stringify(c), c));

  return Array.from(unique.values());
}

// --------------------------------------
// RUN SIMULATION
// --------------------------------------

function runSimulation() {
  console.log("🧠 Running OPTIMIZED Multi-Intent Simulation...\n");

  const allIntents = loadAllIntents();

  allIntents.forEach(({ intent, version }) => {
    console.log(`\n🔍 Intent: ${intent}@${version}\n`);

    const schema: Schema = require(`../core/intents/${intent}/${version}/schema.json`);
    const rules: Rule[] = require(`../core/intents/${intent}/${version}/rules.json`).rules;

    const testCases = generateInputs(schema, rules);

    const usedRules = new Set<string>();
    const escalateCases: any[] = [];

    testCases.forEach((input) => {
      const result = executeDecisionInputRequest({
        intent,
        intent_version: version,
        input,
      });

      const decision = result.decision_result;

      logDecisionEvent({
        timestamp: new Date().toISOString(),
        intent,
        decision_input: input,
        decision_result: decision,
        schema_version: version,
        rule_version: version,
      });

      if (decision.status !== "DECIDED") return;

      if (decision.rule_id) {
        usedRules.add(decision.rule_id);
      }

      if (decision.decision === "ESCALATE") {
        escalateCases.push(decision.explanation);
      }
    });

    const coverage = analyzeCoverage({
      ruleIds: rules.map((r: Rule) => r.id),
      usedRules,
      escalateCases,
    });

    console.log("\n📊 COVERAGE");
    console.log(`Coverage: ${coverage.coveragePercent}%`);

    const unused = rules
      .map((r) => r.id)
      .filter((id) => !usedRules.has(id));

    if (unused.length > 0) {
  console.log("❌ Unused Rules:");
  unused.forEach((r) => console.log(" -", r));

  // 🔥 FAIL CI
  process.exitCode = 1;
} else {
  console.log("✅ All rules covered");
}

    const suggestions = generateSuggestions({
      warnings: [],
      escalateCases,
    });

    if (suggestions.length > 0) {
      console.log("\n💡 Suggestions:");
      suggestions.forEach((s) => console.log(`- ${s.message}`));
    }

    const cost = analyzeCost({
      ruleCount: rules.length,
      evaluatedRules: usedRules.size,
      suggestions: suggestions.length,
      simulations: testCases.length,
    });

    console.log("\n💰 Cost:", cost.estimatedCostScore);
  });
}

// --------------------------------------

runSimulation();