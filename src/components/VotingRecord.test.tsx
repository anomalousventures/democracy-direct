import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VotingRecord } from "./VotingRecord";
import type { VoteWithPosition, VoteStats } from "@/db/queries/votes";

const mockStats: VoteStats = {
  totalVotes: 100,
  yeas: 60,
  nays: 30,
  notVoting: 5,
  present: 5,
};

const mockVotes: VoteWithPosition[] = [
  {
    id: "vote-1",
    rollCall: 123,
    chamber: "house",
    congress: 119,
    session: 1,
    date: new Date("2025-01-15"),
    question: "On Passage of the Bill",
    result: "Passed",
    billNumber: "H.R.1234",
    billTitle: "Test Bill Title",
    billSubjects: ["Economy", "Taxes"],
    sourceUrl: "https://congress.gov/vote/119/house/123",
    yeas: 230,
    nays: 198,
    notVoting: 5,
    present: 2,
    createdAt: new Date(),
    position: "yea",
  },
  {
    id: "vote-2",
    rollCall: 124,
    chamber: "house",
    congress: 119,
    session: 1,
    date: new Date("2025-01-16"),
    question: "On the Motion to Recommit",
    result: "Failed",
    billNumber: null,
    billTitle: null,
    billSubjects: null,
    sourceUrl: "https://congress.gov/vote/119/house/124",
    yeas: 198,
    nays: 230,
    notVoting: 5,
    present: 2,
    createdAt: new Date(),
    position: "nay",
  },
];

describe("VotingRecord", () => {
  describe("empty state", () => {
    it("renders empty state when no votes", () => {
      render(
        <VotingRecord
          votes={[]}
          stats={{ totalVotes: 0, yeas: 0, nays: 0, notVoting: 0, present: 0 }}
          bioguideId="A000001"
        />
      );

      expect(screen.getByText("No Recorded Votes")).toBeInTheDocument();
    });
  });

  describe("with votes", () => {
    it("renders vote stats bar", () => {
      render(<VotingRecord votes={mockVotes} stats={mockStats} bioguideId="A000001" />);

      expect(screen.getByText("Voting Summary")).toBeInTheDocument();
      expect(screen.getByText(/100 total votes/)).toBeInTheDocument();
    });

    it("renders vote cards with position badges", () => {
      render(<VotingRecord votes={mockVotes} stats={mockStats} bioguideId="A000001" />);

      expect(screen.getByText("On Passage of the Bill")).toBeInTheDocument();
      const badges = screen.getAllByText(/^(Yea|Nay)$/);
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    it("displays bill number when available", () => {
      render(<VotingRecord votes={mockVotes} stats={mockStats} bioguideId="A000001" />);

      expect(screen.getByText(/H\.R\.1234/)).toBeInTheDocument();
    });

    it("renders vote links to source URL", () => {
      render(<VotingRecord votes={mockVotes} stats={mockStats} bioguideId="A000001" />);

      const links = screen.getAllByRole("link");
      const sourceLink = links.find((link) => link.getAttribute("href")?.includes("congress.gov"));
      expect(sourceLink).toHaveAttribute("href", "https://congress.gov/vote/119/house/123");
    });

    it("shows result badge with correct styling", () => {
      render(<VotingRecord votes={mockVotes} stats={mockStats} bioguideId="A000001" />);

      expect(screen.getByText("Passed")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });
  });

  describe("load more functionality", () => {
    it("shows load more button when more votes available", () => {
      const manyVotes = Array.from({ length: 15 }, (_, i) => ({
        ...mockVotes[0],
        id: `vote-${i}`,
        rollCall: 100 + i,
      }));

      render(
        <VotingRecord
          votes={manyVotes}
          stats={{ ...mockStats, totalVotes: 15 }}
          bioguideId="A000001"
        />
      );

      expect(screen.getByText(/Load More Votes/)).toBeInTheDocument();
      expect(screen.getByText(/5 remaining/)).toBeInTheDocument();
    });

    it("loads more votes when button clicked", () => {
      const manyVotes = Array.from({ length: 15 }, (_, i) => ({
        ...mockVotes[0],
        id: `vote-${i}`,
        rollCall: 100 + i,
        question: `Vote Question ${i}`,
      }));

      render(
        <VotingRecord
          votes={manyVotes}
          stats={{ ...mockStats, totalVotes: 15 }}
          bioguideId="A000001"
        />
      );

      expect(screen.queryByText("Vote Question 10")).not.toBeInTheDocument();

      fireEvent.click(screen.getByText(/Load More Votes/));

      expect(screen.getByText("Vote Question 10")).toBeInTheDocument();
    });

    it("hides load more button when all votes displayed", () => {
      render(<VotingRecord votes={mockVotes} stats={mockStats} bioguideId="A000001" />);

      expect(screen.queryByText(/Load More Votes/)).not.toBeInTheDocument();
    });
  });

  describe("scroll container", () => {
    it("renders scroll container with correct test id", () => {
      render(<VotingRecord votes={mockVotes} stats={mockStats} bioguideId="A000001" />);

      expect(screen.getByTestId("voting-record-scroll-container")).toBeInTheDocument();
    });

    it("applies scroll container civic class", () => {
      render(<VotingRecord votes={mockVotes} stats={mockStats} bioguideId="A000001" />);

      const container = screen.getByTestId("voting-record-scroll-container");
      expect(container).toHaveClass("scroll-container-civic");
    });

    it("applies max height constraints", () => {
      render(<VotingRecord votes={mockVotes} stats={mockStats} bioguideId="A000001" />);

      const container = screen.getByTestId("voting-record-scroll-container");
      expect(container).toHaveClass("max-h-[350px]");
      expect(container).toHaveClass("md:max-h-[500px]");
    });

    it("adds shadow to sticky header when scrolled", () => {
      const manyVotes = Array.from({ length: 15 }, (_, i) => ({
        ...mockVotes[0],
        id: `vote-${i}`,
        rollCall: 100 + i,
      }));

      render(
        <VotingRecord
          votes={manyVotes}
          stats={{ ...mockStats, totalVotes: 15 }}
          bioguideId="A000001"
        />
      );

      const container = screen.getByTestId("voting-record-scroll-container");
      const summarySection = screen.getByText("Voting Summary").closest("div")?.parentElement;

      expect(summarySection).toHaveClass("sticky", "top-0", "z-10");

      fireEvent.scroll(container, { target: { scrollTop: 100 } });

      expect(summarySection).toHaveClass("shadow-md");
    });
  });
});
