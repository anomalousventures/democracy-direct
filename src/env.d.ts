/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { SessionUser } from "./middleware";

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

export interface Env {
  DATABASE_URL: string;
  EMAIL_PROVIDER?: "smtp" | "ses";
  EMAIL_FROM?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  OPENAI_API_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  CONGRESS_API_KEY?: string;
  POSTHOG_API_KEY?: string;
  POSTHOG_HOST?: string;
}

interface PostHogInstance {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
}

declare global {
  interface Window {
    posthog?: PostHogInstance;
  }

  namespace App {
    interface Locals extends Runtime {
      user: SessionUser | null;
    }
  }

  interface ImportMetaEnv {
    readonly DATABASE_URL?: string;
    readonly EMAIL_PROVIDER?: "smtp" | "ses";
    readonly EMAIL_FROM?: string;
    readonly SMTP_HOST?: string;
    readonly SMTP_PORT?: string;
    readonly SMTP_SECURE?: string;
    readonly SMTP_USER?: string;
    readonly SMTP_PASS?: string;
    readonly AWS_REGION?: string;
    readonly AWS_ACCESS_KEY_ID?: string;
    readonly AWS_SECRET_ACCESS_KEY?: string;
    readonly OPENAI_API_KEY?: string;
    readonly TURNSTILE_SITE_KEY?: string;
    readonly TURNSTILE_SECRET_KEY?: string;
    readonly CONGRESS_API_KEY?: string;
    readonly POSTHOG_API_KEY?: string;
    readonly POSTHOG_HOST?: string;
    readonly DEV: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
