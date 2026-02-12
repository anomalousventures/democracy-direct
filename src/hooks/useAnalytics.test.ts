import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/preact";
import { useAnalytics } from "./useAnalytics";

describe("useAnalytics", () => {
  const mockCapture = vi.fn();
  const mockIdentify = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("window", {
      posthog: {
        capture: mockCapture,
        identify: mockIdentify,
        reset: mockReset,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe("capture", () => {
    it("calls posthog.capture with event name", () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.capture("test_event");
      });

      expect(mockCapture).toHaveBeenCalledWith("test_event", undefined);
    });

    it("calls posthog.capture with event name and properties", () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.capture("share_clicked", {
          platform: "twitter",
          url: "https://example.com",
        });
      });

      expect(mockCapture).toHaveBeenCalledWith("share_clicked", {
        platform: "twitter",
        url: "https://example.com",
      });
    });

    it("does nothing when posthog is not available", () => {
      vi.stubGlobal("window", {});
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.capture("test_event");
      });

      expect(mockCapture).not.toHaveBeenCalled();
    });
  });

  describe("identify", () => {
    it("calls posthog.identify with distinct ID", () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.identify("user123");
      });

      expect(mockIdentify).toHaveBeenCalledWith("user123", undefined);
    });

    it("calls posthog.identify with distinct ID and properties", () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.identify("user123", { email: "test@example.com" });
      });

      expect(mockIdentify).toHaveBeenCalledWith("user123", { email: "test@example.com" });
    });

    it("does nothing when posthog is not available", () => {
      vi.stubGlobal("window", {});
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.identify("user123");
      });

      expect(mockIdentify).not.toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    it("calls posthog.reset", () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.reset();
      });

      expect(mockReset).toHaveBeenCalled();
    });

    it("does nothing when posthog is not available", () => {
      vi.stubGlobal("window", {});
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.reset();
      });

      expect(mockReset).not.toHaveBeenCalled();
    });
  });

  describe("invalid posthog object", () => {
    it("handles posthog without capture method", () => {
      vi.stubGlobal("window", {
        posthog: { someOtherMethod: vi.fn() },
      });
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.capture("test_event");
      });

      expect(mockCapture).not.toHaveBeenCalled();
    });

    it("handles posthog as null", () => {
      vi.stubGlobal("window", {
        posthog: null,
      });
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.capture("test_event");
      });

      expect(mockCapture).not.toHaveBeenCalled();
    });
  });
});
