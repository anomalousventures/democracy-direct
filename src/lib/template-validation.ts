export interface TemplateValidationError {
  field: string;
  message: string;
}

export interface TemplateInput {
  title: string;
  description?: string;
  body: string;
  issueTags?: string[];
}

export const TITLE_MIN_LENGTH = 5;
export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 200;
export const BODY_MIN_LENGTH = 50;
export const BODY_MAX_LENGTH = 10000;

const ALL_CAPS_PATTERN = /^[A-Z\s\d!?.,]+$/;
const SPAM_PATTERNS = [
  /\b(buy now|click here|act now|limited time|free money)\b/i,
  /(.)\1{5,}/,
  /\$\$\$/,
];

export function validateTemplateTitle(title: string): TemplateValidationError[] {
  const errors: TemplateValidationError[] = [];
  const trimmed = title.trim();

  if (!trimmed) {
    errors.push({ field: "title", message: "Title is required" });
    return errors;
  }

  if (trimmed.length < TITLE_MIN_LENGTH) {
    errors.push({
      field: "title",
      message: `Title must be at least ${TITLE_MIN_LENGTH} characters`,
    });
  }

  if (trimmed.length > TITLE_MAX_LENGTH) {
    errors.push({
      field: "title",
      message: `Title must be at most ${TITLE_MAX_LENGTH} characters`,
    });
  }

  if (trimmed.length >= TITLE_MIN_LENGTH && ALL_CAPS_PATTERN.test(trimmed)) {
    errors.push({
      field: "title",
      message: "Title cannot be all caps",
    });
  }

  return errors;
}

export function validateTemplateDescription(
  description: string | undefined
): TemplateValidationError[] {
  const errors: TemplateValidationError[] = [];

  if (!description) {
    return errors;
  }

  const trimmed = description.trim();

  if (!trimmed) {
    return errors;
  }

  if (trimmed.length > DESCRIPTION_MAX_LENGTH) {
    errors.push({
      field: "description",
      message: `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
    });
  }

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      errors.push({
        field: "description",
        message: "Description contains content that looks like spam",
      });
      break;
    }
  }

  return errors;
}

export function validateTemplateBody(body: string): TemplateValidationError[] {
  const errors: TemplateValidationError[] = [];
  const trimmed = body.trim();

  if (!trimmed) {
    errors.push({ field: "body", message: "Body is required" });
    return errors;
  }

  if (trimmed.length < BODY_MIN_LENGTH) {
    errors.push({
      field: "body",
      message: `Body must be at least ${BODY_MIN_LENGTH} characters`,
    });
  }

  if (trimmed.length > BODY_MAX_LENGTH) {
    errors.push({
      field: "body",
      message: `Body must be at most ${BODY_MAX_LENGTH} characters`,
    });
  }

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      errors.push({
        field: "body",
        message: "Body contains content that looks like spam",
      });
      break;
    }
  }

  return errors;
}

export function validateTemplate(input: TemplateInput): TemplateValidationError[] {
  const errors: TemplateValidationError[] = [];

  errors.push(...validateTemplateTitle(input.title));
  errors.push(...validateTemplateDescription(input.description));
  errors.push(...validateTemplateBody(input.body));

  return errors;
}

export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  return tags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);
}

export function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);

  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-${timestamp}${randomSuffix}`;
}
