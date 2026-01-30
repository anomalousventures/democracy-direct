import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareButtons } from "./ShareButtons";

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe("ShareButtons", () => {
  const mockWriteText = vi.fn();
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global, "navigator", {
      value: {
        clipboard: { writeText: mockWriteText },
        share: undefined,
      },
      writable: true,
      configurable: true,
    });
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  describe("template page type", () => {
    it("renders all platform share buttons", () => {
      render(
        <ShareButtons
          url="https://example.com/templates/test"
          title="Test Template"
          pageType="template"
        />
      );

      expect(screen.getByLabelText("Share on X (Twitter)")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on Facebook")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on Reddit")).toBeInTheDocument();
      expect(screen.getByLabelText("Share via Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Copy link to clipboard")).toBeInTheDocument();
    });

    it("shows success toast when copy link succeeds", async () => {
      render(
        <ShareButtons
          url="https://example.com/templates/test"
          title="Test Template"
          pageType="template"
        />
      );

      const copyButton = screen.getByLabelText("Copy link to clipboard");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText("Link copied to clipboard!")).toBeInTheDocument();
      });

      expect(mockWriteText).toHaveBeenCalledWith("https://example.com/templates/test");
    });

    it("shows error toast when copy link fails", async () => {
      mockWriteText.mockRejectedValue(new Error("Clipboard error"));

      render(
        <ShareButtons
          url="https://example.com/templates/test"
          title="Test Template"
          pageType="template"
        />
      );

      const copyButton = screen.getByLabelText("Copy link to clipboard");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to copy link")).toBeInTheDocument();
      });
    });

    it("opens Twitter share in new window", () => {
      const mockOpen = vi.fn();
      vi.stubGlobal("open", mockOpen);

      render(
        <ShareButtons
          url="https://example.com/templates/test"
          title="Test Template"
          pageType="template"
        />
      );

      const twitterButton = screen.getByLabelText("Share on X (Twitter)");
      fireEvent.click(twitterButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining("twitter.com/intent/tweet"),
        "_blank",
        "noopener,noreferrer"
      );

      vi.unstubAllGlobals();
    });

    it("includes hashtags in Twitter share URL", () => {
      const mockOpen = vi.fn();
      vi.stubGlobal("open", mockOpen);

      render(
        <ShareButtons
          url="https://example.com/templates/test"
          title="Test Template"
          pageType="template"
        />
      );

      const twitterButton = screen.getByLabelText("Share on X (Twitter)");
      fireEvent.click(twitterButton);

      const shareUrl = mockOpen.mock.calls[0][0];
      expect(shareUrl).toContain(encodeURIComponent("#CivicEngagement"));
      expect(shareUrl).toContain(encodeURIComponent("#ContactCongress"));

      vi.unstubAllGlobals();
    });
  });

  describe("rep page type", () => {
    it("renders all platform share buttons for rep page", () => {
      render(
        <ShareButtons
          url="https://example.com/rep/S000033"
          title="Contact Bernie Sanders"
          pageType="rep"
          repInfo={{ name: "Bernie Sanders", party: "I", state: "VT" }}
        />
      );

      expect(screen.getByLabelText("Share on X (Twitter)")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on Facebook")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on Reddit")).toBeInTheDocument();
      expect(screen.getByLabelText("Share via Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Copy link to clipboard")).toBeInTheDocument();
    });

    it("includes rep info in Twitter share URL", () => {
      const mockOpen = vi.fn();
      vi.stubGlobal("open", mockOpen);

      render(
        <ShareButtons
          url="https://example.com/rep/S000033"
          title="Contact Bernie Sanders"
          pageType="rep"
          repInfo={{ name: "Bernie Sanders", party: "I", state: "VT" }}
        />
      );

      const twitterButton = screen.getByLabelText("Share on X (Twitter)");
      fireEvent.click(twitterButton);

      const shareUrl = mockOpen.mock.calls[0][0];
      expect(shareUrl).toContain(encodeURIComponent("Bernie Sanders"));
      expect(shareUrl).toContain(encodeURIComponent("(I-VT)"));

      vi.unstubAllGlobals();
    });
  });

  describe("Web Share API", () => {
    it("shows native share button when Web Share API is available", async () => {
      Object.defineProperty(global, "navigator", {
        value: {
          clipboard: { writeText: mockWriteText },
          share: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true,
      });

      render(
        <ShareButtons
          url="https://example.com/templates/test"
          title="Test Template"
          pageType="template"
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText("Share this page")).toBeInTheDocument();
      });
    });
  });

  describe("email share", () => {
    it("renders email link with mailto href", () => {
      render(
        <ShareButtons
          url="https://example.com/templates/test"
          title="Test Template"
          pageType="template"
        />
      );

      const emailLink = screen.getByLabelText("Share via Email");
      expect(emailLink).toHaveAttribute("href", expect.stringContaining("mailto:"));
    });
  });
});
