import { describe, it, expect, vi, beforeEach } from "vitest";
import { incrementApprovedTemplatesCount, handleTemplateRejection } from "./user-trust";
import { TRUST_LEVELS } from "./trust-level";

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();

const mockDb = {
  select: mockSelect,
  update: mockUpdate,
};

function setupMockChain() {
  mockSelect.mockReturnValue({ from: mockFrom });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockUpdate.mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: vi.fn() });
}

describe("user-trust", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockChain();
  });

  describe("incrementApprovedTemplatesCount", () => {
    it("does nothing if user not found", async () => {
      mockLimit.mockResolvedValue([]);

      await incrementApprovedTemplatesCount(mockDb as never, "user-123");

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("increments count and calculates trust level for user with 0 approved", async () => {
      mockLimit.mockResolvedValue([{ approvedTemplatesCount: 0 }]);

      await incrementApprovedTemplatesCount(mockDb as never, "user-123");

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          trustLevel: TRUST_LEVELS.NEW_USER,
        })
      );
    });

    it("increments count and promotes to trusted for user reaching 2 approved", async () => {
      mockLimit.mockResolvedValue([{ approvedTemplatesCount: 1 }]);

      await incrementApprovedTemplatesCount(mockDb as never, "user-123");

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          trustLevel: TRUST_LEVELS.TRUSTED,
        })
      );
    });
  });

  describe("handleTemplateRejection", () => {
    it("resets trust level to NEW_USER", async () => {
      await handleTemplateRejection(mockDb as never, "user-123");

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          trustLevel: TRUST_LEVELS.NEW_USER,
        })
      );
    });
  });
});
