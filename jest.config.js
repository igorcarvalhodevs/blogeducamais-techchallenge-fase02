module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  setupFiles: ["<rootDir>/tests/testSetup.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/server.js"],
  coveragePathIgnorePatterns: ["/node_modules/"],
  coverageReporters: ["text", "lcov"],
};



