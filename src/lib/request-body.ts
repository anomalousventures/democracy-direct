export type ParseResult<T> = { success: true; data: T } | { success: false; error: string };

export async function parseJsonBody<T>(
  request: Request,
  validator: (data: unknown) => data is T
): Promise<ParseResult<T>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return { success: false, error: "Invalid JSON" };
  }

  if (!validator(parsed)) {
    return { success: false, error: "Invalid request body" };
  }

  return { success: true, data: parsed };
}

export function isTemplateBody(data: unknown): data is {
  title: string;
  body: string;
  issueTags?: string[];
  turnstileToken?: string;
  forkedFromId?: string;
} {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.title !== "string" && obj.title !== undefined) return false;
  if (typeof obj.body !== "string" && obj.body !== undefined) return false;
  if (obj.issueTags !== undefined && !Array.isArray(obj.issueTags)) return false;
  if (obj.turnstileToken !== undefined && typeof obj.turnstileToken !== "string") return false;
  if (obj.forkedFromId !== undefined && typeof obj.forkedFromId !== "string") return false;

  return true;
}

export function isFlagBody(data: unknown): data is {
  reason: string;
  details?: string;
} {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.reason !== "string" && obj.reason !== undefined) return false;
  if (obj.details !== undefined && typeof obj.details !== "string") return false;

  return true;
}
