import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/preact";
import { userEvent } from "@testing-library/user-event";
import type { ZipLookupResult } from "@/lib/zip-lookup";

const mockLookupZip = vi.fn<(zip: string) => Promise<ZipLookupResult>>();

vi.mock("../lib/zip-lookup", () => ({
  lookupZip: (...args: [string]) => mockLookupZip(...args),
}));

import { ZipLookup } from "./ZipLookup";

const ambiguousResult: ZipLookupResult = {
  type: "ambiguous",
  options: [
    { state: "PA", district: "7", proportion: 0.6 },
    { state: "PA", district: "5", proportion: 0.4 },
  ],
};

describe("ZipLookup map link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not show map link before results", () => {
    render(<ZipLookup autoFocus={false} />);
    expect(screen.queryByText("View districts on map")).not.toBeInTheDocument();
  });

  it("shows map link after ambiguous results", async () => {
    mockLookupZip.mockResolvedValueOnce(ambiguousResult);
    const user = userEvent.setup();

    render(<ZipLookup autoFocus={false} />);

    const input = screen.getByLabelText("ZIP code");
    await user.type(input, "19103");

    await user.click(screen.getByRole("button", { name: /find my reps/i }));

    await waitFor(() => {
      expect(screen.getByText("View districts on map")).toBeInTheDocument();
    });

    const link = screen.getByText("View districts on map").closest("a");
    expect(link).toHaveAttribute("href", "/map");
  });

  it("does not show map link for error results", async () => {
    mockLookupZip.mockResolvedValueOnce({
      type: "error",
      message: "Not found",
    });
    const user = userEvent.setup();

    render(<ZipLookup autoFocus={false} />);

    const input = screen.getByLabelText("ZIP code");
    await user.type(input, "00000");

    await user.click(screen.getByRole("button", { name: /find my reps/i }));

    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });

    expect(screen.queryByText("View districts on map")).not.toBeInTheDocument();
  });
});
