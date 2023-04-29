/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.ts"],
  transformIgnorePatterns: ["/node_modules/(?!antd|@ant-design|rc-.+?|@babel/runtime).+(js|jsx)$"]
};
