import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrintLetter } from "./PrintLetter";
import { formatDateMedium } from "@/lib/date-utils";

const mockRep = {
  first_name: "John",
  last_name: "Smith",
  party: "Democrat",
  state: "CA",
  district: "12",
  chamber: "house" as const,
  office_address: "123 Capitol Building\nWashington, DC 20515",
};

describe("PrintLetter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "print").mockImplementation(() => {});
  });

  describe("Print Button", () => {
    it("renders print button", () => {
      render(<PrintLetter letterContent="Hello" representative={mockRep} />);
      const printButton = screen.getByRole("button", { name: /print|mail/i });
      expect(printButton).toBeInTheDocument();
    });

    it("triggers window.print when clicked", () => {
      render(<PrintLetter letterContent="Hello" representative={mockRep} />);
      const printButton = screen.getByRole("button", { name: /print|mail/i });

      fireEvent.click(printButton);

      expect(window.print).toHaveBeenCalled();
    });
  });

  describe("Print Preview Content", () => {
    it("displays letter content in preview", () => {
      render(
        <PrintLetter
          letterContent="This is my letter to my representative."
          representative={mockRep}
        />
      );

      expect(screen.getByText(/this is my letter to my representative/i)).toBeInTheDocument();
    });

    it("displays representative mailing address", () => {
      render(<PrintLetter letterContent="Hello" representative={mockRep} />);

      expect(screen.getByText(/123 Capitol Building/)).toBeInTheDocument();
      expect(screen.getByText(/Washington, DC 20515/)).toBeInTheDocument();
    });

    it("displays current date", () => {
      render(<PrintLetter letterContent="Hello" representative={mockRep} />);

      const today = formatDateMedium(new Date());

      expect(screen.getByText(today)).toBeInTheDocument();
    });

    it("displays salutation with representative title and name", () => {
      render(<PrintLetter letterContent="Hello" representative={mockRep} />);

      expect(screen.getByText(/dear representative smith/i)).toBeInTheDocument();
    });

    it("displays closing signature line", () => {
      render(<PrintLetter letterContent="Hello" representative={mockRep} />);

      expect(screen.getByText(/sincerely/i)).toBeInTheDocument();
    });
  });

  describe("Return Address", () => {
    it("renders editable return address fields", () => {
      render(<PrintLetter letterContent="Hello" representative={mockRep} />);

      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();
    });

    it("allows editing return address fields", () => {
      render(<PrintLetter letterContent="Hello" representative={mockRep} />);

      const nameInput = screen.getByLabelText(/your name/i);
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

      expect(nameInput).toHaveValue("Jane Doe");
    });

    it("displays return address in preview when filled", () => {
      render(<PrintLetter letterContent="Hello" representative={mockRep} />);

      const nameInput = screen.getByLabelText(/your name/i);
      const streetInput = screen.getByLabelText(/street address/i);
      const cityInput = screen.getByLabelText(/city/i);

      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
      fireEvent.change(streetInput, { target: { value: "456 Main St" } });
      fireEvent.change(cityInput, { target: { value: "Los Angeles" } });

      const preview = screen.getByTestId("print-preview");
      expect(preview).toHaveTextContent("Jane Doe");
      expect(preview).toHaveTextContent("456 Main St");
      expect(preview).toHaveTextContent("Los Angeles");
    });
  });

  describe("Senator Title", () => {
    it("uses Senator title for senate chamber", () => {
      const senatorRep = { ...mockRep, chamber: "senate" as const };
      render(<PrintLetter letterContent="Hello" representative={senatorRep} />);

      expect(screen.getByText(/dear senator smith/i)).toBeInTheDocument();
    });
  });
});
