import nodemailer from "nodemailer";
import type { EmailConfig, EmailMessage, EmailProvider } from "../types";

export class SmtpEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor(config: EmailConfig) {
    if (!config.smtp) {
      throw new Error("SMTP configuration required for SmtpEmailProvider");
    }

    this.from = config.from;
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure ?? false,
      auth: config.smtp.auth,
    });
  }

  async send(message: EmailMessage): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      return true;
    } catch (error) {
      console.error("SMTP send error:", error);
      return false;
    }
  }
}
