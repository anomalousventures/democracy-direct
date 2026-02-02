import "dotenv/config";
import "@testing-library/jest-dom/vitest";

// Override env vars that unit tests depend on having specific default values
// Integration tests use DATABASE_URL from .env, but unit tests mock the database
Object.assign(process.env, {
  EMAIL_FROM: "no-reply@democracy-direct.com",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
});

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

if (typeof document !== "undefined" && !document.elementFromPoint) {
  document.elementFromPoint = () => null;
}
