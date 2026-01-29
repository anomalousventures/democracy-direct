import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserInfoInputs } from "./UserInfoInputs";

describe("UserInfoInputs", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    localStorage.clear();
  });

  it("renders nothing when showName and showCity are false", () => {
    const { container } = render(<UserInfoInputs onChange={mockOnChange} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders name input when showName is true", () => {
    render(<UserInfoInputs onChange={mockOnChange} showName />);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/your city/i)).not.toBeInTheDocument();
  });

  it("renders city input when showCity is true", () => {
    render(<UserInfoInputs onChange={mockOnChange} showCity />);
    expect(screen.queryByLabelText(/your name/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/your city/i)).toBeInTheDocument();
  });

  it("renders both inputs when both props are true", () => {
    render(<UserInfoInputs onChange={mockOnChange} showName showCity />);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your city/i)).toBeInTheDocument();
  });

  it("calls onChange when name is entered", async () => {
    render(<UserInfoInputs onChange={mockOnChange} showName />);
    const input = screen.getByLabelText(/your name/i);
    fireEvent.change(input, { target: { value: "John Doe" } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ name: "John Doe" }));
    });
  });

  it("calls onChange when city is entered", async () => {
    render(<UserInfoInputs onChange={mockOnChange} showCity />);
    const input = screen.getByLabelText(/your city/i);
    fireEvent.change(input, { target: { value: "New York" } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ city: "New York" }));
    });
  });

  it("saves to localStorage when checkbox is checked", async () => {
    render(<UserInfoInputs onChange={mockOnChange} showName showCity />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const nameInput = screen.getByLabelText(/your name/i);
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

    await waitFor(() => {
      const stored = localStorage.getItem("democracy-direct-user-info");
      expect(stored).toContain("Jane Doe");
    });
  });

  it("clears localStorage when checkbox is unchecked", async () => {
    localStorage.setItem("democracy-direct-save-user-info", "true");
    localStorage.setItem(
      "democracy-direct-user-info",
      JSON.stringify({ name: "Test", city: "City" })
    );

    render(<UserInfoInputs onChange={mockOnChange} showName showCity />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(localStorage.getItem("democracy-direct-user-info")).toBeNull();
    });
  });

  it("loads saved values from localStorage on mount", async () => {
    localStorage.setItem("democracy-direct-save-user-info", "true");
    localStorage.setItem(
      "democracy-direct-user-info",
      JSON.stringify({ name: "Saved Name", city: "Saved City" })
    );

    render(<UserInfoInputs onChange={mockOnChange} showName showCity />);

    await waitFor(() => {
      expect(screen.getByLabelText(/your name/i)).toHaveValue("Saved Name");
      expect(screen.getByLabelText(/your city/i)).toHaveValue("Saved City");
    });
  });
});
