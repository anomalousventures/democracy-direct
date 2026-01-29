import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { EmailMessage, EmailProvider } from "../types";
import type { EmailConfig } from "@/lib/config";

export class SesEmailProvider implements EmailProvider {
  private client: SESClient;
  private from: string;

  constructor(config: EmailConfig) {
    if (!config.ses) {
      throw new Error("SES configuration required for SesEmailProvider");
    }

    this.from = config.from;
    this.client = new SESClient({
      region: config.ses.region,
      credentials:
        config.ses.accessKeyId && config.ses.secretAccessKey
          ? {
              accessKeyId: config.ses.accessKeyId,
              secretAccessKey: config.ses.secretAccessKey,
            }
          : undefined,
    });
  }

  async send(message: EmailMessage): Promise<boolean> {
    try {
      const command = new SendEmailCommand({
        Source: this.from,
        Destination: {
          ToAddresses: [message.to],
        },
        Message: {
          Subject: {
            Data: message.subject,
            Charset: "UTF-8",
          },
          Body: {
            Text: message.text
              ? {
                  Data: message.text,
                  Charset: "UTF-8",
                }
              : undefined,
            Html: message.html
              ? {
                  Data: message.html,
                  Charset: "UTF-8",
                }
              : undefined,
          },
        },
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error("SES send error:", error);
      return false;
    }
  }
}
