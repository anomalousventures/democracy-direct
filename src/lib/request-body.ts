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
  turnstileToken: z.string().min(1),
});

export type FlagBody = z.infer<typeof flagBodySchema>;

export const requestOtpBodySchema = z.object({
  email: z.string().email(),
  turnstileToken: z.string().min(1),
});

export type RequestOtpBody = z.infer<typeof requestOtpBodySchema>;

export const verifyOtpBodySchema = z.object({
  email: z.string().email(),
  otp: z.string().min(1),
});

export type VerifyOtpBody = z.infer<typeof verifyOtpBodySchema>;

export const suggestTagBodySchema = z.object({
  name: z
    .string()
    .min(2, "Tag name must be at least 2 characters")
    .max(50, "Tag name must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Tag name must be lowercase alphanumeric with hyphens only")
    .transform((s) => s.toLowerCase().trim()),
});

export type SuggestTagBody = z.infer<typeof suggestTagBodySchema>;

export const adminTagActionBodySchema = z.object({
  tagId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export type AdminTagActionBody = z.infer<typeof adminTagActionBodySchema>;
