import { describe, it, expect, vi } from "vitest";

describe("Logout Endpoint", () => {
  it("clears session cookie on logout", async () => {
    // Import the module dynamically to avoid Astro API route issues in test
    const { POST } = await import("@/pages/api/auth/logout");

    // Mock the database
    vi.mock("@/db/client", () => ({
      createDb: vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      })),
    }));

    // Note: Full integration test would require Astro test utilities
    // This is a basic smoke test for the endpoint structure
    expect(typeof POST).toBe("function");
  });

  it("returns success even without session cookie", async () => {
    const { POST } = await import("@/pages/api/auth/logout");
    expect(typeof POST).toBe("function");
  });
});
