import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareButtons } from "./ShareButtons";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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
        expect(toast.success).toHaveBeenCalledWith("Link copied to clipboard!");
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
        expect(toast.error).toHaveBeenCalledWith("Failed to copy link");
      });
    });

    it("renders Twitter share as link with correct href", () => {
      render(
        <ShareButtons
          url="https://example.com/templates/test"
          title="Test Template"
          pageType="template"
        />
      );

      const twitterLink = screen.getByLabelText("Share on X (Twitter)");
      expect(twitterLink).toHaveAttribute(
        "href",
        expect.stringContaining("twitter.com/intent/tweet")
      );
      expect(twitterLink).toHaveAttribute("target", "_blank");
      expect(twitterLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("includes hashtags in Twitter share URL", () => {
      render(
        <ShareButtons
          url="https://example.com/templates/test"
          title="Test Template"
          pageType="template"
        />
      );

      const twitterLink = screen.getByLabelText("Share on X (Twitter)");
      const shareUrl = twitterLink.getAttribute("href") || "";
      expect(shareUrl).toContain(encodeURIComponent("#CivicEngagement"));
      expect(shareUrl).toContain(encodeURIComponent("#ContactCongress"));
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
      render(
        <ShareButtons
          url="https://example.com/rep/S000033"
          title="Contact Bernie Sanders"
          pageType="rep"
          repInfo={{ name: "Bernie Sanders", party: "I", state: "VT" }}
        />
      );

      const twitterLink = screen.getByLabelText("Share on X (Twitter)");
      const shareUrl = twitterLink.getAttribute("href") || "";
      expect(shareUrl).toContain(encodeURIComponent("Bernie Sanders"));
      expect(shareUrl).toContain(encodeURIComponent("(I-VT)"));
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
