import { eq, and, desc, sql, or, ilike, inArray } from "drizzle-orm";
import type { Database } from "../client";
import { templates, templateIssueTags, issueTags } from "../schema";

export interface TemplateWithTags {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string;
  viewCount: number;
  useCount: number;
  createdAt: Date;
  tags: string[];
}

export interface SearchTemplatesOptions {
  limit?: number;
  cursor?: string;
  search?: string;
  tags?: string[];
}

export interface PaginatedTemplatesResult {
  items: TemplateWithTags[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface CursorData {
  score: number;
  createdAt: Date;
  id: string;
}

export function encodeCursor(score: number, createdAt: Date, id: string): string {
  const raw = `${score}:${createdAt.toISOString()}:${id}`;
  const base64 = btoa(raw);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCursor(cursor: string): CursorData | null {
  try {
    let base64 = cursor.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad !== 0) {
      base64 = base64 + "=".repeat(4 - pad);
    }
    const decoded = atob(base64);
    const firstColonIdx = decoded.indexOf(":");
    if (firstColonIdx === -1) return null;

    const scoreStr = decoded.slice(0, firstColonIdx);
    const rest = decoded.slice(firstColonIdx + 1);

    const lastColonIdx = rest.lastIndexOf(":");
    if (lastColonIdx === -1) return null;

    const dateStr = rest.slice(0, lastColonIdx);
    const id = rest.slice(lastColonIdx + 1);

    const score = parseInt(scoreStr, 10);
    const createdAt = new Date(dateStr);

    if (isNaN(score) || isNaN(createdAt.getTime()) || !id) {
      return null;
    }

    return { score, createdAt, id };
  } catch {
    return null;
  }
}

export async function searchTemplatesWithCursor(
  db: Database,
  options: SearchTemplatesOptions = {}
): Promise<PaginatedTemplatesResult> {
  const { limit = 20, cursor, search, tags } = options;
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const cursorData = cursor ? decodeCursor(cursor) : null;

  const scoreExpr = sql<number>`(${templates.viewCount} + ${templates.useCount})`;

  const baseConditions = [eq(templates.isPublic, true), eq(templates.moderationStatus, "approved")];

  if (cursorData) {
    const cursorCondition = sql`(
      ${scoreExpr} < ${cursorData.score}
      OR (${scoreExpr} = ${cursorData.score} AND ${templates.createdAt} < ${cursorData.createdAt})
      OR (${scoreExpr} = ${cursorData.score} AND ${templates.createdAt} = ${cursorData.createdAt} AND ${templates.id} < ${cursorData.id})
    )`;
    baseConditions.push(cursorCondition);
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    baseConditions.push(
      or(ilike(templates.title, searchTerm), ilike(templates.description, searchTerm))!
    );
  }

  let templateIds: string[] | null = null;
  if (tags && tags.length > 0) {
    const lowerTags = tags.map((t) => t.toLowerCase());
    const tagResults = await db
      .selectDistinct({ templateId: templateIssueTags.templateId })
      .from(templateIssueTags)
      .innerJoin(issueTags, eq(templateIssueTags.issueTagId, issueTags.id))
      .where(
        and(inArray(sql`LOWER(${issueTags.name})`, lowerTags), eq(issueTags.status, "approved"))
      );

    templateIds = tagResults.map((r) => r.templateId);
    if (templateIds.length === 0) {
      return { items: [], nextCursor: null, hasMore: false };
    }
    baseConditions.push(inArray(templates.id, templateIds));
  }

  const results = await db
    .select({
      id: templates.id,
      slug: templates.slug,
      title: templates.title,
      description: templates.description,
      body: templates.body,
      viewCount: templates.viewCount,
      useCount: templates.useCount,
      createdAt: templates.createdAt,
      score: scoreExpr,
    })
    .from(templates)
    .where(and(...baseConditions))
    .orderBy(desc(scoreExpr), desc(templates.createdAt), desc(templates.id))
    .limit(safeLimit + 1);

  const hasMore = results.length > safeLimit;
  const items = results.slice(0, safeLimit);

  const templateIdsForTags = items.map((t) => t.id);
  const tagsForTemplates =
    templateIdsForTags.length > 0
      ? await db
          .select({
            templateId: templateIssueTags.templateId,
            tagName: issueTags.name,
          })
          .from(templateIssueTags)
          .innerJoin(issueTags, eq(templateIssueTags.issueTagId, issueTags.id))
          .where(
            and(
              inArray(templateIssueTags.templateId, templateIdsForTags),
              eq(issueTags.status, "approved")
            )
          )
      : [];

  const tagsByTemplateId = new Map<string, string[]>();
  for (const row of tagsForTemplates) {
    const existing = tagsByTemplateId.get(row.templateId) || [];
    existing.push(row.tagName);
    tagsByTemplateId.set(row.templateId, existing);
  }

  const templatesWithTags: TemplateWithTags[] = items.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    description: t.description,
    body: t.body,
    viewCount: t.viewCount,
    useCount: t.useCount,
    createdAt: t.createdAt,
    tags: tagsByTemplateId.get(t.id) || [],
  }));

  let nextCursor: string | null = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = encodeCursor(lastItem.score, lastItem.createdAt, lastItem.id);
  }

  return {
    items: templatesWithTags,
    nextCursor,
    hasMore,
  };
}

export async function getApprovedTagNames(db: Database): Promise<string[]> {
  const results = await db
    .selectDistinct({ name: issueTags.name })
    .from(issueTags)
    .innerJoin(templateIssueTags, eq(issueTags.id, templateIssueTags.issueTagId))
    .innerJoin(templates, eq(templateIssueTags.templateId, templates.id))
    .where(
      and(
        eq(issueTags.status, "approved"),
        eq(templates.isPublic, true),
        eq(templates.moderationStatus, "approved")
      )
    )
    .orderBy(issueTags.name);

  return results.map((r) => r.name);
}

export async function linkTemplateTags(
  db: Database,
  templateId: string,
  tagNames: string[]
): Promise<void> {
  if (tagNames.length === 0) return;

  const lowerTagNames = tagNames.map((t) => t.toLowerCase());

  const matchingTags = await db
    .select({ id: issueTags.id, name: issueTags.name })
    .from(issueTags)
    .where(inArray(sql`LOWER(${issueTags.name})`, lowerTagNames));

  if (matchingTags.length === 0) return;

  const values = matchingTags.map((tag) => ({
    templateId,
    issueTagId: tag.id,
  }));

  await db.insert(templateIssueTags).values(values).onConflictDoNothing();
}

export async function unlinkAllTemplateTags(db: Database, templateId: string): Promise<void> {
  await db.delete(templateIssueTags).where(eq(templateIssueTags.templateId, templateId));
}

export async function syncTemplateTags(
  db: Database,
  templateId: string,
  tagNames: string[]
): Promise<void> {
  await unlinkAllTemplateTags(db, templateId);
  await linkTemplateTags(db, templateId, tagNames);
}
