import crypto from "crypto";
import fs from "fs";

// Generate Ed25519 key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

// Export as PEM
const privatePem = privateKey.export({
  type: "pkcs8",
  format: "pem",
});

const publicPem = publicKey.export({
  type: "spki",
  format: "pem",
});

// Save files
fs.writeFileSync("private.pem", privatePem);
fs.writeFileSync("public.pem", publicPem);

console.log("✅ Keys generated:");
console.log("\n--- PRIVATE KEY ---\n");
console.log(privatePem);
console.log("\n--- PUBLIC KEY ---\n");
console.log(publicPem);