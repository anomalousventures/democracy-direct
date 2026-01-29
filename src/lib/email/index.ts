import type { EmailMessage, EmailProvider } from "./types";
import { getConfig, type EmailConfig } from "@/lib/config";

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
  return getConfig(locals).email;
}

export async function sendEmail(message: EmailMessage, locals: App.Locals): Promise<boolean> {
  const config = getEmailConfig(locals);
  console.info("Email provider:", config.provider);
  const provider = await createEmailProvider(config);
  const result = await provider.send(message);
  console.info("Email send result:", result);
  return result;
}
