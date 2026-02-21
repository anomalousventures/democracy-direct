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
  district: "0",
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

const mockSenators = [
  {
    bioguideId: "F000062",
    fullName: "Dianne Feinstein",
    party: "Democrat",
    state: "CA",
    district: null,
  },
  {
    bioguideId: "P000145",
    fullName: "Alex Padilla",
    party: "Democrat",
    state: "CA",
    district: null,
  },
];

function mockFetchResponses(
  houseData: unknown = mockRepResponse,
  senateData: unknown = mockSenators
) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (typeof url === "string" && url.includes("chamber=senate")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(senateData),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(houseData),
      });
    })
  );
}

describe("DistrictTooltip", () => {
  beforeEach(() => {
    mockFetchResponses();
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

  it("shows all three reps when loaded", async () => {
    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    await waitFor(() => {
      expect(screen.getByText("Nancy Pelosi")).toBeInTheDocument();
    });
    expect(screen.getByText("Dianne Feinstein")).toBeInTheDocument();
    expect(screen.getByText("Alex Padilla")).toBeInTheDocument();
  });

  it("shows district page link", async () => {
    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    await waitFor(() => {
      expect(screen.getByText("Nancy Pelosi")).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: /View full district page/i });
    expect(link).toHaveAttribute("href", "/reps/ca/12");
  });

  it("links each rep to their profile", async () => {
    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    await waitFor(() => {
      expect(screen.getByText("Nancy Pelosi")).toBeInTheDocument();
    });

    const repLink = screen.getByText("Nancy Pelosi").closest("a");
    expect(repLink).toHaveAttribute("href", "/rep/P000197");
  });

  it("shows At-Large for at-large districts", async () => {
    render(<DistrictTooltip districtInfo={mockAtLargeInfo} />);

    expect(screen.getByText("Vermont")).toBeInTheDocument();
    expect(screen.getByText("At-Large")).toBeInTheDocument();
  });

  it("shows missing rep message when no reps found", async () => {
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

  it("fetches house rep and senators with correct params", async () => {
    render(<DistrictTooltip districtInfo={mockDistrictInfo} />);

    await waitFor(() => {
      expect(screen.getByText("Nancy Pelosi")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/rep/by-district?state=CA&district=12"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/rep/by-district?state=CA&chamber=senate"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("handles unknown FIPS code gracefully", async () => {
    const unknownFips: DistrictInfo = {
      state: "99",
      district: "1",
      name: "Unknown",
      geoid: "9901",
    };

    render(<DistrictTooltip districtInfo={unknownFips} />);

    await waitFor(() => {
      expect(screen.getByText("Could not load representative data")).toBeInTheDocument();
    });
  });
});
