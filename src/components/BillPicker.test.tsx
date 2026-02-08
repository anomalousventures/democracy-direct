import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { BillPicker } from "./BillPicker";

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

const mockBillResults = [
  {
    id: "bill-1",
    billNumber: "1234",
    billType: "hr",
    congress: 119,
    title: "A bill to improve healthcare access for all Americans",
  },
  {
    id: "bill-2",
    billNumber: "567",
    billType: "s",
    congress: 119,
    title: "A bill to reform the tax code and reduce rates for middle-income families",
  },
];

describe("BillPicker", () => {
  const mockOnBillsChange = vi.fn();
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders with empty selectedBills", () => {
    render(<BillPicker selectedBills={[]} onBillsChange={mockOnBillsChange} />);

    expect(screen.getByText("Linked Legislation (optional)")).toBeInTheDocument();
    expect(screen.getByTestId("bill-picker-input")).toBeInTheDocument();
    expect(screen.queryByTestId("linked-bills")).not.toBeInTheDocument();
  });

  it("renders selected bill badges", () => {
    render(<BillPicker selectedBills={["H.R.1234", "S.567"]} onBillsChange={mockOnBillsChange} />);

    expect(screen.getByTestId("linked-bills")).toBeInTheDocument();
    expect(screen.getByText("H.R.1234")).toBeInTheDocument();
    expect(screen.getByText("S.567")).toBeInTheDocument();
  });

  it("calls onBillsChange without the removed bill when remove button is clicked", () => {
    render(<BillPicker selectedBills={["H.R.1234", "S.567"]} onBillsChange={mockOnBillsChange} />);

    fireEvent.click(screen.getByLabelText("Remove H.R.1234"));

    expect(mockOnBillsChange).toHaveBeenCalledWith(["S.567"]);
  });

  it("shows dropdown results when typing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ bills: mockBillResults }),
    });

    render(<BillPicker selectedBills={[]} onBillsChange={mockOnBillsChange} />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("bill-picker-input"), {
        target: { value: "healthcare" },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("bill-picker-dropdown")).toBeInTheDocument();
    });

    expect(screen.getByText("H.R.1234")).toBeInTheDocument();
    expect(screen.getByText("S.567")).toBeInTheDocument();
    expect(screen.getByText(/improve healthcare access/)).toBeInTheDocument();
  });

  it("hides dropdown when clicking outside", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ bills: mockBillResults }),
    });

    render(<BillPicker selectedBills={[]} onBillsChange={mockOnBillsChange} />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("bill-picker-input"), {
        target: { value: "healthcare" },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("bill-picker-dropdown")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByTestId("bill-picker-dropdown")).not.toBeInTheDocument();
    });
  });

  it("does not add duplicate bills", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ bills: mockBillResults }),
    });

    render(<BillPicker selectedBills={["H.R.1234"]} onBillsChange={mockOnBillsChange} />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("bill-picker-input"), {
        target: { value: "healthcare" },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("bill-picker-dropdown")).toBeInTheDocument();
    });

    const options = screen.getAllByRole("option");
    const duplicateOption = options.find((opt) => opt.getAttribute("aria-disabled") === "true");
    expect(duplicateOption).toBeDefined();

    fireEvent.click(duplicateOption!);

    expect(mockOnBillsChange).not.toHaveBeenCalled();
  });

  it("shows no results message when search returns empty", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ bills: [] }),
    });

    render(<BillPicker selectedBills={[]} onBillsChange={mockOnBillsChange} />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("bill-picker-input"), {
        target: { value: "xyznonexistent" },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/No bills found matching/)).toBeInTheDocument();
    });
  });

  it("adds a bill when clicking a non-selected result", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ bills: [mockBillResults[0]] }),
    });

    render(<BillPicker selectedBills={[]} onBillsChange={mockOnBillsChange} />);

    await act(async () => {
      fireEvent.change(screen.getByTestId("bill-picker-input"), {
        target: { value: "healthcare" },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("bill-picker-dropdown")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("option"));

    expect(mockOnBillsChange).toHaveBeenCalledWith(["H.R.1234"]);
  });
});
