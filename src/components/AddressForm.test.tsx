import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddressForm } from "./AddressForm";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("AddressForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe("Form Fields", () => {
    it("renders all address fields", () => {
      render(<AddressForm onChange={() => {}} />);

      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();
    });

    it("allows editing address fields", () => {
      render(<AddressForm onChange={() => {}} />);

      const nameInput = screen.getByLabelText(/your name/i);
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

      expect(nameInput).toHaveValue("Jane Doe");
    });

    it("calls onChange with updated address", () => {
      const onChange = vi.fn();
      render(<AddressForm onChange={onChange} />);

      const nameInput = screen.getByLabelText(/your name/i);
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: "Jane Doe" }));
    });
  });

  describe("localStorage Persistence", () => {
    it("saves address to localStorage when fields change", () => {
      render(<AddressForm onChange={() => {}} />);

      const nameInput = screen.getByLabelText(/your name/i);
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "democracy-direct-address",
        expect.stringContaining("Jane Doe")
      );
    });

    it("loads saved address from localStorage on mount", () => {
      const savedAddress = JSON.stringify({
        name: "John Smith",
        street: "123 Main St",
        city: "Los Angeles",
        state: "CA",
        zip: "90001",
      });
      localStorageMock.getItem.mockReturnValue(savedAddress);

      render(<AddressForm onChange={() => {}} />);

      expect(screen.getByLabelText(/your name/i)).toHaveValue("John Smith");
      expect(screen.getByLabelText(/street address/i)).toHaveValue("123 Main St");
      expect(screen.getByLabelText(/city/i)).toHaveValue("Los Angeles");
      expect(screen.getByLabelText(/state/i)).toHaveValue("CA");
      expect(screen.getByLabelText(/zip/i)).toHaveValue("90001");
    });

    it("handles missing localStorage gracefully", () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<AddressForm onChange={() => {}} />);

      expect(screen.getByLabelText(/your name/i)).toHaveValue("");
    });

    it("handles invalid localStorage JSON gracefully", () => {
      localStorageMock.getItem.mockReturnValue("invalid json{");

      render(<AddressForm onChange={() => {}} />);

      expect(screen.getByLabelText(/your name/i)).toHaveValue("");
    });
  });

  describe("Clear Button", () => {
    it("renders clear button", () => {
      render(<AddressForm onChange={() => {}} />);

      expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
    });

    it("clears all fields when clicked", () => {
      const savedAddress = JSON.stringify({
        name: "John Smith",
        street: "123 Main St",
        city: "Los Angeles",
        state: "CA",
        zip: "90001",
      });
      localStorageMock.getItem.mockReturnValue(savedAddress);

      render(<AddressForm onChange={() => {}} />);

      const clearButton = screen.getByRole("button", { name: /clear/i });
      fireEvent.click(clearButton);

      expect(screen.getByLabelText(/your name/i)).toHaveValue("");
      expect(screen.getByLabelText(/street address/i)).toHaveValue("");
      expect(screen.getByLabelText(/city/i)).toHaveValue("");
      expect(screen.getByLabelText(/state/i)).toHaveValue("");
      expect(screen.getByLabelText(/zip/i)).toHaveValue("");
    });

    it("removes address from localStorage when cleared", () => {
      const savedAddress = JSON.stringify({
        name: "John Smith",
        street: "123 Main St",
        city: "Los Angeles",
        state: "CA",
        zip: "90001",
      });
      localStorageMock.getItem.mockReturnValue(savedAddress);

      render(<AddressForm onChange={() => {}} />);

      const clearButton = screen.getByRole("button", { name: /clear/i });
      fireEvent.click(clearButton);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("democracy-direct-address");
    });

    it("calls onChange with empty address after clear", () => {
      const onChange = vi.fn();
      const savedAddress = JSON.stringify({
        name: "John Smith",
        street: "123 Main St",
        city: "Los Angeles",
        state: "CA",
        zip: "90001",
      });
      localStorageMock.getItem.mockReturnValue(savedAddress);

      render(<AddressForm onChange={onChange} />);

      const clearButton = screen.getByRole("button", { name: /clear/i });
      fireEvent.click(clearButton);

      expect(onChange).toHaveBeenCalledWith({
        name: "",
        street: "",
        city: "",
        state: "",
        zip: "",
      });
    });
  });
});
