import type { EmailConfig, EmailMessage, EmailProvider } from "./types";
import { getEnv } from "@/lib/env";

export type { EmailConfig, EmailMessage, EmailProvider };

async function createEmailProvider(config: EmailConfig): Promise<EmailProvider> {
  switch (config.provider) {
    case "smtp": {
      const { SmtpEmailProvider } = await import("./providers/smtp");
      return new SmtpEmailProvider(config);
    }
    case "ses": {
      const { SesEmailProvider } = await import("./providers/ses");
      return new SesEmailProvider(config);
    }
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
  const provider = await createEmailProvider(getEmailConfig(locals));
  return provider.send(message);
}
