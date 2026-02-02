import type { EmailMessage, EmailProvider } from "./types";
import { getConfig, type EmailConfig } from "@/lib/config";
import type { Logger } from "@/lib/logger";

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

export async function sendEmail(
  message: EmailMessage,
  locals: App.Locals,
  logger?: Logger
): Promise<boolean> {
  const config = getEmailConfig(locals);
  const provider = await createEmailProvider(config);

  try {
    await provider.send(message);
    return true;
  } catch (error) {
    logger?.error("email_send_error", {
      provider: config.provider,
      subject: message.subject,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}
