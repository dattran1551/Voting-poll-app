import { newDb } from 'pg-mem'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { QueryExecutor } from './types'

export async function createTestPool(): Promise<QueryExecutor> {
  const db = newDb()
  const { Pool } = db.adapters.createPg()
  const pool = new Pool() as unknown as QueryExecutor
  const schema = readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf-8')
  await pool.query(schema)
  return pool
}
