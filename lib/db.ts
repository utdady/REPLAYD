import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (process.env.NODE_ENV === "development" && global._pgPool) {
    return global._pgPool;
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    ssl: process.env.NODE_ENV === "production" 
      ? { rejectUnauthorized: false } // Supabase requires SSL
      : { rejectUnauthorized: false }, // Also in dev for Supabase
  });

  if (process.env.NODE_ENV === "development") {
    global._pgPool = pool;
  }

  return pool;
}

export const pool = getPool();

/** Run a query with named columns only (no SELECT *). */
export async function query<T extends object>(
  text: string,
  values?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, values);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } finally {
    client.release();
  }
}
