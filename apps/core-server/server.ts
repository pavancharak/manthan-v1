import express from "express";
import bodyParser from "body-parser";

import { executeDecisionInputRequest } from "../../execution/sdk";
import { compileRuleSet } from "../../rules/compiler";

import rawSchema from "../../schema/schema.json";
import rawRuleSet from "../../rules/rule_set.json";

import { Schema, RuleSet } from "../../core/types";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// 🔒 Compile once (deterministic)
const schema = rawSchema as Schema;
const rule_set = compileRuleSet(schema, rawRuleSet as RuleSet);

const context = { schema, rule_set };

// 🚀 Evaluate endpoint
app.post("/evaluate", (req, res) => {
  try {
    const { intent, input } = req.body;

    const result = executeDecisionInputRequest(context, {
      intent,
      input,
    });

    res.json(result.decision_result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "evaluation_failed" });
  }
});

// Health check
app.get("/", (_, res) => {
  res.send("🧠 Manthan Core running");
});

app.listen(PORT, () => {
  console.log(`🧠 Manthan Core running on ${PORT}`);
});