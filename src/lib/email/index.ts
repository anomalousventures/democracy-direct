import type { EmailConfig, EmailMessage, EmailProvider } from "./types";
import { ConsoleEmailProvider } from "./providers/console";
import { SmtpEmailProvider } from "./providers/smtp";
import { SesEmailProvider } from "./providers/ses";

export type { EmailConfig, EmailMessage, EmailProvider };

let emailProvider: EmailProvider | null = null;

export function createEmailProvider(config: EmailConfig): EmailProvider {
  switch (config.provider) {
    case "smtp":
      return new SmtpEmailProvider(config);
    case "ses":
      return new SesEmailProvider(config);
    case "console":
    default:
      return new ConsoleEmailProvider();
  }
}

export function getEmailConfig(): EmailConfig {
  const provider = (import.meta.env.EMAIL_PROVIDER || "console") as EmailConfig["provider"];

  return {
    provider,
    from: import.meta.env.EMAIL_FROM || "noreply@democracy-direct.com",
    smtp:
      provider === "smtp"
        ? {
            host: import.meta.env.SMTP_HOST || "localhost",
            port: parseInt(import.meta.env.SMTP_PORT || "1025", 10),
            secure: import.meta.env.SMTP_SECURE === "true",
            auth:
              import.meta.env.SMTP_USER && import.meta.env.SMTP_PASS
                ? {
                    user: import.meta.env.SMTP_USER,
                    pass: import.meta.env.SMTP_PASS,
                  }
                : undefined,
          }
        : undefined,
    ses:
      provider === "ses"
        ? {
            region: import.meta.env.AWS_REGION || "us-east-1",
          }
        : undefined,
  };
}

export function getEmailProvider(): EmailProvider {
  if (!emailProvider) {
    emailProvider = createEmailProvider(getEmailConfig());
  }
  return emailProvider;
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const provider = getEmailProvider();
  return provider.send(message);
}
