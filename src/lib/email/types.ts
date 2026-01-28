export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<boolean>;
}

export interface EmailConfig {
  provider: "smtp" | "ses" | "console";
  smtp?: {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
  ses?: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  from: string;
}
