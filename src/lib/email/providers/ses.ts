import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { EmailMessage, EmailProvider } from "../types";
import type { EmailConfig } from "@/lib/config";

export class SesEmailProvider implements EmailProvider {
  private client: SESv2Client;
  private from: string;

  constructor(config: EmailConfig) {
    if (!config.ses) {
      throw new Error("SES configuration required for SesEmailProvider");
    }

    this.from = config.from;

    const hasAccessKey = Boolean(config.ses.accessKeyId);
    const hasSecretKey = Boolean(config.ses.secretAccessKey);
    console.log("SES config:", {
      region: config.ses.region,
      hasAccessKey,
      hasSecretKey,
      accessKeyPrefix: config.ses.accessKeyId?.substring(0, 4),
    });

    this.client = new SESv2Client({
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
      console.info("SES sending email:", {
        from: this.from,
        to: message.to,
        subject: message.subject,
      });

      const boundary = `boundary_${crypto.randomUUID()}`;
      const emailParts = [
        `From: ${this.from}`,
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
      ];

      if (message.text) {
        emailParts.push(
          `--${boundary}`,
          'Content-Type: text/plain; charset="UTF-8"',
          "Content-Transfer-Encoding: 7bit",
          "",
          message.text,
          ""
        );
      }

      if (message.html) {
        emailParts.push(
          `--${boundary}`,
          'Content-Type: text/html; charset="UTF-8"',
          "Content-Transfer-Encoding: 7bit",
          "",
          message.html,
          ""
        );
      }

      emailParts.push(`--${boundary}--`);

      const rawEmail = emailParts.join("\r\n");

      const command = new SendEmailCommand({
        Content: {
          Raw: {
            Data: new TextEncoder().encode(rawEmail),
          },
        },
      });

      const result = await this.client.send(command);
      console.info("SES send success:", {
        messageId: result.MessageId,
      });
      return true;
    } catch (error) {
      console.error("SES send error:", error);
      return false;
    }
  }
}
