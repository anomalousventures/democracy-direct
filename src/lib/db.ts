import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (sql) {
    return sql;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  sql = neon(databaseUrl);
  return sql;
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    const db = getDb();
    await db`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
