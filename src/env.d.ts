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
  OPENAI_API_KEY?: string;
  PUBLIC_TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  CONGRESS_API_KEY?: string;
}

declare global {
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
    readonly OPENAI_API_KEY?: string;
    readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
    readonly TURNSTILE_SECRET_KEY?: string;
    readonly CONGRESS_API_KEY?: string;
    readonly DEV: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
