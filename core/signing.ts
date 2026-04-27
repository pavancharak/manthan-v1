import "dotenv/config";
import crypto from "crypto";

// --------------------------------------
// CONFIG
// --------------------------------------

//console.log("PRIVATE KEY LOADED:", !!process.env.MANTHAN_PRIVATE_KEY);
//console.log("PUBLIC KEY LOADED:", !!process.env.MANTHAN_PUBLIC_KEY);

const SECRET = process.env.MANTHAN_SECRET;

if (!SECRET) {
  throw new Error("MANTHAN_SECRET is not set");
}

const SECRET_KEY: string = SECRET;

// --------------------------------------
// SIGN DECISION HASH
// --------------------------------------

export function signDecisionHash(decision_hash: string): string {
  return crypto
    .createHmac("sha256", SECRET_KEY)
    .update(decision_hash)
    .digest("hex");
}

// --------------------------------------
// VERIFY DECISION HASH
// --------------------------------------

export function verifyDecisionHash(
  decision_hash: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(decision_hash)
    .digest("hex");

  return expected === signature;
}