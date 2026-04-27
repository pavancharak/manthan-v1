import "dotenv/config";
import crypto from "crypto";

// --------------------------------------
// LOAD KEYS (PEM FORMAT)
// --------------------------------------

const PRIVATE_KEY_RAW = process.env.MANTHAN_PRIVATE_KEY!;
const PUBLIC_KEY_RAW = process.env.MANTHAN_PUBLIC_KEY!;

if (!PRIVATE_KEY_RAW) throw new Error("MANTHAN_PRIVATE_KEY not set");
if (!PUBLIC_KEY_RAW) throw new Error("MANTHAN_PUBLIC_KEY not set");

// 🔥 FIX: normalize newlines
const PRIVATE_KEY = PRIVATE_KEY_RAW.replace(/\\n/g, "\n");
const PUBLIC_KEY = PUBLIC_KEY_RAW.replace(/\\n/g, "\n");

// --------------------------------------
// SIGN
// --------------------------------------

export function signDecisionHash(decision_hash: string): string {
  const signature = crypto.sign(
    null,
    Buffer.from(decision_hash),
    PRIVATE_KEY
  );

  return signature.toString("base64");
}

// --------------------------------------
// VERIFY
// --------------------------------------

export function verifyDecisionHash(
  decision_hash: string,
  signature: string
): boolean {
  return crypto.verify(
    null,
    Buffer.from(decision_hash),
    PUBLIC_KEY,
    Buffer.from(signature, "base64")
  );
}