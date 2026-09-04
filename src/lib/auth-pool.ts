import { Pool } from "pg";
import { requireIsolatedAuthDatabase } from "./auth-database";

let pool: Pool | null = null;

export function getAuthPool(): Pool {
  if (!pool) {
    const databaseUrl = requireIsolatedAuthDatabase(process.env.DATABASE_URL);
    pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 8000,
      max: 10,
    });
  }
  return pool;
}
