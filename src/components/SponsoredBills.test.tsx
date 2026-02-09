import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SponsoredBills } from "./SponsoredBills";
import type { Bill } from "@/db/schema";

const mockBills: Bill[] = [
  {
    id: "bill-1",
    billNumber: "1234",
    billType: "hr",
    congress: 119,
    title: "A bill to improve things",
    summary: "This bill would make significant improvements to various aspects of the economy.",
    status: "introduced",
    subjects: ["Economy", "Healthcare"],
    introducedDate: new Date("2025-01-10"),
    latestActionDate: new Date("2025-01-15"),
    latestActionText: "Referred to committee",
    sponsorBioguideId: "A000001",
    congressGovUrl: "https://congress.gov/bill/119th-congress/house-bill/1234",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "bill-2",
    billNumber: "5678",
    billType: "s",
    congress: 119,
    title: "A bill that became law",
    summary: null,
    status: "became_law",
    subjects: ["Environment"],
    introducedDate: new Date("2025-01-05"),
    latestActionDate: new Date("2025-01-20"),
    latestActionText: "Signed by President",
    sponsorBioguideId: "A000001",
    congressGovUrl: "https://congress.gov/bill/119th-congress/senate-bill/5678",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("SponsoredBills", () => {
  describe("empty state", () => {
    it("renders empty state when no bills", () => {
      render(<SponsoredBills bills={[]} totalCount={0} />);

      expect(screen.getByText("No Sponsored Bills")).toBeInTheDocument();
    });
  });

  describe("with bills", () => {
    it("renders bill cards", () => {
      render(<SponsoredBills bills={mockBills} totalCount={2} />);

      expect(screen.getByText("A bill to improve things")).toBeInTheDocument();
      expect(screen.getByText("A bill that became law")).toBeInTheDocument();
    });

    it("renders status badges", () => {
      render(<SponsoredBills bills={mockBills} totalCount={2} />);

      expect(screen.getByText("Introduced")).toBeInTheDocument();
      expect(screen.getByText("Became Law")).toBeInTheDocument();
    });

    it("displays bill numbers correctly", () => {
      render(<SponsoredBills bills={mockBills} totalCount={2} />);

      expect(screen.getByText("H.R.1234")).toBeInTheDocument();
      expect(screen.getByText("S.5678")).toBeInTheDocument();
    });

    it("shows summary when available", () => {
      render(<SponsoredBills bills={mockBills} totalCount={2} />);

      expect(screen.getByText(/significant improvements/)).toBeInTheDocument();
    });
  });

  describe("expand/collapse summary", () => {
    it("shows expand button for long summaries", () => {
      const billWithLongSummary: Bill = {
        ...mockBills[0],
        summary:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      };

      render(<SponsoredBills bills={[billWithLongSummary]} totalCount={1} />);

      expect(screen.getByText(/Read more/)).toBeInTheDocument();
    });

    it("toggles summary expansion on click", () => {
      const billWithLongSummary: Bill = {
        ...mockBills[0],
        summary:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. END_MARKER",
      };

      render(<SponsoredBills bills={[billWithLongSummary]} totalCount={1} />);

      expect(screen.queryByText(/END_MARKER/)).not.toBeInTheDocument();

      fireEvent.click(screen.getByText(/Read more/));

      expect(screen.getByText(/END_MARKER/)).toBeInTheDocument();
      expect(screen.getByText(/Show less/)).toBeInTheDocument();
    });
  });

  describe("load more functionality", () => {
    it("shows load more button when more bills available", () => {
      const manyBills = Array.from({ length: 15 }, (_, i) => ({
        ...mockBills[0],
        id: `bill-${i}`,
        billNumber: String(1000 + i),
      }));

      render(<SponsoredBills bills={manyBills} totalCount={15} />);

      expect(screen.getByText(/Load More Bills/)).toBeInTheDocument();
    });

    it("hides load more button when all bills displayed", () => {
      render(<SponsoredBills bills={mockBills} totalCount={2} />);

      expect(screen.queryByText(/Load More Bills/)).not.toBeInTheDocument();
    });
  });
});
