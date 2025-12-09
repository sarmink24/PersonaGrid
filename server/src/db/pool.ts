import { Pool, type QueryResultRow } from 'pg';
import { env } from '../config/env.js';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) =>
  pool.query<T>(text, params);

