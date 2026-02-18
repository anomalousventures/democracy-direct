import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/preact";
import { CampaignFinance } from "./CampaignFinance";
import type {
  CampaignFinanceData,
  TopPacDonor,
  IndependentExpenditureWithCommittee,
} from "@/db/queries/campaign-finance";

const mockFinanceData: CampaignFinanceData = {
  id: "finance-1",
  bioguideId: "S000033",
  fecId: "S4VT00033",
  cycle: "2024",
  totalReceipts: 6000000,
  totalDisbursements: 3500000,
  cashOnHand: 1500000,
  totalFromPACs: 2000000,
  totalFromIndividuals: 3000000,
  debtsOwed: 50000,
  sourceUrl: "https://www.fec.gov/data/candidate/S4VT00033/",
  lastUpdated: new Date("2025-06-01"),
  createdAt: new Date("2025-06-01"),
};

describe("CampaignFinance", () => {
  describe("null data", () => {
    it("renders not-available message when data is null", () => {
      render(<CampaignFinance data={null} />);

      expect(screen.getByText("Campaign finance data not available.")).toBeInTheDocument();
    });

    it("does not render financial figures when data is null", () => {
      render(<CampaignFinance data={null} />);

      expect(screen.queryByText("Total Raised")).not.toBeInTheDocument();
    });
  });

  describe("with complete data", () => {
    it("displays total raised prominently", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("Total Raised")).toBeInTheDocument();
      expect(screen.getByText("$6,000,000")).toBeInTheDocument();
    });

    it("displays cycle year", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("2024 Cycle")).toBeInTheDocument();
    });

    it("displays disbursements", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("Spent")).toBeInTheDocument();
      expect(screen.getByText("$3,500,000")).toBeInTheDocument();
    });

    it("displays cash on hand", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("Cash on Hand")).toBeInTheDocument();
      expect(screen.getByText("$1,500,000")).toBeInTheDocument();
    });
  });

  describe("debts display", () => {
    it("shows debts when greater than zero", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByTestId("debts-section")).toBeInTheDocument();
      expect(screen.getByText("Debts Owed")).toBeInTheDocument();
      expect(screen.getByText("$50,000")).toBeInTheDocument();
    });

    it("hides debts when zero", () => {
      render(<CampaignFinance data={{ ...mockFinanceData, debtsOwed: 0 }} />);

      expect(screen.queryByTestId("debts-section")).not.toBeInTheDocument();
      expect(screen.queryByText("Debts Owed")).not.toBeInTheDocument();
    });

    it("hides debts when null", () => {
      render(<CampaignFinance data={{ ...mockFinanceData, debtsOwed: null }} />);

      expect(screen.queryByTestId("debts-section")).not.toBeInTheDocument();
    });
  });

  describe("funding breakdown bar", () => {
    it("calculates correct three-segment percentages", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("33%")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("17%")).toBeInTheDocument();
    });

    it("renders PAC, individual, and other bar segments", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByTestId("pac-bar")).toHaveStyle({ width: "33%" });
      expect(screen.getByTestId("individual-bar")).toHaveStyle({ width: "50%" });
      expect(screen.getByTestId("other-bar")).toHaveStyle({ width: "17%" });
    });

    it("shows dollar amounts for all segments", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("$2,000,000")).toBeInTheDocument();
      expect(screen.getByText("$3,000,000")).toBeInTheDocument();
      expect(screen.getByText("$1,000,000")).toBeInTheDocument();
    });

    it("has accessible label including all segments", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(
        screen.getByRole("img", {
          name: "Funding breakdown: 33% from pacs, 50% from individuals, 17% from other",
        })
      ).toBeInTheDocument();
    });

    it("hides Other segment when PACs + Individuals equal totalReceipts", () => {
      render(<CampaignFinance data={{ ...mockFinanceData, totalReceipts: 5000000 }} />);

      expect(screen.getByTestId("pac-bar")).toBeInTheDocument();
      expect(screen.getByTestId("individual-bar")).toBeInTheDocument();
      expect(screen.queryByTestId("other-bar")).not.toBeInTheDocument();
    });

    it("handles 100% individual funding", () => {
      render(
        <CampaignFinance
          data={{
            ...mockFinanceData,
            totalReceipts: 1000000,
            totalFromPACs: 0,
            totalFromIndividuals: 1000000,
          }}
        />
      );

      expect(screen.getByTestId("pac-bar")).toHaveStyle({ width: "0%" });
      expect(screen.getByTestId("individual-bar")).toHaveStyle({ width: "100%" });
      expect(screen.queryByTestId("other-bar")).not.toBeInTheDocument();
    });
  });

  describe("currency formatting", () => {
    it("formats large numbers with commas", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("$6,000,000")).toBeInTheDocument();
    });

    it("formats zero values", () => {
      render(
        <CampaignFinance
          data={{
            ...mockFinanceData,
            totalReceipts: 0,
            totalDisbursements: 0,
            cashOnHand: 0,
          }}
        />
      );

      const zeroValues = screen.getAllByText("$0");
      expect(zeroValues.length).toBeGreaterThanOrEqual(3);
    });

    it("formats small amounts without decimals", () => {
      render(<CampaignFinance data={{ ...mockFinanceData, totalReceipts: 1234 }} />);

      expect(screen.getByText("$1,234")).toBeInTheDocument();
    });
  });

  describe("source attribution", () => {
    it("renders attribution link when data includes sourceUrl", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      const link = screen.getByText("Data from FEC.gov");
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute(
        "href",
        "https://www.fec.gov/data/candidate/S4VT00033/"
      );
    });

    it("does not render attribution when sourceUrl is null", () => {
      render(<CampaignFinance data={{ ...mockFinanceData, sourceUrl: null }} />);

      expect(screen.queryByText("Data from ProPublica / FEC.gov")).not.toBeInTheDocument();
    });
  });

  describe("top PAC donors", () => {
    const mockDonors: TopPacDonor[] = [
      {
        id: "pac-1",
        bioguideId: "S000033",
        committeeId: "C00000935",
        fecId: "S4VT00033",
        recipientCommitteeId: "C00401224",
        cycle: "2026",
        totalAmount: 10000,
        contributionCount: 2,
        lastContributionDate: new Date("2025-06-15"),
        committee: {
          fecCommitteeId: "C00000935",
          name: "NATIONAL BEER WHOLESALERS",
          designation: null,
          committeeType: null,
          party: null,
          treasurerName: null,
          state: null,
          sourceUrl: null,
          lastUpdated: new Date(),
          createdAt: new Date(),
        },
      },
    ];

    it("renders top PAC donors section when donors provided", () => {
      render(<CampaignFinance data={mockFinanceData} topPacDonors={mockDonors} />);

      expect(screen.getByTestId("top-pac-donors")).toBeInTheDocument();
      expect(screen.getByText("NATIONAL BEER WHOLESALERS")).toBeInTheDocument();
    });

    it("hides top PAC donors section when empty", () => {
      render(<CampaignFinance data={mockFinanceData} topPacDonors={[]} />);

      expect(screen.queryByTestId("top-pac-donors")).not.toBeInTheDocument();
    });

    it("links each donor to committee page", () => {
      render(<CampaignFinance data={mockFinanceData} topPacDonors={mockDonors} />);

      const link = screen.getByText("NATIONAL BEER WHOLESALERS").closest("a");
      expect(link).toHaveAttribute("href", "/committee/C00000935");
    });
  });

  describe("independent expenditures summary", () => {
    const mockExpenditures: IndependentExpenditureWithCommittee[] = [
      {
        id: "ie-1",
        bioguideId: "S000033",
        committeeId: "C00578997",
        fecId: "S4VT00033",
        cycle: "2026",
        totalAmount: 1500000,
        expenditureCount: 25,
        supportOppose: "S",
        committee: {
          fecCommitteeId: "C00578997",
          name: "SENATE LEADERSHIP FUND",
          designation: null,
          committeeType: null,
          party: null,
          treasurerName: null,
          state: null,
          sourceUrl: null,
          lastUpdated: new Date(),
          createdAt: new Date(),
        },
      },
      {
        id: "ie-2",
        bioguideId: "S000033",
        committeeId: "C00123456",
        fecId: "S4VT00033",
        cycle: "2026",
        totalAmount: 500000,
        expenditureCount: 10,
        supportOppose: "O",
        committee: {
          fecCommitteeId: "C00123456",
          name: "OPPOSE PAC",
          designation: null,
          committeeType: null,
          party: null,
          treasurerName: null,
          state: null,
          sourceUrl: null,
          lastUpdated: new Date(),
          createdAt: new Date(),
        },
      },
    ];

    it("renders independent expenditure summary when data provided", () => {
      render(<CampaignFinance data={mockFinanceData} independentExpenditures={mockExpenditures} />);

      expect(screen.getByTestId("independent-expenditures")).toBeInTheDocument();
      expect(screen.getByText("Supporting")).toBeInTheDocument();
      expect(screen.getByText("Opposing")).toBeInTheDocument();
    });

    it("hides independent expenditure summary when empty", () => {
      render(<CampaignFinance data={mockFinanceData} independentExpenditures={[]} />);

      expect(screen.queryByTestId("independent-expenditures")).not.toBeInTheDocument();
    });
  });

  describe("detail link", () => {
    it("renders detail link when bioguideId provided", () => {
      render(<CampaignFinance data={mockFinanceData} bioguideId="S000033" />);

      const link = screen.getByTestId("finance-detail-link");
      expect(link).toHaveAttribute("href", "/rep/S000033/finance");
    });

    it("hides detail link when bioguideId not provided", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.queryByTestId("finance-detail-link")).not.toBeInTheDocument();
    });
  });
});
