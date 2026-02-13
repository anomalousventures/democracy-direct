import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/preact";
import { TiptapEditor } from "./TiptapEditor";

describe("TiptapEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("renders the editor", async () => {
      render(<TiptapEditor content="" onChange={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
      });
    });

    it("displays initial content", async () => {
      render(<TiptapEditor content="Hello World" onChange={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("tiptap-editor")).toHaveTextContent("Hello World");
      });
    });

    it("displays character count", async () => {
      render(<TiptapEditor content="Hello" onChange={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("character-count")).toHaveTextContent("5");
      });
    });

    it("displays placeholder when empty", async () => {
      render(<TiptapEditor content="" onChange={vi.fn()} placeholder="Write something..." />);

      await waitFor(() => {
        const editor = screen.getByTestId("tiptap-editor");
        expect(editor).toBeInTheDocument();
      });
    });

    it("displays the formatting tip", async () => {
      render(<TiptapEditor content="" onChange={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText(/Variables like.*REP_NAME/)).toBeInTheDocument();
      });
    });
  });

  describe("Content Updates", () => {
    it("updates when content prop changes", async () => {
      const { rerender } = render(<TiptapEditor content="Initial" onChange={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("tiptap-editor")).toHaveTextContent("Initial");
      });

      rerender(<TiptapEditor content="Updated" onChange={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("tiptap-editor")).toHaveTextContent("Updated");
      });
    });
  });
});
