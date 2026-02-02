import { z } from "zod";

export const moderationCategorySchema = z.object({
  harassment: z.number(),
  "harassment/threatening": z.number(),
  hate: z.number(),
  "hate/threatening": z.number(),
  "self-harm": z.number(),
  "self-harm/intent": z.number(),
  "self-harm/instructions": z.number(),
  sexual: z.number(),
  "sexual/minors": z.number(),
  violence: z.number(),
  "violence/graphic": z.number(),
});

export type ModerationCategory = z.infer<typeof moderationCategorySchema>;

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: ModerationCategory;
}

export const openAIModerationResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  results: z.array(
    z.object({
      flagged: z.boolean(),
      categories: z.record(z.string(), z.boolean()),
      category_scores: moderationCategorySchema,
    })
  ),
});

export type OpenAIModerationResponse = z.infer<typeof openAIModerationResponseSchema>;

export async function moderateContent(content: string, apiKey: string): Promise<ModerationResult> {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }

  if (!content?.trim()) {
    throw new Error("Content is required for moderation");
  }

  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: content,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  const parseResult = openAIModerationResponseSchema.safeParse(json);

  if (!parseResult.success) {
    throw new Error("Invalid response format from OpenAI Moderation API");
  }

  const data = parseResult.data;

  if (data.results.length === 0) {
    throw new Error("Empty results from OpenAI Moderation API");
  }

  const result = data.results[0];

  return {
    flagged: result.flagged,
    categories: result.categories,
    categoryScores: result.category_scores,
  };
}

export function getHighestCategoryScore(scores: ModerationCategory): {
  category: string;
  score: number;
} {
  const entries = Object.entries(scores);
  let highestCategory = entries[0]?.[0] ?? "unknown";
  let highestScore = entries[0]?.[1] ?? 0;

  for (const [category, score] of entries) {
    if (score > highestScore) {
      highestScore = score;
      highestCategory = category;
    }
  }

  return { category: highestCategory, score: highestScore };
}
