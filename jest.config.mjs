import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["<rootDir>/__tests__/**/*.test.[jt]s?(x)", "<rootDir>/tests/**/*.test.[jt]s?(x)"],
  collectCoverageFrom: ["**/*.{ts,tsx}", "!**/node_modules/**", "!**/.next/**"],
  verbose: true,
};

export default createJestConfig(config);

