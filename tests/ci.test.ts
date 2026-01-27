import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "yaml";

const rootDir = resolve(__dirname, "..");

describe("Phase 0.6: CI/CD Pipeline", () => {
  const workflowPath = resolve(rootDir, ".github/workflows/ci.yml");

  it("should have CI workflow file", () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  describe("Workflow configuration", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const workflow = parse(content);

    it("should trigger on push to main", () => {
      expect(workflow.on.push.branches).toContain("main");
    });

    it("should trigger on pull request to main", () => {
      expect(workflow.on.pull_request.branches).toContain("main");
    });

    it("should have lint job", () => {
      expect(workflow.jobs.lint).toBeDefined();
    });

    it("should have typecheck job", () => {
      expect(workflow.jobs.typecheck).toBeDefined();
    });

    it("should have test job", () => {
      expect(workflow.jobs.test).toBeDefined();
    });

    it("should have e2e test job", () => {
      expect(workflow.jobs["test-e2e"]).toBeDefined();
    });

    it("should have build job", () => {
      expect(workflow.jobs.build).toBeDefined();
    });
  });
});
