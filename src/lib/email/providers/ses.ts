import type { EmailConfig, EmailMessage, EmailProvider } from "../types";

export class SesEmailProvider implements EmailProvider {
  private from: string;
  private region: string;

  constructor(config: EmailConfig) {
    if (!config.ses) {
      throw new Error("SES configuration required for SesEmailProvider");
    }

    this.from = config.from;
    this.region = config.ses.region;
  }

  async send(message: EmailMessage): Promise<boolean> {
    // TODO: Implement AWS SES sending
    // Will need @aws-sdk/client-ses when ready for production
    console.warn("SES provider not yet implemented, falling back to console");
    console.log(`Would send to ${message.to}: ${message.subject}`);
    return true;
  }
}
