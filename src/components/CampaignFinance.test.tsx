import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/preact";
import { CampaignFinance } from "./CampaignFinance";
import type { CampaignFinanceData } from "@/db/queries/campaign-finance";

const mockFinanceData: CampaignFinanceData = {
  id: "finance-1",
  bioguideId: "S000033",
  fecId: "S4VT00033",
  cycle: "2024",
  totalReceipts: 5000000,
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
      expect(screen.queryByText("Campaign Finance")).not.toBeInTheDocument();
    });
  });

  describe("with complete data", () => {
    it("displays total raised prominently", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("Total Raised")).toBeInTheDocument();
      expect(screen.getByText("$5,000,000")).toBeInTheDocument();
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

    it("displays heading", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("Campaign Finance")).toBeInTheDocument();
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

  describe("PAC vs individual breakdown", () => {
    it("calculates correct percentages", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("40%")).toBeInTheDocument();
      expect(screen.getByText("60%")).toBeInTheDocument();
    });

    it("renders PAC and individual bar segments", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      const pacBar = screen.getByTestId("pac-bar");
      const individualBar = screen.getByTestId("individual-bar");

      expect(pacBar).toHaveStyle({ width: "40%" });
      expect(individualBar).toHaveStyle({ width: "60%" });
    });

    it("shows PAC and individual dollar amounts", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("$2,000,000")).toBeInTheDocument();
      expect(screen.getByText("$3,000,000")).toBeInTheDocument();
    });

    it("has accessible label on breakdown bar", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(
        screen.getByRole("img", {
          name: "Funding breakdown: 40% from PACs, 60% from individuals",
        })
      ).toBeInTheDocument();
    });

    it("handles 100% individual funding", () => {
      render(
        <CampaignFinance
          data={{ ...mockFinanceData, totalFromPACs: 0, totalFromIndividuals: 1000000 }}
        />
      );

      const pacBar = screen.getByTestId("pac-bar");
      const individualBar = screen.getByTestId("individual-bar");

      expect(pacBar).toHaveStyle({ width: "0%" });
      expect(individualBar).toHaveStyle({ width: "100%" });
    });
  });

  describe("currency formatting", () => {
    it("formats large numbers with commas", () => {
      render(<CampaignFinance data={mockFinanceData} />);

      expect(screen.getByText("$5,000,000")).toBeInTheDocument();
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

      const link = screen.getByText("Data from ProPublica / FEC.gov");
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
});
