import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LetterComposer } from "./LetterComposer";

const mockRep = {
  first_name: "John",
  last_name: "Smith",
  party: "Democrat",
  state: "CA",
  district: "12",
  chamber: "house" as const,
  title: "Representative",
};

describe("LetterComposer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("renders a textarea for letter body", () => {
      render(<LetterComposer representative={mockRep} />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
    });

    it("allows typing in the composer", () => {
      render(<LetterComposer representative={mockRep} />);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Dear Representative," } });
      expect(textarea).toHaveValue("Dear Representative,");
    });

    it("displays character count", () => {
      render(<LetterComposer representative={mockRep} />);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Hello" } });
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });

    it("updates character count as user types", () => {
      render(<LetterComposer representative={mockRep} />);
      const textarea = screen.getByRole("textbox");

      fireEvent.change(textarea, { target: { value: "Hi" } });
      expect(screen.getByText(/2/)).toBeInTheDocument();

      fireEvent.change(textarea, { target: { value: "Hello World" } });
      expect(screen.getByText(/11/)).toBeInTheDocument();
    });
  });

  describe("Template Variable Substitution", () => {
    it("substitutes {{REP_NAME}} with representative name", () => {
      render(<LetterComposer representative={mockRep} />);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, {
        target: { value: "Dear {{REP_NAME}}," },
      });

      const preview = screen.getByTestId("letter-preview");
      expect(preview).toHaveTextContent("Dear John Smith,");
    });

    it("substitutes {{REP_TITLE}} with representative title", () => {
      render(<LetterComposer representative={mockRep} />);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, {
        target: { value: "Dear {{REP_TITLE}} {{REP_LAST}}," },
      });

      const preview = screen.getByTestId("letter-preview");
      expect(preview).toHaveTextContent("Dear Representative Smith,");
    });

    it("substitutes {{STATE}} and {{DISTRICT}}", () => {
      render(<LetterComposer representative={mockRep} />);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, {
        target: { value: "I am a constituent from {{STATE}} District {{DISTRICT}}." },
      });

      const preview = screen.getByTestId("letter-preview");
      expect(preview).toHaveTextContent("I am a constituent from CA District 12.");
    });

    it("handles multiple variable substitutions", () => {
      render(<LetterComposer representative={mockRep} />);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, {
        target: {
          value: "Dear {{REP_TITLE}} {{REP_NAME}}, I am writing as a {{STATE}} resident.",
        },
      });

      const preview = screen.getByTestId("letter-preview");
      expect(preview).toHaveTextContent(
        "Dear Representative John Smith, I am writing as a CA resident."
      );
    });

    it("leaves unknown variables unchanged", () => {
      render(<LetterComposer representative={mockRep} />);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, {
        target: { value: "Hello {{UNKNOWN_VAR}}" },
      });

      const preview = screen.getByTestId("letter-preview");
      expect(preview).toHaveTextContent("Hello {{UNKNOWN_VAR}}");
    });
  });

  describe("Template Loading", () => {
    it("loads template content when provided", () => {
      const template = "Dear {{REP_TITLE}},\n\nI am writing to express...";
      render(<LetterComposer representative={mockRep} initialContent={template} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue(template);
    });

    it("calls onContentChange when content changes", () => {
      const onContentChange = vi.fn();
      render(<LetterComposer representative={mockRep} onContentChange={onContentChange} />);

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "New content" } });

      expect(onContentChange).toHaveBeenCalledWith("New content");
    });
  });
});
