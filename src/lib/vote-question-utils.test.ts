import { describe, it, expect } from "vitest";
import { enrichVoteQuestion } from "./vote-question-utils";

describe("enrichVoteQuestion", () => {
  it("returns original question when no amendment purpose is provided", () => {
    expect(enrichVoteQuestion({ question: "On the Amendment" })).toBe("On the Amendment");
  });

  it("returns original question when amendment purpose is null", () => {
    expect(enrichVoteQuestion({ question: "On the Amendment", amendmentPurpose: null })).toBe(
      "On the Amendment"
    );
  });

  it('enriches "On the Amendment" with amendment purpose', () => {
    expect(
      enrichVoteQuestion({
        question: "On the Amendment",
        amendmentPurpose: "To eliminate funding for refugee and entrant assistance",
      })
    ).toBe("On the Amendment: To eliminate funding for refugee and entrant assistance");
  });

  it('enriches "On the Motion" with amendment purpose', () => {
    expect(
      enrichVoteQuestion({
        question: "On the Motion",
        amendmentPurpose: "To strike section 5",
      })
    ).toBe("On the Motion: To strike section 5");
  });

  it('enriches "On the Motion to Table" with amendment purpose', () => {
    expect(
      enrichVoteQuestion({
        question: "On the Motion to Table",
        amendmentPurpose: "To reduce appropriations by 10%",
      })
    ).toBe("On the Motion to Table: To reduce appropriations by 10%");
  });

  it("does not enrich specific/non-ambiguous questions", () => {
    expect(
      enrichVoteQuestion({
        question: "On Passage of the Bill",
        amendmentPurpose: "To eliminate funding",
      })
    ).toBe("On Passage of the Bill");
  });

  it("does not enrich question that contains ambiguous text but is longer", () => {
    expect(
      enrichVoteQuestion({
        question: "On the Amendment S.Amdt. 4272",
        amendmentPurpose: "To eliminate funding",
      })
    ).toBe("On the Amendment S.Amdt. 4272");
  });

  it("handles case-insensitive matching", () => {
    expect(
      enrichVoteQuestion({
        question: "on the amendment",
        amendmentPurpose: "To strike section 5",
      })
    ).toBe("on the amendment: To strike section 5");
  });

  it("handles whitespace in question", () => {
    expect(
      enrichVoteQuestion({
        question: " On the Amendment ",
        amendmentPurpose: "To strike section 5",
      })
    ).toBe(" On the Amendment : To strike section 5");
  });
});
