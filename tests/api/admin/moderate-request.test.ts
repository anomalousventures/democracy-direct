import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/pages/api/admin/moderate/[templateId]/request";
import { ADMIN_TRUST_LEVEL } from "@/lib/admin";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  })),
}));

vi.mock("@/lib/moderation/openai", () => ({
  moderateContent: vi.fn(),
}));

vi.mock("@/lib/moderation/decision", () => ({
  makeModerationDecision: vi.fn(),
  scoresToRecord: vi.fn((scores) => scores),
}));

import { createDb } from "@/db/client";
import { moderateContent } from "@/lib/moderation/openai";
import { makeModerationDecision } from "@/lib/moderation/decision";

function createMockLocals(
  user: { id: string; trustLevel: number } | null,
  openaiApiKey = "test-key"
) {
  return {
    user,
    runtime: {
      env: {
        DATABASE_URL: "postgres://test",
        TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
        TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
        OPENAI_API_KEY: openaiApiKey,
      },
    },
  };
}

describe("POST /api/admin/moderate/[templateId]/request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const response = await POST({
      params: { templateId: VALID_UUID },
      locals: createMockLocals(null),
      request: new Request(`http://localhost/api/admin/moderate/${VALID_UUID}/request`, {
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    const response = await POST({
      params: { templateId: VALID_UUID },
      locals: createMockLocals({ id: "user-123", trustLevel: 1 }),
      request: new Request(`http://localhost/api/admin/moderate/${VALID_UUID}/request`, {
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(403);
  });

  it("returns 400 when templateId is missing", async () => {
    const response = await POST({
      params: {},
      locals: createMockLocals({ id: "admin-123", trustLevel: ADMIN_TRUST_LEVEL }),
      request: new Request("http://localhost/api/admin/moderate//request", {
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Template ID is required");
  });

  it("returns 400 for invalid templateId format", async () => {
    const response = await POST({
      params: { templateId: "not-a-uuid" },
      locals: createMockLocals({ id: "admin-123", trustLevel: ADMIN_TRUST_LEVEL }),
      request: new Request("http://localhost/api/admin/moderate/not-a-uuid/request", {
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid template ID format");
  });

  it("returns 404 when template not found", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    vi.mocked(createDb).mockReturnValue(mockDb as never);

    const response = await POST({
      params: { templateId: VALID_UUID },
      locals: createMockLocals({ id: "admin-123", trustLevel: ADMIN_TRUST_LEVEL }),
      request: new Request(`http://localhost/api/admin/moderate/${VALID_UUID}/request`, {
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Template not found");
  });

  it("requests moderation and returns result", async () => {
    const mockTemplate = {
      id: VALID_UUID,
      title: "Test Title",
      body: "Test body",
      moderationStatus: "pending",
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockTemplate]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    vi.mocked(createDb).mockReturnValue(mockDb as never);

    vi.mocked(moderateContent).mockResolvedValue({
      flagged: false,
      categories: {},
      categoryScores: { harassment: 0.01, hate: 0.02 },
    } as never);

    vi.mocked(makeModerationDecision).mockReturnValue({
      decision: "approve",
      reason: "Auto-approved",
      highestCategory: "hate",
      highestScore: 0.02,
      flagged: false,
    });

    const response = await POST({
      params: { templateId: VALID_UUID },
      locals: createMockLocals({ id: "admin-123", trustLevel: ADMIN_TRUST_LEVEL }),
      request: new Request(`http://localhost/api/admin/moderate/${VALID_UUID}/request`, {
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.templateId).toBe(VALID_UUID);
    expect(data.decision).toBe("approve");
    expect(data.newStatus).toBe("approved");
    expect(data.previousStatus).toBe("pending");
    expect(moderateContent).toHaveBeenCalledWith("Test Title\n\nTest body", "test-key");
  });

  it("returns 500 when OpenAI API key is not configured", async () => {
    const mockTemplate = {
      id: VALID_UUID,
      title: "Test Title",
      body: "Test body",
      moderationStatus: "pending",
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockTemplate]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    vi.mocked(createDb).mockReturnValue(mockDb as never);

    const response = await POST({
      params: { templateId: VALID_UUID },
      locals: createMockLocals({ id: "admin-123", trustLevel: ADMIN_TRUST_LEVEL }, ""),
      request: new Request(`http://localhost/api/admin/moderate/${VALID_UUID}/request`, {
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("OpenAI API key not configured");
  });
});
