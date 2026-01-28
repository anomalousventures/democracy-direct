import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginDialog } from "./LoginDialog";

describe("LoginDialog", () => {
  const mockOnSuccess = vi.fn();
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("email step", () => {
    it("renders email input when open", () => {
      render(<LoginDialog open={true} onOpenChange={() => {}} onSuccess={mockOnSuccess} />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /send code/i })).toBeInTheDocument();
    });

    it("validates email format", async () => {
      const user = userEvent.setup();
      render(<LoginDialog open={true} onOpenChange={() => {}} onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitBtn = screen.getByRole("button", { name: /send code/i });

      await user.type(emailInput, "invalid-email");
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it("submits email and transitions to OTP step", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      render(<LoginDialog open={true} onOpenChange={() => {}} onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");
      await user.click(screen.getByRole("button", { name: /send code/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
      });
    });

    it("shows loading state while submitting email", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(pendingPromise);

      render(<LoginDialog open={true} onOpenChange={() => {}} onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");
      await user.click(screen.getByRole("button", { name: /send code/i }));

      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    });

    it("shows error when request fails", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Rate limited" }),
      } as Response);

      render(<LoginDialog open={true} onOpenChange={() => {}} onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");
      await user.click(screen.getByRole("button", { name: /send code/i }));

      await waitFor(() => {
        expect(screen.getByText(/rate limited/i)).toBeInTheDocument();
      });
    });
  });

  describe("OTP step", () => {
    const setupOTPStep = async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      render(<LoginDialog open={true} onOpenChange={() => {}} onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");
      await user.click(screen.getByRole("button", { name: /send code/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
      });

      return user;
    };

    it("renders 6-digit OTP input", async () => {
      await setupOTPStep();
      const otpInput = screen.getByPlaceholderText("000000");
      expect(otpInput).toHaveAttribute("maxLength", "6");
    });

    it("verifies OTP and calls onSuccess", async () => {
      const user = await setupOTPStep();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const otpInput = screen.getByPlaceholderText("000000");
      await user.type(otpInput, "123456");
      await user.click(screen.getByRole("button", { name: /verify/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("shows error for invalid OTP", async () => {
      const user = await setupOTPStep();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Invalid or expired OTP" }),
      } as Response);

      const otpInput = screen.getByPlaceholderText("000000");
      await user.type(otpInput, "000000");
      await user.click(screen.getByRole("button", { name: /verify/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument();
      });
    });

    it("shows loading state while verifying", async () => {
      const user = await setupOTPStep();

      let resolvePromise: (value: Response) => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(pendingPromise);

      const otpInput = screen.getByPlaceholderText("000000");
      await user.type(otpInput, "123456");
      await user.click(screen.getByRole("button", { name: /verify/i }));

      expect(screen.getByRole("button", { name: /verifying/i })).toBeDisabled();

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    });

    it("allows returning to email step", async () => {
      const user = await setupOTPStep();

      await user.click(screen.getByRole("button", { name: /back/i }));

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });

  describe("dialog behavior", () => {
    it("resets state when closed and reopened", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const { rerender } = render(
        <LoginDialog open={true} onOpenChange={onOpenChange} onSuccess={mockOnSuccess} />
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");
      await user.click(screen.getByRole("button", { name: /send code/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
      });

      rerender(<LoginDialog open={false} onOpenChange={onOpenChange} onSuccess={mockOnSuccess} />);
      rerender(<LoginDialog open={true} onOpenChange={onOpenChange} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });
});
