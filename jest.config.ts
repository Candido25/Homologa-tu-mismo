const config = { preset: "ts-jest", testEnvironment: "node", moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" }, setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"] }; export default config;
