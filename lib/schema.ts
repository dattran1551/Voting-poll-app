import type { QueryExecutor } from './types'

// Kept as a string (not read from schema.sql at runtime) because serverless bundles
// don't ship arbitrary repo files. schema.test.ts guards that the two never drift.
export const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, device_id)
);

CREATE TABLE IF NOT EXISTS active_devices (
  device_id TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
`

export function withSchema(db: QueryExecutor): QueryExecutor {
  let ready: Promise<unknown> | undefined

  return {
    async query<T = Record<string, unknown>>(text: string, params?: unknown[]) {
      ready ??= db.query(SCHEMA_SQL).catch((error) => {
        ready = undefined
        throw error
      })
      await ready
      return db.query<T>(text, params)
    },
  }
}
