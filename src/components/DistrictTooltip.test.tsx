import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/preact";
import { userEvent } from "@testing-library/user-event";
import type { DistrictInfo } from "@/lib/tigerweb";
import { DistrictTooltip } from "./DistrictTooltip";

const mockDistrictInfo: DistrictInfo = {
  state: "06",
  district: "12",
  name: "Congressional District 12",
  geoid: "0612",
};

const mockAtLargeInfo: DistrictInfo = {
  state: "50",
  district: "00",
  name: "Congressional District (at Large)",
  geoid: "5000",
};

const mockRepResponse = {
  bioguideId: "P000197",
  fullName: "Nancy Pelosi",
  party: "Democrat",
  state: "CA",
  district: "12",
};

describe("DistrictTooltip", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockRepResponse),
        })
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("displays state name and district", async () => {
    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    expect(screen.getByText("California")).toBeInTheDocument();
    expect(screen.getByText("12th District")).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );

    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows rep info when loaded", async () => {
    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    await waitFor(() => {
      expect(screen.getByText("Nancy Pelosi")).toBeInTheDocument();
    });
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("shows View Representative link", async () => {
    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    await waitFor(() => {
      expect(screen.getByText("Nancy Pelosi")).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: /View Representative/i });
    expect(link).toHaveAttribute("href", "/rep/P000197");
  });

  it("shows At-Large for at-large districts", async () => {
    render(<DistrictTooltip districtInfo={mockAtLargeInfo} />);

    expect(screen.getByText("Vermont")).toBeInTheDocument();
    expect(screen.getByText("At-Large")).toBeInTheDocument();
  });

  it("shows missing rep message on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: "Not found" }),
        })
      )
    );

    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    await waitFor(() => {
      expect(screen.getByText("Representative data unavailable")).toBeInTheDocument();
    });
  });

  it("shows error state on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Network error")))
    );

    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    await waitFor(() => {
      expect(screen.getByText("Could not load representative data")).toBeInTheDocument();
    });
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<DistrictTooltip districtInfo={mockDistrictInfo} onClose={onClose} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not render close button when onClose is not provided", () => {
    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument();
  });

  it("fetches rep data with correct params", async () => {
    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    await waitFor(() => {
      expect(screen.getByText("Nancy Pelosi")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/rep/by-district?state=CA&district=12"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("handles unknown FIPS code gracefully", async () => {
    const unknownFips: DistrictInfo = {
      state: "99",
      district: "01",
      name: "Unknown",
      geoid: "9901",
    };

    render(<DistrictTooltip districtInfo={unknownFips} />);

    await waitFor(() => {
      expect(screen.getByText("Could not load representative data")).toBeInTheDocument();
    });
  });
});
