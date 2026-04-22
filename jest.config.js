module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],

  // 🔐 inject env before tests run
  setupFiles: ["<rootDir>/tests/setupEnv.ts"],
};