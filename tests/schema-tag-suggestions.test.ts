import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { tagSuggestions } from "../src/db/schema";

describe("Phase 7.6: Tag Suggestions table schema", () => {
  const columns = getTableColumns(tagSuggestions);

  it("should have id as primary key (UUID)", () => {
    expect(columns.id).toBeDefined();
    expect(columns.id.primary).toBe(true);
  });

  it("should have name field", () => {
    expect(columns.name).toBeDefined();
  });

  it("should have suggestedBy foreign key to users", () => {
    expect(columns.suggestedBy).toBeDefined();
  });

  it("should have status field", () => {
    expect(columns.status).toBeDefined();
  });

  it("should have approvedBy foreign key to users", () => {
    expect(columns.approvedBy).toBeDefined();
  });

  it("should have timestamps", () => {
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });
});
