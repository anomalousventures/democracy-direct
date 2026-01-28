import type { EmailMessage, EmailProvider } from "../types";

export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<boolean> {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "⚠️  ConsoleEmailProvider should NOT be used in production! " +
          "Configure EMAIL_PROVIDER=smtp or EMAIL_PROVIDER=ses"
      );
      return false;
    }

    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📧 EMAIL (Console Provider - LOCAL DEVELOPMENT ONLY)");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`To:      ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    console.log("───────────────────────────────────────────────────────────");
    console.log(message.text);
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");
    return true;
  }
}
