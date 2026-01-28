/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { SessionUser } from "./middleware";

declare global {
  namespace App {
    interface Locals {
      user: SessionUser | null;
    }
  }

  interface ImportMetaEnv {
    readonly DATABASE_URL: string;
    readonly EMAIL_PROVIDER: "console" | "smtp" | "ses";
    readonly EMAIL_FROM: string;
    readonly SMTP_HOST?: string;
    readonly SMTP_PORT?: string;
    readonly SMTP_SECURE?: string;
    readonly SMTP_USER?: string;
    readonly SMTP_PASS?: string;
    readonly AWS_REGION?: string;
    readonly OPENAI_API_KEY?: string;
    readonly TURNSTILE_SITE_KEY?: string;
    readonly TURNSTILE_SECRET_KEY?: string;
    readonly CONGRESS_API_KEY?: string;
    readonly DEV: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
