import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as relations from "./relations";

export function createDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema: { ...schema, ...relations } });
}

export type Database = ReturnType<typeof createDb>;
