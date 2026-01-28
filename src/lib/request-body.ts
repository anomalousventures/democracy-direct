import { z } from "zod";

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues?: z.ZodIssue[] };

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<ParseResult<T>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return { success: false, error: "Invalid JSON" };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { success: false, error: "Invalid request body", issues: result.error.issues };
  }

  return { success: true, data: result.data };
}

export const templateBodySchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  issueTags: z.array(z.string()).optional(),
  turnstileToken: z.string().optional(),
  forkedFromId: z.string().optional(),
});

export type TemplateBody = z.infer<typeof templateBodySchema>;

export const flagBodySchema = z.object({
  reason: z.string().min(1),
  details: z.string().max(2000).optional(),
});

export type FlagBody = z.infer<typeof flagBodySchema>;
