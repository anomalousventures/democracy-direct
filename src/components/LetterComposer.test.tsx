import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    it("renders the editor component", async () => {
      render(<LetterComposer representative={mockRep} />);

      await waitFor(() => {
        expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
      });
    });

    it("displays character count", async () => {
      render(<LetterComposer representative={mockRep} initialContent="Hello" />);

      await waitFor(() => {
        expect(screen.getByTestId("character-count")).toHaveTextContent("5");
      });
    });
  });

  describe("Template Variable Substitution", () => {
    it("substitutes {{REP_NAME}} with representative name in preview", async () => {
      render(<LetterComposer representative={mockRep} initialContent="Dear {{REP_NAME}}," />);

      await waitFor(() => {
        const preview = screen.getByTestId("letter-preview");
        expect(preview).toHaveTextContent("Dear John Smith,");
      });
    });

    it("substitutes {{REP_TITLE}} with representative title in preview", async () => {
      render(
        <LetterComposer
          representative={mockRep}
          initialContent="Dear {{REP_TITLE}} {{REP_LAST}},"
        />
      );

      await waitFor(() => {
        const preview = screen.getByTestId("letter-preview");
        expect(preview).toHaveTextContent("Dear Representative Smith,");
      });
    });

    it("substitutes {{STATE}} and {{DISTRICT}} in preview", async () => {
      render(
        <LetterComposer
          representative={mockRep}
          initialContent="I am a constituent from {{STATE}} District {{DISTRICT}}."
        />
      );

      await waitFor(() => {
        const preview = screen.getByTestId("letter-preview");
        expect(preview).toHaveTextContent("I am a constituent from CA District 12.");
      });
    });

    it("handles multiple variable substitutions in preview", async () => {
      render(
        <LetterComposer
          representative={mockRep}
          initialContent="Dear {{REP_TITLE}} {{REP_NAME}}, I am writing as a {{STATE}} resident."
        />
      );

      await waitFor(() => {
        const preview = screen.getByTestId("letter-preview");
        expect(preview).toHaveTextContent(
          "Dear Representative John Smith, I am writing as a CA resident."
        );
      });
    });

    it("leaves unknown variables unchanged in preview", async () => {
      render(<LetterComposer representative={mockRep} initialContent="Hello {{UNKNOWN_VAR}}" />);

      await waitFor(() => {
        const preview = screen.getByTestId("letter-preview");
        expect(preview).toHaveTextContent("Hello {{UNKNOWN_VAR}}");
      });
    });
  });

  describe("Template Loading", () => {
    it("loads template content when provided", async () => {
      const template = "Dear {{REP_TITLE}},\n\nI am writing to express...";
      render(<LetterComposer representative={mockRep} initialContent={template} />);

      await waitFor(() => {
        const editor = screen.getByTestId("tiptap-editor");
        expect(editor).toHaveTextContent(/Dear \{\{REP_TITLE\}\}/);
        expect(editor).toHaveTextContent(/I am writing to express/);
      });
    });

    it("displays initial content and shows preview when content exists", async () => {
      render(<LetterComposer representative={mockRep} initialContent="Test content" />);

      await waitFor(() => {
        expect(screen.getByTestId("tiptap-editor")).toHaveTextContent("Test content");
        expect(screen.getByTestId("letter-preview")).toBeInTheDocument();
      });
    });
  });
});
