import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import { MemberVoteList } from "./MemberVoteList";
import type { VoteMember } from "@/lib/types/vote";

const members: VoteMember[] = [
  { bioguideId: "A000001", name: "Alice Adams", party: "D", state: "CA", position: "yea" },
  { bioguideId: "B000002", name: "Bob Baker", party: "R", state: "TX", position: "nay" },
  { bioguideId: "C000003", name: "Carol Chen", party: "D", state: "NY", position: "yea" },
  { bioguideId: "D000004", name: "Dan Davis", party: "I", state: "VT", position: "not_voting" },
  { bioguideId: "E000005", name: "Eve Evans", party: "R", state: "FL", position: "present" },
];

function getMemberLinks() {
  return screen.getAllByRole("link");
}

describe("MemberVoteList", () => {
  it("renders all members by default", () => {
    render(<MemberVoteList members={members} />);

    for (const m of members) {
      expect(screen.getByText(m.name)).toBeInTheDocument();
    }
    expect(getMemberLinks()).toHaveLength(members.length);
  });

  it("filters by yea position", () => {
    render(<MemberVoteList members={members} />);

    fireEvent.click(screen.getByRole("button", { name: "Yea" }));

    expect(screen.getByText("Alice Adams")).toBeInTheDocument();
    expect(screen.getByText("Carol Chen")).toBeInTheDocument();
    expect(screen.queryByText("Bob Baker")).not.toBeInTheDocument();
    expect(screen.queryByText("Dan Davis")).not.toBeInTheDocument();
    expect(screen.queryByText("Eve Evans")).not.toBeInTheDocument();
  });

  it("filters by nay position", () => {
    render(<MemberVoteList members={members} />);

    fireEvent.click(screen.getByRole("button", { name: "Nay" }));

    expect(screen.getByText("Bob Baker")).toBeInTheDocument();
    expect(screen.queryByText("Alice Adams")).not.toBeInTheDocument();
  });

  it("filters by not_voting position", () => {
    render(<MemberVoteList members={members} />);

    fireEvent.click(screen.getByRole("button", { name: "Not Voting" }));

    expect(screen.getByText("Dan Davis")).toBeInTheDocument();
    expect(getMemberLinks()).toHaveLength(1);
  });

  it("filters by present position", () => {
    render(<MemberVoteList members={members} />);

    fireEvent.click(screen.getByRole("button", { name: "Present" }));

    expect(screen.getByText("Eve Evans")).toBeInTheDocument();
    expect(getMemberLinks()).toHaveLength(1);
  });

  it("searches by member name", () => {
    render(<MemberVoteList members={members} />);

    fireEvent.change(screen.getByPlaceholderText("Search members..."), {
      target: { value: "alice" },
    });

    expect(screen.getByText("Alice Adams")).toBeInTheDocument();
    expect(screen.queryByText("Bob Baker")).not.toBeInTheDocument();
  });

  it("searches by state", () => {
    render(<MemberVoteList members={members} />);

    fireEvent.change(screen.getByPlaceholderText("Search members..."), {
      target: { value: "TX" },
    });

    expect(screen.getByText("Bob Baker")).toBeInTheDocument();
    expect(getMemberLinks()).toHaveLength(1);
  });

  it("matches against party field", () => {
    const testMembers: VoteMember[] = [
      { bioguideId: "X000001", name: "Zoe Xu", party: "R", state: "WY", position: "yea" },
      { bioguideId: "Y000002", name: "Leo Yu", party: "Lib", state: "WV", position: "nay" },
    ];
    render(<MemberVoteList members={testMembers} />);

    fireEvent.change(screen.getByPlaceholderText("Search members..."), {
      target: { value: "lib" },
    });

    expect(screen.getByText("Leo Yu")).toBeInTheDocument();
    expect(screen.queryByText("Zoe Xu")).not.toBeInTheDocument();
  });

  it("combines filter and search", () => {
    render(<MemberVoteList members={members} />);

    fireEvent.click(screen.getByRole("button", { name: "Yea" }));
    fireEvent.change(screen.getByPlaceholderText("Search members..."), {
      target: { value: "carol" },
    });

    expect(screen.getByText("Carol Chen")).toBeInTheDocument();
    expect(getMemberLinks()).toHaveLength(1);
  });

  it("shows empty message when no members match", () => {
    render(<MemberVoteList members={members} />);

    fireEvent.change(screen.getByPlaceholderText("Search members..."), {
      target: { value: "zzz_no_match" },
    });

    expect(screen.getByText("No members match your filters.")).toBeInTheDocument();
  });
});
