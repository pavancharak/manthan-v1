import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import fetch from "node-fetch";

import { executeDecisionInputRequest } from "../../execution/sdk";
import { compileRuleSet } from "../../rules/compiler";

import rawSchema from "../../schema/schema.json";
import rawRuleSet from "../../rules/rule_set.json";

import { extractGitHubSignals } from "./signals";
import { mapGitHubSignalsToDecisionInput } from "./mapper";

import { Schema, RuleSet } from "../../core/types";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const GITHUB_SECRET = process.env.GITHUB_SECRET || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

// ✅ Compile rules
const schema = rawSchema as Schema;
const rule_set = compileRuleSet(schema, rawRuleSet as RuleSet);

const context = { schema, rule_set };

// 🔐 Signature verification
function verifySignature(req: any) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", GITHUB_SECRET);
  const digest =
    "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// 🚀 Webhook
app.post("/webhook", async (req, res) => {
  try {
    if (!verifySignature(req)) {
      return res.status(401).send("Invalid signature");
    }

    if (req.headers["x-github-event"] !== "pull_request") {
      return res.status(200).send("Ignored");
    }

    const pr = req.body.pull_request;
    const repo = req.body.repository.full_name;

    // 🔹 SIGNALS
    const signals = await extractGitHubSignals({
      repo,
      prNumber: pr.number,
      token: GITHUB_TOKEN,
    });

    // 🔹 MAPPING
    const decision_input = mapGitHubSignalsToDecisionInput(signals);

    // 🔹 EXECUTION
    const result = executeDecisionInputRequest(context, {
      intent: "pr_merge_safety",
      input: decision_input,
    });

    const decision = result.decision_result;

    // 🔹 COMMENT
    await fetch(
      `https://api.github.com/repos/${repo}/issues/${pr.number}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: `🧠 Manthan Decision: **${decision.decision}**\nReason: ${decision.explanation.reason}`,
        }),
      }
    );

    res.status(200).json(decision);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 GitHub webhook running on ${PORT}`);
});