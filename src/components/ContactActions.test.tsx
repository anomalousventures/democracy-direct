import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { ContactActions } from "./ContactActions";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockRep = {
  first_name: "John",
  last_name: "Smith",
  party: "Democrat",
  state: "CA",
  district: "12",
  chamber: "house" as const,
  contact_form: "https://example.gov/contact",
  phone: "202-555-1234",
  office_address: "123 Capitol Building\nWashington, DC 20515",
};

describe("ContactActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe("Copy to Clipboard", () => {
    it("renders copy button", () => {
      render(<ContactActions content="Hello" representative={mockRep} />);
      const copyButton = screen.getByRole("button", { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });

    it("copies content to clipboard when clicked", async () => {
      render(<ContactActions content="Test letter content" representative={mockRep} />);
      const copyButton = screen.getByRole("button", { name: /copy/i });

      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Test letter content");
      });
    });

    it("shows success toast after copy", async () => {
      render(<ContactActions content="Hello" representative={mockRep} />);
      const copyButton = screen.getByRole("button", { name: /copy/i });

      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Copied to clipboard!");
      });
    });

    it("shows error toast on clipboard error", async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error("Clipboard error")),
        },
      });

      render(<ContactActions content="Hello" representative={mockRep} />);
      const copyButton = screen.getByRole("button", { name: /copy/i });

      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to copy to clipboard");
      });
    });
  });

  describe("Contact Form Flow", () => {
    it("renders contact form button when rep has contact form URL", () => {
      render(<ContactActions content="Hello" representative={mockRep} />);
      const contactButton = screen.getByRole("button", {
        name: /send via.*form|contact form/i,
      });
      expect(contactButton).toBeInTheDocument();
    });

    it("does not render contact form button when rep has no contact form URL", () => {
      const repWithoutForm = { ...mockRep, contact_form: undefined };
      render(<ContactActions content="Hello" representative={repWithoutForm} />);
      const contactButton = screen.queryByRole("button", {
        name: /send via.*form|contact form/i,
      });
      expect(contactButton).not.toBeInTheDocument();
    });

    it("copies content and shows redirect dialog", async () => {
      render(<ContactActions content="Test letter" representative={mockRep} />);
      const contactButton = screen.getByRole("button", {
        name: /send via.*form|contact form/i,
      });

      fireEvent.click(contactButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Test letter");
      });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      expect(screen.getByText(/letter copied to clipboard/i)).toBeInTheDocument();
      expect(screen.getByText(/representative john smith/i)).toBeInTheDocument();
    });

    it("Go to Contact Form link has correct href and closes dialog when clicked", async () => {
      render(<ContactActions content="Test letter" representative={mockRep} />);
      const contactButton = screen.getByRole("button", {
        name: /send via.*form|contact form/i,
      });

      fireEvent.click(contactButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const goToFormLink = screen.getByRole("link", { name: /go to contact form/i });
      expect(goToFormLink).toHaveAttribute("href", mockRep.contact_form);
      expect(goToFormLink).toHaveAttribute("target", "_blank");
      expect(goToFormLink).toHaveAttribute("rel", "noopener noreferrer");

      fireEvent.click(goToFormLink);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Phone Call Option", () => {
    it("renders phone link when rep has phone number", () => {
      render(<ContactActions content="Hello" representative={mockRep} />);
      const phoneLink = screen.getByRole("link", { name: /call|phone/i });
      expect(phoneLink).toBeInTheDocument();
      expect(phoneLink).toHaveAttribute("href", `tel:${mockRep.phone}`);
    });

    it("does not render phone link when rep has no phone", () => {
      const repWithoutPhone = { ...mockRep, phone: undefined };
      render(<ContactActions content="Hello" representative={repWithoutPhone} />);
      const phoneLink = screen.queryByRole("link", { name: /call|phone/i });
      expect(phoneLink).not.toBeInTheDocument();
    });
  });
});
