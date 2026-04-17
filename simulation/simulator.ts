import { executeDecisionInputRequest } from "../execution/sdk";
import fs from "fs";
import path from "path";

// Load schema + rules
const schema = require("../schema/schema.json");
const rule_set = require("../rules/rule_set.json");

const context = {
  schema,
  rule_set,
};

// Load test cases
const testFilePath = path.join(__dirname, "test-cases.json");
const raw = fs.readFileSync(testFilePath, "utf-8");

type SimulationCase = {
  name: string;
  input: Record<string, any>;
};

const testCases: SimulationCase[] = JSON.parse(raw);

// 📊 Coverage trackers
const usedRules = new Set<string>();
const escalateReasons: any[] = [];

// 🚨 Shadow Detection
function detectShadowedRules(rule_set: any): string[] {
  const shadowed: string[] = [];
  const rules = rule_set.rules;

  for (let i = 0; i < rules.length; i++) {
    const current = rules[i];

    for (let j = 0; j < i; j++) {
      const prev = rules[j];

      if (
        prev.condition.field === current.condition.field &&
        prev.condition.operator === current.condition.operator &&
        prev.condition.value === current.condition.value
      ) {
        shadowed.push(`${current.id} is shadowed by ${prev.id}`);
        break;
      }
    }
  }

  return shadowed;
}

// 🚨 Conflict Detection
function detectRuleConflicts(rule_set: any): string[] {
  const conflicts: string[] = [];
  const rules = rule_set.rules;

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i];
      const b = rules[j];

      if (
        a.condition.field === b.condition.field &&
        a.condition.operator === b.condition.operator &&
        a.condition.value === b.condition.value &&
        a.outcome !== b.outcome
      ) {
        conflicts.push(`${a.id} conflicts with ${b.id}`);
      }
    }
  }

  return conflicts;
}

// 🚀 Run Simulation
function runSimulation() {
  console.log("🧠 Running Manthan Simulation...\n");

  testCases.forEach((test) => {
    const result = executeDecisionInputRequest(context, {
      intent: "simulation_test",
      input: test.input,
    });

    const decision = result.decision_result;

    // Track used rules
    if (decision.rule_id) {
      usedRules.add(decision.rule_id);
    }

    // Track ESCALATE
    if (decision.decision === "ESCALATE") {
      escalateReasons.push({
        test: test.name,
        reason: decision.explanation.reason,
        details: decision.explanation.details,
      });
    }

    console.log("====================================");
    console.log(`Test: ${test.name}`);
    console.log("Decision:", decision.decision);
    console.log("Rule:", decision.rule_id);
    console.log("Reason:", decision.explanation.reason);
    console.log("====================================\n");
  });

  // 📊 COVERAGE REPORT
  console.log("\n📊 COVERAGE REPORT\n");

  const allRules: string[] = rule_set.rules.map((r: any) => r.id);
  const unusedRules: string[] = allRules.filter((id) => !usedRules.has(id));

  console.log("✅ Used Rules:");
  usedRules.forEach((r: string) => console.log(" -", r));

  console.log("\n❌ Unused Rules:");
  if (unusedRules.length === 0) {
    console.log(" - None");
  } else {
    unusedRules.forEach((r: string) => console.log(" -", r));
  }

  console.log("\n⚠️ ESCALATE Cases:");
  if (escalateReasons.length === 0) {
    console.log(" - None");
  } else {
    escalateReasons.forEach((e) => {
      console.log(` - ${e.test}`);
      console.log("   Reason:", e.reason);
      console.log("   Details:", JSON.stringify(e.details));
    });
  }

  // 🚨 SHADOW DETECTION
  const shadowedRules = detectShadowedRules(rule_set);

  console.log("\n🚨 Shadowed Rules:");
  if (shadowedRules.length === 0) {
    console.log(" - None");
  } else {
    shadowedRules.forEach((r: string) => console.log(" -", r));
  }

  // 🚨 CONFLICT DETECTION
  const conflicts = detectRuleConflicts(rule_set);

  console.log("\n🚨 Conflicting Rules:");
  if (conflicts.length === 0) {
    console.log(" - None");
  } else {
    conflicts.forEach((c: string) => console.log(" -", c));
  }
}

// Execute
runSimulation();