import { z } from "zod";

const databaseSchema = z.object({
  url: z.string().min(1, "DATABASE_URL is required"),
});

const rawSmtpSchema = z.object({
  host: z.string().optional(),
  port: z.coerce.number().optional(),
  secure: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  user: z.string().optional(),
  pass: z.string().optional(),
});

const rawEmailSchema = z.object({
  provider: z.enum(["smtp", "ses"]).default("smtp"),
  from: z.string().default("no-reply@democracy-direct.com"),
  smtp: rawSmtpSchema.optional(),
  awsRegion: z.string().default("us-east-1"),
});

const emailSchema = rawEmailSchema.transform((raw) => ({
  provider: raw.provider,
  from: raw.from,
  smtp:
    raw.provider === "smtp"
      ? {
          host: raw.smtp?.host || "localhost",
          port: raw.smtp?.port || 1025,
          secure: raw.smtp?.secure || false,
          auth:
            raw.smtp?.user && raw.smtp?.pass
              ? { user: raw.smtp.user, pass: raw.smtp.pass }
              : undefined,
        }
      : undefined,
  ses: raw.provider === "ses" ? { region: raw.awsRegion } : undefined,
}));

const moderationSchema = z.object({
  openaiApiKey: z.string().optional(),
});

const turnstileSchema = z.object({
  siteKey: z.string().min(1, "TURNSTILE_SITE_KEY is required"),
  secretKey: z.string().min(1, "TURNSTILE_SECRET_KEY is required"),
});

const dataSourcesSchema = z.object({
  congressApiKey: z.string().optional(),
});

const configSchema = z.object({
  database: databaseSchema,
  email: emailSchema,
  moderation: moderationSchema,
  turnstile: turnstileSchema,
  dataSources: dataSourcesSchema,
});

export type Config = z.infer<typeof configSchema>;
export type DatabaseConfig = z.infer<typeof databaseSchema>;
export type EmailConfig = z.infer<typeof emailSchema>;
export type TurnstileConfig = z.infer<typeof turnstileSchema>;
export type ModerationConfig = z.infer<typeof moderationSchema>;

function getRawEnv(locals: App.Locals, key: string): string | undefined {
  const runtimeValue = locals.runtime?.env?.[key as keyof typeof locals.runtime.env];
  if (runtimeValue !== undefined) {
    return runtimeValue as string;
  }
  return import.meta.env[key] as string | undefined;
}

export function getConfig(locals: App.Locals): Config {
  const raw = {
    database: {
      url: getRawEnv(locals, "DATABASE_URL"),
    },
    email: {
      provider: getRawEnv(locals, "EMAIL_PROVIDER"),
      from: getRawEnv(locals, "EMAIL_FROM"),
      smtp: {
        host: getRawEnv(locals, "SMTP_HOST"),
        port: getRawEnv(locals, "SMTP_PORT"),
        secure: getRawEnv(locals, "SMTP_SECURE"),
        user: getRawEnv(locals, "SMTP_USER"),
        pass: getRawEnv(locals, "SMTP_PASS"),
      },
      awsRegion: getRawEnv(locals, "AWS_REGION"),
    },
    moderation: {
      openaiApiKey: getRawEnv(locals, "OPENAI_API_KEY"),
    },
    turnstile: {
      siteKey: getRawEnv(locals, "TURNSTILE_SITE_KEY"),
      secretKey: getRawEnv(locals, "TURNSTILE_SECRET_KEY"),
    },
    dataSources: {
      congressApiKey: getRawEnv(locals, "CONGRESS_API_KEY"),
    },
  };

  const result = configSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Invalid configuration: ${errors}`);
  }

  return result.data;
}

export function getConfigSafe(
  locals: App.Locals
): { success: true; config: Config } | { success: false; error: string } {
  try {
    return { success: true, config: getConfig(locals) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
