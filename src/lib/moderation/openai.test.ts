import { describe, it, expect, vi, beforeEach } from "vitest";
import { moderateContent, getHighestCategoryScore, type ModerationCategory } from "./openai";

describe("OpenAI Moderation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("moderateContent", () => {
    it("throws error when API key is missing", async () => {
      await expect(moderateContent("test content", "")).rejects.toThrow(
        "OpenAI API key is required"
      );
    });

    it("throws error when content is empty", async () => {
      await expect(moderateContent("", "test-api-key")).rejects.toThrow(
        "Content is required for moderation"
      );
    });

    it("calls API with correct parameters", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "modr-123",
            model: "text-moderation-007",
            results: [
              {
                flagged: false,
                categories: { harassment: false },
                category_scores: {
                  harassment: 0.001,
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
                },
              },
            ],
          }),
      });

      global.fetch = mockFetch;

      await moderateContent("test content", "test-api-key");

      expect(mockFetch).toHaveBeenCalledWith("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
        body: JSON.stringify({ input: "test content" }),
      });
    });

    it("parses response correctly", async () => {
      const mockResponse = {
        id: "modr-123",
        model: "text-moderation-007",
        results: [
          {
            flagged: true,
            categories: {
              harassment: true,
              hate: false,
            },
            category_scores: {
              harassment: 0.85,
              "harassment/threatening": 0,
              hate: 0.01,
              "hate/threatening": 0,
              "self-harm": 0,
              "self-harm/intent": 0,
              "self-harm/instructions": 0,
              sexual: 0,
              "sexual/minors": 0,
              violence: 0,
              "violence/graphic": 0,
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await moderateContent("test content", "test-api-key");

      expect(result.flagged).toBe(true);
      expect(result.categories.harassment).toBe(true);
      expect(result.categoryScores.harassment).toBe(0.85);
    });

    it("handles API errors gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      await expect(moderateContent("test content", "bad-key")).rejects.toThrow(
        "OpenAI Moderation API error: 401"
      );
    });

    it("handles invalid response format", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: "structure" }),
      });

      await expect(moderateContent("test content", "test-api-key")).rejects.toThrow(
        "Invalid response format from OpenAI Moderation API"
      );
    });

    it("handles empty results array", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "modr-123",
            model: "text-moderation-007",
            results: [],
          }),
      });

      await expect(moderateContent("test content", "test-api-key")).rejects.toThrow(
        "Empty results from OpenAI Moderation API"
      );
    });
  });

  describe("getHighestCategoryScore", () => {
    it("returns the highest scoring category", () => {
      const scores: ModerationCategory = {
        harassment: 0.1,
        "harassment/threatening": 0.05,
        hate: 0.8,
        "hate/threatening": 0.02,
        "self-harm": 0.01,
        "self-harm/intent": 0.01,
        "self-harm/instructions": 0.01,
        sexual: 0.03,
        "sexual/minors": 0.001,
        violence: 0.2,
        "violence/graphic": 0.1,
      };

      const result = getHighestCategoryScore(scores);

      expect(result.category).toBe("hate");
      expect(result.score).toBe(0.8);
    });

    it("handles all zero scores", () => {
      const scores: ModerationCategory = {
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
      };

      const result = getHighestCategoryScore(scores);

      expect(result.score).toBe(0);
    });
  });
});
