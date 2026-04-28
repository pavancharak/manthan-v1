import { executeDecisionInputRequest } from "../execution/sdk";
import { logDecisionEvent } from "../events/logger";
import { analyzeCoverage } from "../coverage/coverage";
import { generateSuggestions } from "../ai/suggestions";
import { analyzeCost } from "../cost/analyzer";

import fs from "fs";
import path from "path";

// --------------------------------------
// CONFIG
// --------------------------------------

const INTENT = "pr_merge_safety";
const VERSION = "v2";

// --------------------------------------
// LOAD TEST CASES
// --------------------------------------

const testFilePath = path.join(__dirname, "test-cases.json");
const raw = fs.readFileSync(testFilePath, "utf-8");

type SimulationCase = {
  name: string;
  input: Record<string, any>;
};

const testCases: SimulationCase[] = JSON.parse(raw);

// --------------------------------------
// TRACKERS
// --------------------------------------

const usedRules = new Set<string>();
const escalateCases: { reason: string; details?: any }[] = [];

// --------------------------------------
// RUN SIMULATION
// --------------------------------------

function runSimulation() {
  console.log("🧠 Running Manthan Simulation...\n");

  testCases.forEach((test) => {
    const result = executeDecisionInputRequest({
      intent: INTENT,
      intent_version: VERSION,
      input: test.input,
    });

    const decision = result.decision_result;

    // --------------------------------------
    // LOG
    // --------------------------------------

    logDecisionEvent({
      timestamp: new Date().toISOString(),
      intent: INTENT,
      decision_input: test.input,
      decision_result: decision,
      schema_version: result.intent_version,
      rule_version: result.intent_version,
    });

    // --------------------------------------
    // HANDLE NON-DECIDED STATES
    // --------------------------------------

    if (decision.status !== "DECIDED") {
      console.log("====================================");
      console.log(`Test: ${test.name}`);
      console.log("Status:", decision.status);
      console.log("Reason:", decision.explanation.reason);
      console.log("====================================\n");
      return;
    }

    // --------------------------------------
    // TRACK RULE USAGE
    // --------------------------------------

    if (decision.rule_id) {
      usedRules.add(decision.rule_id);
    }

    // --------------------------------------
    // TRACK ESCALATE
    // --------------------------------------

    if (decision.decision === "ESCALATE") {
      escalateCases.push({
        reason: decision.explanation.reason,
        details: decision.explanation.details,
      });
    }

    // --------------------------------------
    // OUTPUT
    // --------------------------------------

    console.log("====================================");
    console.log(`Test: ${test.name}`);
    console.log("Decision:", decision.decision);
    console.log("Rule:", decision.rule_id);
    console.log("Reason:", decision.explanation.reason);
    console.log("====================================\n");
  });

  // --------------------------------------
  // COVERAGE
  // --------------------------------------

  const coverage = analyzeCoverage({
    ruleIds: Array.from(usedRules),
    usedRules,
    escalateCases,
  });

  console.log("\n📊 COVERAGE REPORT\n");
  console.log("Coverage:", `${coverage.coveragePercent}%`);

  console.log("✅ Used Rules:");
  usedRules.forEach((r) => console.log(" -", r));

  // --------------------------------------
  // ESCALATIONS
  // --------------------------------------

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

  // --------------------------------------
  // AI SUGGESTIONS
  // --------------------------------------

  const suggestions = generateSuggestions({
    warnings: [],
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

  // --------------------------------------
  // COST
  // --------------------------------------

  const cost = analyzeCost({
    ruleCount: usedRules.size,
    evaluatedRules: usedRules.size,
    suggestions: suggestions.length,
    simulations: testCases.length,
  });

  console.log("\n💰 COST REPORT\n");

  console.log("Total Rules:", cost.totalRules);
  console.log("Evaluated Rules:", cost.evaluatedRules);
  console.log("Suggestions Generated:", cost.suggestionsGenerated);
  console.log("Simulation Cases:", cost.simulationCases);
  console.log("Estimated Cost Score:", cost.estimatedCostScore);
}

// --------------------------------------
// RUN
// --------------------------------------

runSimulation();