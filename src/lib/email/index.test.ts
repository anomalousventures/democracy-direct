import { describe, it, expect } from "vitest";
import { getEmailConfig } from "./index";

function createMockLocals(env: Record<string, string | undefined>): App.Locals {
  return {
    runtime: {
      env: {
        DATABASE_URL: "postgresql://test:test@localhost:5432/test",
        TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
        TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
        ...env,
      },
    },
  } as App.Locals;
}

describe("getEmailConfig", () => {
  describe("provider selection", () => {
    it("defaults to smtp when EMAIL_PROVIDER not set", () => {
      const locals = createMockLocals({});
      const config = getEmailConfig(locals);
      expect(config.provider).toBe("smtp");
    });

    it("uses smtp when EMAIL_PROVIDER is smtp", () => {
      const locals = createMockLocals({ EMAIL_PROVIDER: "smtp" });
      const config = getEmailConfig(locals);
      expect(config.provider).toBe("smtp");
    });

    it("uses ses when EMAIL_PROVIDER is ses", () => {
      const locals = createMockLocals({ EMAIL_PROVIDER: "ses" });
      const config = getEmailConfig(locals);
      expect(config.provider).toBe("ses");
    });
  });

  describe("from address", () => {
    it("defaults to no-reply@democracy-direct.com", () => {
      const locals = createMockLocals({});
      const config = getEmailConfig(locals);
      expect(config.from).toBe("no-reply@democracy-direct.com");
    });

    it("uses EMAIL_FROM when set", () => {
      const locals = createMockLocals({ EMAIL_FROM: "custom@example.com" });
      const config = getEmailConfig(locals);
      expect(config.from).toBe("custom@example.com");
    });
  });

  describe("smtp configuration", () => {
    it("includes smtp config when provider is smtp", () => {
      const locals = createMockLocals({ EMAIL_PROVIDER: "smtp" });
      const config = getEmailConfig(locals);
      expect(config.smtp).toBeDefined();
      expect(config.ses).toBeUndefined();
    });

    it("uses default smtp host and port", () => {
      const locals = createMockLocals({ EMAIL_PROVIDER: "smtp" });
      const config = getEmailConfig(locals);
      expect(config.smtp?.host).toBe("localhost");
      expect(config.smtp?.port).toBe(1025);
    });

    it("uses custom smtp host and port", () => {
      const locals = createMockLocals({
        EMAIL_PROVIDER: "smtp",
        SMTP_HOST: "mail.example.com",
        SMTP_PORT: "587",
      });
      const config = getEmailConfig(locals);
      expect(config.smtp?.host).toBe("mail.example.com");
      expect(config.smtp?.port).toBe(587);
    });

    it("sets secure to false by default", () => {
      const locals = createMockLocals({ EMAIL_PROVIDER: "smtp" });
      const config = getEmailConfig(locals);
      expect(config.smtp?.secure).toBe(false);
    });

    it("sets secure to true when SMTP_SECURE is true", () => {
      const locals = createMockLocals({
        EMAIL_PROVIDER: "smtp",
        SMTP_SECURE: "true",
      });
      const config = getEmailConfig(locals);
      expect(config.smtp?.secure).toBe(true);
    });

    it("does not include auth when credentials not set", () => {
      const locals = createMockLocals({ EMAIL_PROVIDER: "smtp" });
      const config = getEmailConfig(locals);
      expect(config.smtp?.auth).toBeUndefined();
    });

    it("includes auth when both user and pass are set", () => {
      const locals = createMockLocals({
        EMAIL_PROVIDER: "smtp",
        SMTP_USER: "user@example.com",
        SMTP_PASS: "password123",
      });
      const config = getEmailConfig(locals);
      expect(config.smtp?.auth).toEqual({
        user: "user@example.com",
        pass: "password123",
      });
    });

    it("does not include auth when only user is set", () => {
      const locals = createMockLocals({
        EMAIL_PROVIDER: "smtp",
        SMTP_USER: "user@example.com",
      });
      const config = getEmailConfig(locals);
      expect(config.smtp?.auth).toBeUndefined();
    });
  });

  describe("ses configuration", () => {
    it("includes ses config when provider is ses", () => {
      const locals = createMockLocals({ EMAIL_PROVIDER: "ses" });
      const config = getEmailConfig(locals);
      expect(config.ses).toBeDefined();
      expect(config.smtp).toBeUndefined();
    });

    it("uses default region us-east-1", () => {
      const locals = createMockLocals({ EMAIL_PROVIDER: "ses" });
      const config = getEmailConfig(locals);
      expect(config.ses?.region).toBe("us-east-1");
    });

    it("uses custom AWS_REGION", () => {
      const locals = createMockLocals({
        EMAIL_PROVIDER: "ses",
        AWS_REGION: "eu-west-1",
      });
      const config = getEmailConfig(locals);
      expect(config.ses?.region).toBe("eu-west-1");
    });
  });
});
