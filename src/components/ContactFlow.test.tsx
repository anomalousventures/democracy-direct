import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
  it("renders the letter composer", () => {
    render(<ContactFlow representative={mockRep} />);

    expect(screen.getByText("Write Your Letter")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("loads initial template content when provided", () => {
    const initialContent = "Dear {{REP_NAME}},\n\nI am writing to express my concern...";

    render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

    const textarea = screen.getByLabelText("Your Letter");
    expect(textarea).toHaveValue(initialContent);
  });

  it("shows Send Your Letter section when content exists", () => {
    const initialContent = "Test content";

    render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

    expect(screen.getByText("Send Your Letter")).toBeInTheDocument();
  });

  it("shows Print & Mail section when content exists", () => {
    const initialContent = "Test content";

    render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

    expect(screen.getByText("Print & Mail")).toBeInTheDocument();
  });

  it("calls window.print when print button is clicked", () => {
    const initialContent = "Test content";
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<ContactFlow representative={mockRep} initialTemplate={initialContent} />);

    const printButton = screen.getByRole("button", { name: /print & mail letter/i });
    printButton.click();

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
