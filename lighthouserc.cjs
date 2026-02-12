module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:8788/",
        "http://localhost:8788/templates",
        "http://localhost:8788/templates/e2e-test-infrastructure",
        "http://localhost:8788/rep/S000033",
        "http://localhost:8788/reps/OR/3",
      ],
      startServerCommand: "pnpm exec wrangler pages dev dist --port 8788",
      startServerReadyPattern: "Ready on",
      startServerReadyTimeout: 30000,
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--no-sandbox --headless",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "categories:performance": ["warn", { minScore: 0.6 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
