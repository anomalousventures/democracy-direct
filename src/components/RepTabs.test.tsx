import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/preact";
import { RepTabs } from "./RepTabs";
import type { VoteWithPosition, VoteStats } from "@/db/queries/votes";
import type { CampaignFinanceData } from "@/db/queries/campaign-finance";
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
    billId: null,
    amendmentId: null,
    legislationType: null,
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

const mockFinanceData: CampaignFinanceData = {
  id: "finance-1",
  bioguideId: "A000001",
  fecId: "H4NY00001",
  cycle: "2026",
  totalReceipts: 6000000,
  totalDisbursements: 3500000,
  cashOnHand: 1500000,
  totalFromPACs: 2000000,
  totalFromIndividuals: 3000000,
  debtsOwed: 50000,
  sourceUrl: "https://www.fec.gov/data/candidate/H4NY00001/",
  lastUpdated: new Date("2025-06-01"),
  createdAt: new Date("2025-06-01"),
};

const mockContactInfo = {
  phone: "202-555-1234",
  contactFormUrl: "https://example.gov/contact",
  address: "123 Capitol Hill",
  website: "https://example.gov",
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
    it("renders three tabs when no finance data", () => {
      render(
        <RepTabs
          contactInfo={mockContactInfo}
          votes={mockVotes}
          voteStats={mockStats}
          bills={mockBills}
          billCount={1}
          financeData={null}
        />
      );

      expect(screen.getByRole("tab", { name: /Contact/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Voting Record/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Sponsored Bills/i })).toBeInTheDocument();
    });

    it("hides count badges when zero", () => {
      render(
        <RepTabs
          contactInfo={mockContactInfo}
          votes={[]}
          voteStats={{ totalVotes: 0, yeas: 0, nays: 0, notVoting: 0, present: 0 }}
          bills={[]}
          billCount={0}
          financeData={null}
        />
      );

      const votesTab = screen.getByRole("tab", { name: /Voting Record/i });
      const billsTab = screen.getByRole("tab", { name: /Sponsored Bills/i });

      expect(votesTab.textContent).toContain("Voting Record");
      expect(votesTab.textContent).not.toMatch(/\d/);
      expect(billsTab.textContent).toContain("Sponsored Bills");
      expect(billsTab.textContent).not.toMatch(/\d/);
    });
  });

  describe("tab content", () => {
    it("shows contact info by default", () => {
      render(
        <RepTabs
          contactInfo={mockContactInfo}
          votes={mockVotes}
          voteStats={mockStats}
          bills={mockBills}
          billCount={1}
          financeData={null}
        />
      );

      const contactTab = screen.getByRole("tab", { name: /Contact/i });
      expect(contactTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText("DC Office Phone")).toBeInTheDocument();
    });

    it("renders voting record tab trigger with count badge", () => {
      render(
        <RepTabs
          contactInfo={mockContactInfo}
          votes={mockVotes}
          voteStats={mockStats}
          bills={mockBills}
          billCount={1}
          financeData={null}
        />
      );

      const votesTab = screen.getByRole("tab", { name: /Voting Record/i });
      expect(votesTab).toBeInTheDocument();
      expect(votesTab.textContent).toContain("50");
    });

    it("renders sponsored bills tab trigger with count badge", () => {
      render(
        <RepTabs
          contactInfo={mockContactInfo}
          votes={mockVotes}
          voteStats={mockStats}
          bills={mockBills}
          billCount={1}
          financeData={null}
        />
      );

      const billsTab = screen.getByRole("tab", { name: /Sponsored Bills/i });
      expect(billsTab).toBeInTheDocument();
      expect(billsTab).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("finance tab", () => {
    it("renders Finance tab when financeData is provided", () => {
      render(
        <RepTabs
          contactInfo={mockContactInfo}
          votes={mockVotes}
          voteStats={mockStats}
          bills={mockBills}
          billCount={1}
          financeData={mockFinanceData}
        />
      );

      expect(screen.getByRole("tab", { name: /Campaign Finance/i })).toBeInTheDocument();
    });

    it("does not render Finance tab when financeData is null", () => {
      render(
        <RepTabs
          contactInfo={mockContactInfo}
          votes={mockVotes}
          voteStats={mockStats}
          bills={mockBills}
          billCount={1}
          financeData={null}
        />
      );

      expect(screen.queryByRole("tab", { name: /Campaign Finance/i })).not.toBeInTheDocument();
    });

    it("renders all four tabs when finance data is available", () => {
      render(
        <RepTabs
          contactInfo={mockContactInfo}
          votes={mockVotes}
          voteStats={mockStats}
          bills={mockBills}
          billCount={1}
          financeData={mockFinanceData}
        />
      );

      expect(screen.getByRole("tab", { name: /Contact/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Voting Record/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Sponsored Bills/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Campaign Finance/i })).toBeInTheDocument();
    });
  });
});
