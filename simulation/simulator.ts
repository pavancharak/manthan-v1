import { compileRuleSet } from "../rules/compiler";
import { generateSuggestions } from "../ai/suggestions";
import { executeDecisionInputRequest } from "../execution/sdk";
import fs from "fs";
import path from "path";

// Load schema + rules
const schema = require("../schema/schema.json");
const raw_rule_set = require("../rules/rule_set.json");

const rule_set = compileRuleSet(schema, raw_rule_set);

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
const escalateCases: { reason: string; details?: any }[] = [];

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
      escalateCases.push({
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
  if (escalateCases.length === 0) {
    console.log(" - None");
  } else {
    escalateCases.forEach((e, idx) => {
      console.log(` - Case ${idx + 1}`);
      console.log("   Reason:", e.reason);
      console.log("   Details:", JSON.stringify(e.details));
    });
  }

  // 💡 AI SUGGESTIONS (FINAL INTEGRATION)
  const suggestions = generateSuggestions({
    warnings: rule_set.warnings, // from compiler
    escalateCases,
  });

  console.log("\n💡 AI SUGGESTIONS\n");

  if (suggestions.length === 0) {
    console.log("✔ No suggestions — system looks optimal");
  } else {
    suggestions.forEach((s) => {
      console.log(`- [${s.type.toUpperCase()}] ${s.message}`);
    });
  }
}

// Execute
runSimulation();