import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ModerationCategory } from "@/lib/moderation/openai";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => mockDb),
}));

vi.mock("@/lib/moderation/openai", () => ({
  moderateContent: vi.fn(),
}));

vi.mock("@/lib/moderation/decision", () => ({
  makeModerationDecision: vi.fn(),
  scoresToRecord: vi.fn((scores) => scores),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { processPendingModeration, sendDiscordNotification } from "./moderate-pending";
import { createDb } from "@/db/client";
import { moderateContent } from "@/lib/moderation/openai";
import { makeModerationDecision } from "@/lib/moderation/decision";

function createMockCategoryScores(overrides: Partial<ModerationCategory> = {}): ModerationCategory {
  return {
    harassment: 0,
    "harassment/threatening": 0,
    hate: 0,
    "hate/threatening": 0,
    "self-harm": 0,
    "self-harm/intent": 0,
    "self-harm/instructions": 0,
    sexual: 0,
    "sexual/minors": 0,
    violence: 0,
    "violence/graphic": 0,
    ...overrides,
  };
}

describe("processPendingModeration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.limit.mockResolvedValue([]);
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("throws if DATABASE_URL is missing and not in env", async () => {
    const originalEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      await expect(processPendingModeration(undefined, "api-key")).rejects.toThrow(
        "DATABASE_URL environment variable is required"
      );
    } finally {
      if (originalEnv) {
        process.env.DATABASE_URL = originalEnv;
      }
    }
  });

  it("throws if OPENAI_API_KEY is missing and not in env", async () => {
    const originalEnv = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      await expect(processPendingModeration("postgres://test", undefined)).rejects.toThrow(
        "OPENAI_API_KEY environment variable is required"
      );
    } finally {
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      }
    }
  });

  it("processes templates with pending status and null scores", async () => {
    const pendingTemplates = [{ id: "tpl-1", title: "Test Title", body: "Test body content" }];

    mockDb.limit.mockResolvedValue(pendingTemplates);

    vi.mocked(moderateContent).mockResolvedValue({
      flagged: false,
      categories: {},
      categoryScores: createMockCategoryScores({ harassment: 0.01, hate: 0.02 }),
    });

    vi.mocked(makeModerationDecision).mockReturnValue({
      decision: "approve",
      reason: "Auto-approved",
      highestCategory: "hate",
      highestScore: 0.02,
      flagged: false,
    });

    const result = await processPendingModeration("postgres://test", "api-key", { delayMs: 0 });

    expect(result.total).toBe(1);
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(result.needsReview).toBe(0);

    expect(moderateContent).toHaveBeenCalledWith("Test Title\n\nTest body content", "api-key");
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("updates status based on moderation decision", async () => {
    const pendingTemplates = [{ id: "tpl-2", title: "Flagged", body: "Bad content" }];

    mockDb.limit.mockResolvedValue(pendingTemplates);

    vi.mocked(moderateContent).mockResolvedValue({
      flagged: true,
      categories: { harassment: true },
      categoryScores: createMockCategoryScores({ harassment: 0.9 }),
    });

    vi.mocked(makeModerationDecision).mockReturnValue({
      decision: "reject",
      reason: "Content flagged",
      highestCategory: "harassment",
      highestScore: 0.9,
      flagged: true,
    });

    const result = await processPendingModeration("postgres://test", "api-key", { delayMs: 0 });

    expect(result.processed).toBe(1);
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        moderationStatus: "rejected",
      })
    );
  });

  it("handles errors gracefully and continues processing", async () => {
    const pendingTemplates = [
      { id: "tpl-1", title: "First", body: "First body" },
      { id: "tpl-2", title: "Second", body: "Second body" },
    ];

    mockDb.limit.mockResolvedValue(pendingTemplates);

    vi.mocked(moderateContent)
      .mockRejectedValueOnce(new Error("API error"))
      .mockResolvedValueOnce({
        flagged: false,
        categories: {},
        categoryScores: createMockCategoryScores({ harassment: 0.01 }),
      });

    vi.mocked(makeModerationDecision).mockReturnValue({
      decision: "approve",
      reason: "Auto-approved",
      highestCategory: "harassment",
      highestScore: 0.01,
      flagged: false,
    });

    const result = await processPendingModeration("postgres://test", "api-key", { delayMs: 0 });

    expect(result.total).toBe(2);
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(1);
  });

  it("returns summary with counts", async () => {
    mockDb.limit.mockResolvedValue([]);

    const result = await processPendingModeration("postgres://test", "api-key");

    expect(result).toEqual({
      total: 0,
      processed: 0,
      errors: 0,
      needsReview: 0,
    });
  });

  it("respects limit option", async () => {
    mockDb.limit.mockResolvedValue([]);

    await processPendingModeration("postgres://test", "api-key", { limit: 10 });

    expect(mockDb.limit).toHaveBeenCalledWith(10);
  });

  it("calls createDb with provided database URL", async () => {
    mockDb.limit.mockResolvedValue([]);

    await processPendingModeration("postgres://custom-url", "api-key");

    expect(createDb).toHaveBeenCalledWith("postgres://custom-url");
  });

  it("tracks items that need manual review", async () => {
    const pendingTemplates = [
      { id: "tpl-1", title: "Borderline", body: "Borderline content" },
      { id: "tpl-2", title: "Safe", body: "Safe content" },
    ];

    mockDb.limit.mockResolvedValue(pendingTemplates);

    vi.mocked(moderateContent).mockResolvedValue({
      flagged: false,
      categories: {},
      categoryScores: createMockCategoryScores({ harassment: 0.3 }),
    });

    vi.mocked(makeModerationDecision)
      .mockReturnValueOnce({
        decision: "review",
        reason: "Needs manual review",
        highestCategory: "harassment",
        highestScore: 0.3,
        flagged: false,
      })
      .mockReturnValueOnce({
        decision: "approve",
        reason: "Auto-approved",
        highestCategory: "harassment",
        highestScore: 0.1,
        flagged: false,
      });

    const result = await processPendingModeration("postgres://test", "api-key", { delayMs: 0 });

    expect(result.needsReview).toBe(1);
    expect(result.processed).toBe(2);
  });

  it("sends Discord notification when items need review", async () => {
    const pendingTemplates = [{ id: "tpl-1", title: "Borderline", body: "Borderline content" }];

    mockDb.limit.mockResolvedValue(pendingTemplates);

    vi.mocked(moderateContent).mockResolvedValue({
      flagged: false,
      categories: {},
      categoryScores: createMockCategoryScores({ harassment: 0.3 }),
    });

    vi.mocked(makeModerationDecision).mockReturnValue({
      decision: "review",
      reason: "Needs manual review",
      highestCategory: "harassment",
      highestScore: 0.3,
      flagged: false,
    });

    await processPendingModeration("postgres://test", "api-key", {
      delayMs: 0,
      discordWebhookUrl: "https://discord.com/webhook/test",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://discord.com/webhook/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("sends Discord notification on API errors", async () => {
    const pendingTemplates = [{ id: "tpl-1", title: "Test", body: "Test content" }];

    mockDb.limit.mockResolvedValue(pendingTemplates);
    vi.mocked(moderateContent).mockRejectedValue(new Error("API error"));

    await processPendingModeration("postgres://test", "api-key", {
      delayMs: 0,
      discordWebhookUrl: "https://discord.com/webhook/test",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://discord.com/webhook/test",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("does not send Discord notification when everything is fine", async () => {
    const pendingTemplates = [{ id: "tpl-1", title: "Safe", body: "Safe content" }];

    mockDb.limit.mockResolvedValue(pendingTemplates);

    vi.mocked(moderateContent).mockResolvedValue({
      flagged: false,
      categories: {},
      categoryScores: createMockCategoryScores({ harassment: 0.01 }),
    });

    vi.mocked(makeModerationDecision).mockReturnValue({
      decision: "approve",
      reason: "Auto-approved",
      highestCategory: "harassment",
      highestScore: 0.01,
      flagged: false,
    });

    await processPendingModeration("postgres://test", "api-key", {
      delayMs: 0,
      discordWebhookUrl: "https://discord.com/webhook/test",
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("sendDiscordNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("sends notification with needsReview message", async () => {
    await sendDiscordNotification("https://discord.com/webhook/test", {
      total: 10,
      processed: 10,
      errors: 0,
      needsReview: 3,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://discord.com/webhook/test",
      expect.objectContaining({ method: "POST" })
    );

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.content).toContain("3");
    expect(body.content).toContain("need admin review");
  });

  it("sends notification with error message", async () => {
    await sendDiscordNotification("https://discord.com/webhook/test", {
      total: 10,
      processed: 8,
      errors: 2,
      needsReview: 0,
    });

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.content).toContain("2");
    expect(body.content).toContain("error");
  });

  it("does not send notification when nothing to report", async () => {
    await sendDiscordNotification("https://discord.com/webhook/test", {
      total: 10,
      processed: 10,
      errors: 0,
      needsReview: 0,
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws on webhook failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, statusText: "Bad Request" });

    await expect(
      sendDiscordNotification("https://discord.com/webhook/test", {
        total: 10,
        processed: 10,
        errors: 0,
        needsReview: 1,
      })
    ).rejects.toThrow("Discord webhook failed: 400 Bad Request");
  });
});
