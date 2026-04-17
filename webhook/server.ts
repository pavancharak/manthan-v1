import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import fetch from "node-fetch";

import { executeDecisionInput } from "../execution/sdk";

const app = express();
app.use(bodyParser.json());

const PORT = 3001;

// ENV
const GITHUB_SECRET = process.env.GITHUB_SECRET || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

// Replace with real schema + rule_set loading
import schema from "../schema/schema.json";
import rule_set from "../rules/rule_set.json";

const context = {
  schema,
  rule_set,
};

// VERIFY SIGNATURE
function verifySignature(req: any) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", GITHUB_SECRET);
  const digest = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
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

    // BUILD DECISION INPUT (NO LOGIC — just extraction)
    const decision_input = {
      isApproved: pr.requested_reviewers.length === 0,
      hasNewCommitsAfterApproval: false, // simplified for now
    };

    // EXECUTE
    const result = executeDecisionInput({
      input: decision_input,
      context,
    });

    // COMMENT ON PR
    const repo = req.body.repository.full_name;
    const issue_number = pr.number;

    await fetch(`https://api.github.com/repos/${repo}/issues/${issue_number}/comments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: `Manthan Decision: **${result.outcome}**\n\n${result.explanation}`,
      }),
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error processing webhook");
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Webhook running on port ${PORT}`);
});