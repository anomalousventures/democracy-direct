export interface ModerationCategory {
  harassment: number;
  "harassment/threatening": number;
  hate: number;
  "hate/threatening": number;
  "self-harm": number;
  "self-harm/intent": number;
  "self-harm/instructions": number;
  sexual: number;
  "sexual/minors": number;
  violence: number;
  "violence/graphic": number;
}

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: ModerationCategory;
}

export interface OpenAIModerationResponse {
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: Record<string, boolean>;
    category_scores: Record<string, number>;
  }>;
}

export async function moderateContent(content: string, apiKey: string): Promise<ModerationResult> {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }

  if (!content || content.trim().length === 0) {
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
    throw new Error(`OpenAI Moderation API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as OpenAIModerationResponse;

  if (!data.results || data.results.length === 0) {
    throw new Error("Invalid response from OpenAI Moderation API");
  }

  const result = data.results[0];

  return {
    flagged: result.flagged,
    categories: result.categories,
    categoryScores: result.category_scores as unknown as ModerationCategory,
  };
}

export function getHighestCategoryScore(scores: ModerationCategory): {
  category: string;
  score: number;
} {
  let highestCategory = "";
  let highestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      highestCategory = category;
    }
  }

  return { category: highestCategory, score: highestScore };
}
