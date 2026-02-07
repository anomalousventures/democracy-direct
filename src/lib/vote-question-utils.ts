const AMBIGUOUS_PATTERNS = ["On the Amendment", "On the Motion", "On the Motion to Table"] as const;

interface VoteQuestionContext {
  question: string;
  amendmentPurpose?: string | null;
  amendmentNumber?: string | null;
}

export function enrichVoteQuestion(ctx: VoteQuestionContext): string {
  if (!ctx.amendmentPurpose) return ctx.question;

  const isAmbiguous = AMBIGUOUS_PATTERNS.some(
    (pattern) => ctx.question.trim().toLowerCase() === pattern.toLowerCase()
  );

  if (!isAmbiguous) return ctx.question;

  return `${ctx.question}: ${ctx.amendmentPurpose}`;
}
