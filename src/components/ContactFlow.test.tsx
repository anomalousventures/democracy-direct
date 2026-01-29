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

  it("renders the letter composer", async () => {
    render(<ContactFlow representative={mockRep} />);

    expect(screen.getByText("Write Your Letter")).toBeInTheDocument();

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

  it("shows Send Your Letter section when content exists", async () => {
    const initialContent = "Test content";

    render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

    await waitFor(() => {
      expect(screen.getByText("Send Your Letter")).toBeInTheDocument();
    });
  });

  it("shows Print & Mail section when content exists", async () => {
    const initialContent = "Test content";

    render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

    await waitFor(() => {
      expect(screen.getByText("Print & Mail")).toBeInTheDocument();
    });
  });

  it("calls window.print when print button is clicked", async () => {
    const initialContent = "Test content";
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /print & mail letter/i })).toBeInTheDocument();
    });

    const printButton = screen.getByRole("button", { name: /print & mail letter/i });
    printButton.click();

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
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

    it("screen sections have no-print class", async () => {
      const initialContent = "Test letter content";

      render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

      await waitFor(() => {
        const noPrintSections = document.querySelectorAll(".no-print");
        expect(noPrintSections.length).toBeGreaterThan(0);
      });
    });
  });
});
