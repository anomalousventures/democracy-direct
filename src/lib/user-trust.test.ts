import { describe, it, expect, vi, beforeEach } from "vitest";
import { incrementApprovedTemplatesCount, handleTemplateRejection } from "./user-trust";
import { TRUST_LEVELS } from "./trust-level";

const mockReturning = vi.fn();
const mockUpdateWhere = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn();
const mockSelect = vi.fn();

const mockDb = {
  update: mockUpdate,
  select: mockSelect,
};

function setupMockChain() {
  mockUpdate.mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockReturnValue({ returning: mockReturning });

  mockSelect.mockReturnValue({ from: mockSelectFrom });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
}

describe("user-trust", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockChain();
  });

  describe("incrementApprovedTemplatesCount", () => {
    it("does nothing if user not found", async () => {
      mockReturning.mockResolvedValue([]);

      await incrementApprovedTemplatesCount(mockDb as never, "user-123");

      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it("does not update trust level for banned users", async () => {
      mockReturning.mockResolvedValueOnce([
        { approvedTemplatesCount: 5, trustLevel: TRUST_LEVELS.BANNED },
      ]);

      await incrementApprovedTemplatesCount(mockDb as never, "user-123");

      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it("increments count and calculates trust level for user with 1 approved", async () => {
      mockReturning.mockResolvedValueOnce([
        { approvedTemplatesCount: 1, trustLevel: TRUST_LEVELS.NEW_USER },
      ]);

      await incrementApprovedTemplatesCount(mockDb as never, "user-123");

      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it("increments count and promotes to trusted for user reaching 2 approved", async () => {
      mockReturning.mockResolvedValueOnce([
        { approvedTemplatesCount: 2, trustLevel: TRUST_LEVELS.NEW_USER },
      ]);

      await incrementApprovedTemplatesCount(mockDb as never, "user-123");

      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockSet).toHaveBeenLastCalledWith({ trustLevel: TRUST_LEVELS.TRUSTED });
    });

    it("does not update if trust level unchanged", async () => {
      mockReturning.mockResolvedValueOnce([
        { approvedTemplatesCount: 5, trustLevel: TRUST_LEVELS.TRUSTED },
      ]);

      await incrementApprovedTemplatesCount(mockDb as never, "user-123");

      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleTemplateRejection", () => {
    it("resets trust level to NEW_USER", async () => {
      mockSelectLimit.mockResolvedValueOnce([{ trustLevel: TRUST_LEVELS.TRUSTED }]);

      await handleTemplateRejection(mockDb as never, "user-123");

      expect(mockSelect).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({ trustLevel: TRUST_LEVELS.NEW_USER });
    });

    it("does not reset trust level for banned users", async () => {
      mockSelectLimit.mockResolvedValueOnce([{ trustLevel: TRUST_LEVELS.BANNED }]);

      await handleTemplateRejection(mockDb as never, "user-123");

      expect(mockSelect).toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("does nothing if user not found", async () => {
      mockSelectLimit.mockResolvedValueOnce([]);

      await handleTemplateRejection(mockDb as never, "user-123");

      expect(mockSelect).toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
