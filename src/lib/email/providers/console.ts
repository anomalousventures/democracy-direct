import type { EmailMessage, EmailProvider } from "../types";

export class ConsoleEmailProvider implements EmailProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async send(message: EmailMessage): Promise<boolean> {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "ConsoleEmailProvider should NOT be used in production. " +
          "Configure EMAIL_PROVIDER=smtp or EMAIL_PROVIDER=ses"
      );
      return false;
    }
    return true;
  }
}
