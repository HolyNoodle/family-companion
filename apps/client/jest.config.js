const defaultConfig = require("jestconfig/jest.config");

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...defaultConfig,
  transformIgnorePatterns: ["/node_modules/(?!antd|@ant-design|rc-.+?|@babel/runtime).+(js|jsx)$"],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  }
};
