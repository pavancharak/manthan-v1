import dotenv from "dotenv";
dotenv.config();
import http from "http";
import { IncomingMessage, ServerResponse } from "http";

import { executeDecisionInputRequest } from "./execution/sdk";
import { executeWithVerification } from "./execution/gateway";

// --------------------------------------
// MOCK EXECUTOR (replace later)
// --------------------------------------

async function executor(action: string, params: any) {
  console.log("EXECUTING:", action, params);

  if (action === "merge_pr") {
    return { success: true, message: "PR merged" };
  }

  if (action === "log") {
    return { success: true, message: "Logged" };
  }

  return { success: false, message: "Unknown action" };
}

// --------------------------------------
// SERVER
// --------------------------------------

const server = http.createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};

        // --------------------------------------
        // /decision
        // --------------------------------------

        if (req.method === "POST" && req.url === "/decision") {
          const result = executeDecisionInputRequest({
            intent: parsed.intent,
            intent_version: parsed.intent_version,
            input: parsed.input,
          });

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify(result));
        }

        // --------------------------------------
        // /execute 🔐 (FINAL — TOKEN BASED FLOW)
        // --------------------------------------

        if (req.method === "POST" && req.url === "/execute") {
          const { decision_token, action, event_id } = parsed;

          // ✅ Validate input
          if (
            typeof decision_token !== "string" ||
            typeof action !== "string" ||
            typeof event_id !== "string"
          ) {
            throw new Error("Missing or invalid required fields");
          }

          // 🔐 Gateway handles:
          // - token decoding
          // - signature verification
          // - hash verification
          // - replay protection
          // - action enforcement

          const result = await executeWithVerification(
            {
              decision_token,
              action,
              event_id,
            },
            executor
          );

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify(result));
        }

        // --------------------------------------

        res.writeHead(404);
        res.end("Not Found");
      } catch (err: any) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: err?.message || "unknown_error",
          })
        );
      }
    });
  }
);

server.listen(3000, () => {
  console.log("Manthan running on port 3000");
});