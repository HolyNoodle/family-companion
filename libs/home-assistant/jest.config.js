const defaultConfig = require("jestconfig/jest.config");

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...defaultConfig,
  coveragePathIgnorePatterns: ["src/index.ts"],
};
