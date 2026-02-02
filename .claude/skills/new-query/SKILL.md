---
name: new-query
description: Scaffold a new database query module with integration tests
disable-model-invocation: true
---

# New Query Module

Create a new database query module following project patterns.

## Usage

`/new-query <name>`

## What Gets Created

1. `src/db/queries/<name>.ts` - Query functions
2. `src/db/queries/<name>.integration.test.ts` - Integration tests

## Pattern to Follow

Query modules in this project:

- Export async functions that take `db: Database` as first param
- Return typed results using Drizzle schema types
- Use `.$type<T>()` on columns to share types with Zod schemas

## Example Structure

```typescript
// src/db/queries/example.ts
import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { someTable, type SomeType } from "../schema";

export async function getById(db: Database, id: string): Promise<SomeType | null> {
  const results = await db.select().from(someTable).where(eq(someTable.id, id)).limit(1);
  return results[0] ?? null;
}
```

## Integration Test Pattern

```typescript
// src/db/queries/example.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { createDb, type Database } from "@/db/client";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for integration tests");
}

describe("example queries (integration)", () => {
  let db: Database;

  beforeAll(async () => {
    db = createDb(DATABASE_URL!);
    // Insert test data
  });

  afterAll(async () => {
    // Clean up test data
  });

  // Tests...
});
```

## Existing Modules for Reference

- `src/db/queries/legislators.ts` - Simple lookups
- `src/db/queries/votes.ts` - Complex joins and aggregations
- `src/db/queries/zip-districts.ts` - Ordered results
