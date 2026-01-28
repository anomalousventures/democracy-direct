import type { EmailConfig, EmailMessage, EmailProvider } from "./types";
import { getConfig } from "@/lib/config";

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
  const config = getConfig(locals);
  const { email } = config;

  return {
    provider: email.provider,
    from: email.from,
    smtp:
      email.provider === "smtp"
        ? {
            host: email.smtp?.host || "localhost",
            port: email.smtp?.port || 1025,
            secure: email.smtp?.secure || false,
            auth:
              email.smtp?.user && email.smtp?.pass
                ? {
                    user: email.smtp.user,
                    pass: email.smtp.pass,
                  }
                : undefined,
          }
        : undefined,
    ses:
      email.provider === "ses"
        ? {
            region: email.awsRegion,
          }
        : undefined,
  };
}

export async function sendEmail(message: EmailMessage, locals: App.Locals): Promise<boolean> {
  const provider = await createEmailProvider(getEmailConfig(locals));
  return provider.send(message);
}
