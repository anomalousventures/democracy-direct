import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/pages/api/auth/logout";

const mockDelete = vi.fn();
const mockWhere = vi.fn();
vi.mock("@/db/client", () => ({
  createDb: vi.fn(() => ({
    delete: mockDelete,
  })),
}));

describe("Logout Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue(undefined);
  });

  it("deletes session from database and clears cookie", async () => {
    const deletedCookies: string[] = [];
    const mockCookies = {
      get: vi.fn().mockReturnValue({ value: "test-session-id" }),
      delete: vi.fn((name: string) => deletedCookies.push(name)),
    };

    const response = await POST({
      cookies: mockCookies,
      locals: { runtime: { env: { DATABASE_URL: "postgres://test" } } },
    } as never);

    expect(response.status).toBe(200);
    expect(mockDelete).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
    expect(deletedCookies).toContain("session");

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("clears cookie even without existing session", async () => {
    const deletedCookies: string[] = [];
    const mockCookies = {
      get: vi.fn().mockReturnValue(undefined),
      delete: vi.fn((name: string) => deletedCookies.push(name)),
    };

    const response = await POST({
      cookies: mockCookies,
      locals: { runtime: { env: { DATABASE_URL: "postgres://test" } } },
    } as never);

    expect(response.status).toBe(200);
    expect(mockDelete).not.toHaveBeenCalled();
    expect(deletedCookies).toContain("session");
  });

  it("returns success even if database delete fails", async () => {
    mockWhere.mockRejectedValue(new Error("DB error"));
    const deletedCookies: string[] = [];
    const mockCookies = {
      get: vi.fn().mockReturnValue({ value: "test-session-id" }),
      delete: vi.fn((name: string) => deletedCookies.push(name)),
    };
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST({
      cookies: mockCookies,
      locals: { runtime: { env: { DATABASE_URL: "postgres://test" } } },
    } as never);

    expect(response.status).toBe(200);
    expect(consoleSpy).toHaveBeenCalled();
    expect(deletedCookies).toContain("session");

    consoleSpy.mockRestore();
  });
});
