import express from "express";
import bodyParser from "body-parser";

import { executeDecisionInputRequest } from "../execution/sdk";
import { executeWithVerification } from "../execution/gateway";

// --------------------------------------
// INIT
// --------------------------------------

const app = express();
app.use(bodyParser.json());

const PORT = 3000;

// --------------------------------------
// HELPERS (STRICT VALIDATION)
// --------------------------------------

function validateDecisionRequest(body: any) {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  if (typeof body.intent !== "string") {
    throw new Error("Missing or invalid intent");
  }

  if (typeof body.intent_version !== "string") {
    throw new Error("Missing or invalid intent_version");
  }

  if (!body.input || typeof body.input !== "object") {
    throw new Error("Missing or invalid input");
  }
}

function validateExecutionRequest(body: any) {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  if (typeof body.decision_token !== "string") {
    throw new Error("Missing or invalid decision_token");
  }

  if (typeof body.action !== "string") {
    throw new Error("Missing or invalid action");
  }

  if (typeof body.event_id !== "string") {
    throw new Error("Missing or invalid event_id");
  }
}

// --------------------------------------
// HEALTH CHECK
// --------------------------------------

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --------------------------------------
// DECISION ENDPOINT
// --------------------------------------

app.post("/decision", (req, res) => {
  try {
    validateDecisionRequest(req.body);

    const result = executeDecisionInputRequest({
      intent: req.body.intent,
      intent_version: req.body.intent_version,
      input: req.body.input,
      debug: true, // 🔥 ensures trace generation
    });

    res.json({
      success: true,
      decision: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

// --------------------------------------
// EXPLAIN ENDPOINT
// --------------------------------------

app.post("/explain", (req, res) => {
  try {
    validateDecisionRequest(req.body);

    const result = executeDecisionInputRequest({
      intent: req.body.intent,
      intent_version: req.body.intent_version,
      input: req.body.input,
      debug: true,
    });

    const decision = result.decision_result;

    if (decision.status !== "DECIDED") {
      return res.json({
        success: false,
        error: decision.explanation,
      });
    }

    // 🔒 Extract deterministic trace from signed token
    let trace = null;

    try {
      const parsed = JSON.parse(result.decision_token);
      trace = parsed.trace || null;
    } catch {
      trace = null;
    }

    res.json({
      success: true,
      explanation: {
        decision: decision.decision,
        rule_id: decision.rule_id,

        // reasoning
        reason: decision.explanation.reason,

        // structured rule details
        rule: decision.explanation.details,

        // execution trace (deterministic)
        trace,

        // debug summary (optional)
        debug: decision.debug || null,
      },
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

// --------------------------------------
// EXECUTION ENDPOINT
// --------------------------------------

app.post("/execute", async (req, res) => {
  try {
    validateExecutionRequest(req.body);

    const result = await executeWithVerification(
      {
        decision_token: req.body.decision_token,
        action: req.body.action,
        event_id: req.body.event_id,
      },
      async (action, params) => {
        // 🔥 TEMP executor (replace later)
        console.log("EXECUTING:", action, params);

        return {
          executed: true,
          action,
          params,
        };
      }
    );

    res.json({
      success: true,
      execution: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

// --------------------------------------
// START SERVER
// --------------------------------------

app.listen(PORT, () => {
  console.log(`Manthan API running on port ${PORT}`);
});