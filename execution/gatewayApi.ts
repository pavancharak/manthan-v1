import { executeWithVerification } from "./gateway";
import { executeAction } from "./integrations";

// --------------------------------------
// TYPES
// --------------------------------------

export interface ExecutionApiResponse {
  status: number;
  body: unknown;
}

// --------------------------------------
// VALIDATORS (same style as your API)
// --------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// --------------------------------------
// EXECUTION API HANDLER
// --------------------------------------

export async function handleExecuteApiRequest(
  payload: unknown
): Promise<ExecutionApiResponse> {
  try {
    // ✅ basic validation
    if (!isPlainObject(payload)) {
      return { status: 400, body: { error: "invalid_request" } };
    }

    // 🚫 IMPORTANT:
    // This endpoint ONLY executes VERIFIED decisions
    // Payload MUST be a signed decision payload

    const result = await executeWithVerification(
      payload as any, // validated inside gateway
      executeAction
    );

    return {
      status: 200,
      body: {
        success: true,
        result,
      },
    };

  } catch (error) {
    return {
      status: 400,
      body: {
        error: "execution_failed",
        message:
          error instanceof Error ? error.message : "unknown_error",
      },
    };
  }
}