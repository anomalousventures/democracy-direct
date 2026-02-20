import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/preact";
import { userEvent } from "@testing-library/user-event";
import type { DistrictInfo } from "@/lib/tigerweb";

const mockDistrict: DistrictInfo = {
  state: "06",
  district: "12",
  name: "Congressional District 12",
  geoid: "0612",
};

let shouldThrow = false;

vi.mock("./DistrictMap", () => ({
  DistrictMap: vi.fn(
    ({
      onDistrictSelect,
      className,
    }: {
      onDistrictSelect?: (d: DistrictInfo | null) => void;
      className?: string;
    }) => {
      if (shouldThrow) throw new Error("WebGL not supported");
      return (
        <div data-testid="district-map" className={className}>
          <button data-testid="select-district" onClick={() => onDistrictSelect?.(mockDistrict)}>
            Select
          </button>
          <button data-testid="deselect-district" onClick={() => onDistrictSelect?.(null)}>
            Deselect
          </button>
        </div>
      );
    }
  ),
}));

vi.mock("./DistrictTooltip", () => ({
  DistrictTooltip: vi.fn(
    ({ districtInfo, onClose }: { districtInfo: DistrictInfo; onClose?: () => void }) => (
      <div data-testid="district-tooltip">
        <span data-testid="tooltip-state">{districtInfo.state}</span>
        <span data-testid="tooltip-district">{districtInfo.district}</span>
        <button data-testid="tooltip-close" onClick={onClose}>
          Close
        </button>
      </div>
    )
  ),
}));

import { MapWithTooltip } from "./MapWithTooltip";

describe("MapWithTooltip", () => {
  it("renders the district map", () => {
    render(<MapWithTooltip />);
    expect(screen.getByTestId("district-map")).toBeInTheDocument();
  });

  it("does not show tooltip initially", () => {
    render(<MapWithTooltip />);
    expect(screen.queryByTestId("district-tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip when district is selected", async () => {
    const user = userEvent.setup();
    render(<MapWithTooltip />);

    await user.click(screen.getByTestId("select-district"));

    expect(screen.getByTestId("district-tooltip")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-state")).toHaveTextContent("06");
    expect(screen.getByTestId("tooltip-district")).toHaveTextContent("12");
  });

  it("hides tooltip when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<MapWithTooltip />);

    await user.click(screen.getByTestId("select-district"));
    expect(screen.getByTestId("district-tooltip")).toBeInTheDocument();

    await user.click(screen.getByTestId("tooltip-close"));
    expect(screen.queryByTestId("district-tooltip")).not.toBeInTheDocument();
  });

  it("hides tooltip when clicking outside a district", async () => {
    const user = userEvent.setup();
    render(<MapWithTooltip />);

    await user.click(screen.getByTestId("select-district"));
    expect(screen.getByTestId("district-tooltip")).toBeInTheDocument();

    await user.click(screen.getByTestId("deselect-district"));
    expect(screen.queryByTestId("district-tooltip")).not.toBeInTheDocument();
  });

  it("passes sizing classes to DistrictMap", () => {
    render(<MapWithTooltip />);
    expect(screen.getByTestId("district-map")).toHaveClass("w-full", "h-full");
  });

  it("shows error boundary fallback when child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    shouldThrow = true;

    render(<MapWithTooltip />);

    expect(screen.getByText("The map could not be displayed.")).toBeInTheDocument();
    expect(screen.getByText(/looking up your ZIP code/)).toBeInTheDocument();

    shouldThrow = false;
    spy.mockRestore();
  });
});
