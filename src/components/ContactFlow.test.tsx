import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ContactFlow } from "./ContactFlow";
import type { Representative } from "../types/representative";

const mockRep: Representative = {
  first_name: "Jane",
  last_name: "Doe",
  party: "D",
  state: "CA",
  district: "12",
  chamber: "house",
  contact_form: "https://example.gov/contact",
  phone: "202-555-0100",
  office_address: "123 Capitol Hill\nWashington, DC 20515",
};

describe("ContactFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe("Single Card Layout", () => {
    it("renders a single card with Contact Your Representative heading", async () => {
      render(<ContactFlow representative={mockRep} />);

      expect(screen.getByText("Contact Your Representative")).toBeInTheDocument();

      await waitFor(() => {
        const cards = document.querySelectorAll(".card-civic-lg.no-print");
        expect(cards.length).toBe(1);
      });
    });

    it("renders Edit/Preview/Print Preview buttons", async () => {
      render(<ContactFlow representative={mockRep} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Print Preview" })).toBeInTheDocument();
      });
    });
  });

  describe("Editor", () => {
    it("renders the TiptapEditor in Edit tab", async () => {
      render(<ContactFlow representative={mockRep} />);

      await waitFor(() => {
        expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
      });
    });

    it("loads initial template content when provided", async () => {
      const initialContent = "Dear {{REP_NAME}},\n\nI am writing to express my concern...";

      render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

      await waitFor(() => {
        const editor = screen.getByTestId("tiptap-editor");
        expect(editor).toHaveTextContent(/Dear \{\{REP_NAME\}\}/);
        expect(editor).toHaveTextContent(/I am writing to express my concern/);
      });
    });
  });

  describe("Action Buttons", () => {
    it("shows all action buttons when content exists", async () => {
      const initialContent = "Test content";

      render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /send via contact form/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /call office/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /print & mail/i })).toBeInTheDocument();
      });
    });

    it("shows action buttons even without content (disabled state)", async () => {
      render(<ContactFlow representative={mockRep} />);

      await waitFor(() => {
        const contactFormBtn = screen.getByRole("button", { name: /send via contact form/i });
        const copyBtn = screen.getByRole("button", { name: /copy/i });
        expect(contactFormBtn).toBeInTheDocument();
        expect(contactFormBtn).toBeDisabled();
        expect(copyBtn).toBeInTheDocument();
        expect(copyBtn).toBeDisabled();
      });
    });

    it("calls window.print when print button is clicked", async () => {
      const initialContent = "Test content";
      const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

      render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /print & mail/i })).toBeInTheDocument();
      });

      const printButton = screen.getByRole("button", { name: /print & mail/i });
      printButton.click();

      expect(printSpy).toHaveBeenCalled();
      printSpy.mockRestore();
    });

    it("copies substituted content to clipboard", async () => {
      const initialContent = "Hello {{REP_NAME}}!";

      render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
      });

      const copyButton = screen.getByRole("button", { name: /copy/i });
      copyButton.click();

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Hello Jane Doe!");
      });
    });
  });

  describe("Template Variable Substitution", () => {
    it("shows substituted content in the print preview", async () => {
      const initialContent = "Dear {{REP_NAME}}, I am from {{STATE}}.";

      render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

      await waitFor(() => {
        const printPreviews = screen.getAllByTestId("print-preview");
        expect(printPreviews.length).toBeGreaterThan(0);
        expect(printPreviews[0]).toHaveTextContent("Dear Jane Doe, I am from CA.");
      });
    });
  });

  describe("Print Layout", () => {
    it("has a print-only section with letter preview", async () => {
      const initialContent = "Test letter content";

      render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

      await waitFor(() => {
        const printOnlySection = document.querySelector(".print-only");
        expect(printOnlySection).toBeInTheDocument();
        expect(printOnlySection).toHaveClass("hidden");
      });
    });

    it("screen section has no-print class", async () => {
      const initialContent = "Test letter content";

      render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

      await waitFor(() => {
        const noPrintSection = document.querySelector(".no-print");
        expect(noPrintSection).toBeInTheDocument();
      });
    });
  });

  describe("Sender Info Form", () => {
    it("renders the sender info form", async () => {
      render(<ContactFlow representative={mockRep} />);

      await waitFor(() => {
        expect(screen.getByText("Your Information")).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/123 main st/i)).toBeInTheDocument();
    });
  });

  describe("Letter Formatting Options", () => {
    it("renders formatting checkboxes when Print Preview is selected", async () => {
      render(<ContactFlow representative={mockRep} />);

      const printPreviewButton = screen.getByRole("button", { name: "Print Preview" });
      printPreviewButton.click();

      await waitFor(() => {
        expect(screen.getByText("Letter Formatting")).toBeInTheDocument();
        expect(screen.getByLabelText(/your address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/rep address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/salutation/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/closing/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/signature/i)).toBeInTheDocument();
      });
    });

    it("does not show formatting checkboxes in Edit mode", async () => {
      render(<ContactFlow representative={mockRep} />);

      await waitFor(() => {
        expect(screen.queryByText("Letter Formatting")).not.toBeInTheDocument();
      });
    });
  });

  describe("Mobile-First Layout", () => {
    it("renders sidebar with order classes for mobile reordering", async () => {
      render(<ContactFlow representative={mockRep} />);

      await waitFor(() => {
        const sidebar = document.querySelector("aside");
        expect(sidebar).toBeInTheDocument();
        expect(sidebar).toHaveClass("order-1", "lg:order-2");
      });
    });

    it("renders editor section with order classes for mobile reordering", async () => {
      render(<ContactFlow representative={mockRep} />);

      await waitFor(() => {
        const editorContainer = document.querySelector(".order-2.lg\\:order-1");
        expect(editorContainer).toBeInTheDocument();
      });
    });

    it("renders Contact Form as the primary action button with large size", async () => {
      const initialContent = "Test content";

      render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

      await waitFor(() => {
        const contactFormBtn = screen.getByRole("button", { name: /send via contact form/i });
        expect(contactFormBtn).toHaveClass("h-11", "px-8");
      });
    });
  });
});
