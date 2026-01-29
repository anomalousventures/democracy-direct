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
    it("does not save address by default (opt-in required)", () => {
      render(<AddressForm onChange={() => {}} />);

      const nameInput = screen.getByLabelText(/your name/i);
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        "democracy-direct-address",
        expect.anything()
      );
    });

    it("saves address when opt-in checkbox is enabled", () => {
      render(<AddressForm onChange={() => {}} />);

      const checkbox = screen.getByRole("checkbox", { name: /remember my address/i });
      fireEvent.click(checkbox);

      const nameInput = screen.getByLabelText(/your name/i);
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "democracy-direct-address",
        expect.stringContaining("Jane Doe")
      );
    });

    it("loads saved address from localStorage when opt-in was previously enabled", () => {
      const savedAddress = JSON.stringify({
        name: "John Smith",
        street: "123 Main St",
        city: "Los Angeles",
        state: "CA",
        zip: "90001",
      });
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === "democracy-direct-save-address") return "true";
        if (key === "democracy-direct-address") return savedAddress;
        return null;
      });

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
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === "democracy-direct-save-address") return "true";
        if (key === "democracy-direct-address") return "invalid json{";
        return null;
      });

      render(<AddressForm onChange={() => {}} />);

      expect(screen.getByLabelText(/your name/i)).toHaveValue("");
    });

    it("clears saved data when opt-in checkbox is unchecked", () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === "democracy-direct-save-address") return "true";
        return null;
      });

      render(<AddressForm onChange={() => {}} />);

      const checkbox = screen.getByRole("checkbox", { name: /remember my address/i });
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("democracy-direct-save-address");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("democracy-direct-address");
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
