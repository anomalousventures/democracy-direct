import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RepTabs } from "./RepTabs";
import type { VoteWithPosition, VoteStats } from "@/db/queries/votes";
import type { Bill } from "@/db/schema";

const mockStats: VoteStats = {
  totalVotes: 50,
  yeas: 30,
  nays: 15,
  notVoting: 3,
  present: 2,
};

const mockVotes: VoteWithPosition[] = [
  {
    id: "vote-1",
    rollCall: 123,
    chamber: "house",
    congress: 119,
    session: 1,
    date: new Date("2025-01-15"),
    question: "Test Vote Question",
    result: "Passed",
    billNumber: "H.R.1234",
    billTitle: "Test Bill",
    billSubjects: null,
    sourceUrl: "https://congress.gov/vote/119/house/123",
    yeas: 230,
    nays: 198,
    notVoting: 5,
    present: 2,
    createdAt: new Date(),
    position: "yea",
  },
];

const mockBills: Bill[] = [
  {
    id: "bill-1",
    billNumber: "1234",
    billType: "hr",
    congress: 119,
    title: "Test Bill Title",
    summary: "Test summary",
    status: "introduced",
    subjects: ["Economy"],
    introducedDate: new Date("2025-01-10"),
    latestActionDate: new Date("2025-01-15"),
    latestActionText: "Referred to committee",
    sponsorBioguideId: "A000001",
    congressGovUrl: "https://congress.gov/bill",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockContactInfo = {
  phone: "202-555-1234",
  contactFormUrl: "https://example.gov/contact",
  address: "123 Capitol Hill",
  twitterHandle: "reptest",
  facebookId: "reptest",
};

describe("RepTabs", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.stubGlobal("location", {
      ...originalLocation,
      hash: "",
      pathname: "/rep/A000001",
      search: "",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("tab rendering", () => {
    it("renders all three tabs", () => {
      render(
        <RepTabs
          bioguideId="A000001"
          chamber="house"
          contactInfo={mockContactInfo}
          votes={mockVotes}
          voteStats={mockStats}
          bills={mockBills}
          billCount={1}
        />
      );

      expect(screen.getByRole("tab", { name: /Contact/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Voting Record/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Sponsored Bills/i })).toBeInTheDocument();
    });

    it("hides count badges when zero", () => {
      render(
        <RepTabs
          bioguideId="A000001"
          chamber="house"
          contactInfo={mockContactInfo}
          votes={[]}
          voteStats={{ totalVotes: 0, yeas: 0, nays: 0, notVoting: 0, present: 0 }}
          bills={[]}
          billCount={0}
        />
      );

      const votesTab = screen.getByRole("tab", { name: /Voting Record/i });
      const billsTab = screen.getByRole("tab", { name: /Sponsored Bills/i });

      expect(votesTab.textContent).toBe("Voting Record");
      expect(billsTab.textContent).toBe("Sponsored Bills");
    });
  });

  describe("tab content", () => {
    it("shows contact info by default", () => {
      render(
        <RepTabs
          bioguideId="A000001"
          chamber="house"
          contactInfo={mockContactInfo}
          votes={mockVotes}
          voteStats={mockStats}
          bills={mockBills}
          billCount={1}
        />
      );

      expect(screen.getByText("Contact Information")).toBeInTheDocument();
      expect(screen.getByText("202-555-1234")).toBeInTheDocument();
    });

    it("renders voting record tab trigger", () => {
      render(
        <RepTabs
          bioguideId="A000001"
          chamber="house"
          contactInfo={mockContactInfo}
          votes={mockVotes}
          voteStats={mockStats}
          bills={mockBills}
          billCount={1}
        />
      );

      const votesTab = screen.getByRole("tab", { name: /Voting Record/i });
      expect(votesTab).toBeInTheDocument();
      expect(votesTab).toHaveAttribute("aria-selected", "false");
    });

    it("renders sponsored bills tab trigger", () => {
      render(
        <RepTabs
          bioguideId="A000001"
          chamber="house"
          contactInfo={mockContactInfo}
          votes={mockVotes}
          voteStats={mockStats}
          bills={mockBills}
          billCount={1}
        />
      );

      const billsTab = screen.getByRole("tab", { name: /Sponsored Bills/i });
      expect(billsTab).toBeInTheDocument();
      expect(billsTab).toHaveAttribute("aria-selected", "false");
    });
  });
});
