import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["scripts/json-gen/_tests_/**/*.ts", "src/__tests__/**/*.ts"],
  },
});
