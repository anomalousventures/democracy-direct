import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    include: ["**/*.integration.test.ts"],
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["json"],
      reportsDirectory: "./coverage-integration",
      exclude: [
        "node_modules/**",
        "dist/**",
        ".astro/**",
        "**/*.config.*",
        "tests/**",
        "**/*.d.ts",
      ],
    },
  },
});
