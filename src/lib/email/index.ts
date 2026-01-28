import type { EmailConfig, EmailMessage, EmailProvider } from "./types";
import { SmtpEmailProvider } from "./providers/smtp";
import { SesEmailProvider } from "./providers/ses";
import { getEnv } from "@/lib/env";

export type { EmailConfig, EmailMessage, EmailProvider };

export function createEmailProvider(config: EmailConfig): EmailProvider {
  switch (config.provider) {
    case "smtp":
      return new SmtpEmailProvider(config);
    case "ses":
      return new SesEmailProvider(config);
    default:
      throw new Error(`Unknown email provider: ${config.provider}`);
  }
}

export function getEmailConfig(locals: App.Locals): EmailConfig {
  const provider = (getEnv(locals, "EMAIL_PROVIDER") || "smtp") as EmailConfig["provider"];

  return {
    provider,
    from: getEnv(locals, "EMAIL_FROM") || "no-reply@democracy-direct.com",
    smtp:
      provider === "smtp"
        ? {
            host: getEnv(locals, "SMTP_HOST") || "localhost",
            port: parseInt(getEnv(locals, "SMTP_PORT") || "1025", 10),
            secure: getEnv(locals, "SMTP_SECURE") === "true",
            auth:
              getEnv(locals, "SMTP_USER") && getEnv(locals, "SMTP_PASS")
                ? {
                    user: getEnv(locals, "SMTP_USER")!,
                    pass: getEnv(locals, "SMTP_PASS")!,
                  }
                : undefined,
          }
        : undefined,
    ses:
      provider === "ses"
        ? {
            region: getEnv(locals, "AWS_REGION") || "us-east-1",
          }
        : undefined,
  };
}

export async function sendEmail(message: EmailMessage, locals: App.Locals): Promise<boolean> {
  const provider = createEmailProvider(getEmailConfig(locals));
  return provider.send(message);
}
