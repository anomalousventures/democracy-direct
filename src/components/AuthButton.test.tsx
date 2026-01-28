import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthButton } from "./AuthButton";

describe("AuthButton", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    Object.defineProperty(window, "location", {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  describe("when logged out", () => {
    it("shows Sign In button", () => {
      render(<AuthButton isLoggedIn={false} />);
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("opens login dialog when clicking Sign In", async () => {
      const user = userEvent.setup();
      render(<AuthButton isLoggedIn={false} />);

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("when logged in", () => {
    it("shows user indicator icon", () => {
      render(<AuthButton isLoggedIn={true} />);
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });

    it("shows Sign Out button", () => {
      render(<AuthButton isLoggedIn={true} />);
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });

    it("calls logout API when clicking Sign Out", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({ ok: true });

      render(<AuthButton isLoggedIn={true} />);
      await user.click(screen.getByRole("button", { name: /sign out/i }));

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    });

    it("reloads page after successful logout", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({ ok: true });

      render(<AuthButton isLoggedIn={true} />);
      await user.click(screen.getByRole("button", { name: /sign out/i }));

      await waitFor(() => {
        expect(window.location.reload).toHaveBeenCalled();
      });
    });

    it("shows loading state while logging out", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(pendingPromise);

      render(<AuthButton isLoggedIn={true} />);
      await user.click(screen.getByRole("button", { name: /sign out/i }));

      expect(screen.getByRole("button", { name: /signing out/i })).toBeDisabled();

      resolvePromise!({ ok: true } as Response);
    });
  });
});
