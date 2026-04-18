import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import fetch from "node-fetch";

import { executeDecisionInputRequest } from "../execution/sdk";
import { compileRuleSet } from "../rules/compiler";

const app = express();
app.use(bodyParser.json());

const PORT = 3001;

// ENV
const GITHUB_SECRET = process.env.GITHUB_SECRET || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

// LOAD + COMPILE
import rawSchema from "../schema/schema.json";
import rawRuleSet from "../rules/rule_set.json";

import { Schema, RuleSet } from "../core/types";

// ✅ FORCE TYPE ALIGNMENT
const schema = rawSchema as Schema;
const raw_rule_set = rawRuleSet as RuleSet;

const rule_set = compileRuleSet(schema, raw_rule_set);

const context = {
  schema,
  rule_set,
};

// VERIFY SIGNATURE
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

// WEBHOOK
app.post("/webhook", async (req, res) => {
  try {
    if (!verifySignature(req)) {
      return res.status(401).send("Invalid signature");
    }

    const event = req.headers["x-github-event"];

    if (event !== "pull_request") {
      return res.status(200).send("Ignored");
    }

    const pr = req.body.pull_request;

    // ✅ DECISION INPUT (deterministic + minimal)
    const decision_input = {
      isApproved: pr.merged === false && pr.state === "open" && pr.draft === false,
      hasNewCommitsAfterApproval: false, // TODO: improve later
    };

    // ✅ EXECUTE
    const result = executeDecisionInputRequest(context, {
      intent: "pr_merge_safety",
      input: decision_input,
    });

    const decision = result.decision_result;

    // ✅ FORMAT COMMENT
    const commentBody = `
### 🧠 Manthan Decision

**Decision:** ${decision.decision}

**Reason:** ${decision.explanation.reason}

${
  decision.explanation.details
    ? `**Details:** \n\`\`\`json\n${JSON.stringify(
        decision.explanation.details,
        null,
        2
      )}\n\`\`\``
    : ""
}
`;

    // POST COMMENT
    const repo = req.body.repository.full_name;
    const issue_number = pr.number;

    await fetch(
      `https://api.github.com/repos/${repo}/issues/${issue_number}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: commentBody,
        }),
      }
    );

    return res.status(200).json(decision);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error processing webhook");
  }
});

// START
app.listen(PORT, () => {
  console.log(`🚀 Manthan webhook running on port ${PORT}`);
});