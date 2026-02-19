import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn().mockResolvedValue({});
const mockCommandInstances: Array<{ input: unknown }> = [];

vi.mock("@aws-sdk/client-sesv2", () => ({
  SESv2Client: class {
    send = mockSend;
  },
  SendEmailCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
      mockCommandInstances.push(this);
    }
  },
}));

import { SesEmailProvider } from "./ses";
import type { EmailConfig } from "@/lib/config";

const sesConfig: EmailConfig = {
  provider: "ses",
  from: "no-reply@democracy-direct.com",
  smtp: undefined,
  ses: { region: "us-west-1", accessKeyId: undefined, secretAccessKey: undefined },
};

describe("SesEmailProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCommandInstances.length = 0;
  });

  it("includes FromEmailAddress in SendEmailCommand", async () => {
    const provider = new SesEmailProvider(sesConfig);

    await provider.send({
      to: "user@example.com",
      subject: "Test",
      text: "Hello",
    });

    expect(mockCommandInstances).toHaveLength(1);
    expect(mockCommandInstances[0].input).toEqual(
      expect.objectContaining({
        FromEmailAddress: "no-reply@democracy-direct.com",
      })
    );
  });

  it("includes raw MIME content with correct headers", async () => {
    const provider = new SesEmailProvider(sesConfig);

    await provider.send({
      to: "user@example.com",
      subject: "Test",
      text: "Hello",
    });

    expect(mockCommandInstances).toHaveLength(1);
    const input = mockCommandInstances[0].input as {
      Content: { Raw: { Data: Uint8Array } };
    };
    const rawEmail = new TextDecoder().decode(input.Content.Raw.Data);
    expect(rawEmail).toContain("From: no-reply@democracy-direct.com");
    expect(rawEmail).toContain("To: user@example.com");
    expect(rawEmail).toContain("Subject: Test");
    expect(rawEmail).toContain("Hello");
  });
});
