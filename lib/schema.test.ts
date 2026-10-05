import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { newDb } from 'pg-mem'
import { SCHEMA_SQL, withSchema } from './schema'
import type { QueryExecutor } from './types'

function createEmptyPool(): QueryExecutor {
  const { Pool } = newDb().adapters.createPg()
  return new Pool() as unknown as QueryExecutor
}

describe('SCHEMA_SQL', () => {
  it('stays identical to schema.sql so manual setups and the app agree', () => {
    const file = readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf-8')
    expect(SCHEMA_SQL.trim()).toBe(file.trim())
  })
})

describe('withSchema', () => {
  it('creates the tables before the first query on an empty database', async () => {
    const db = withSchema(createEmptyPool())
    const result = await db.query('SELECT * FROM questions')
    expect(result.rows).toEqual([])
  })

  it('runs the schema only once across many queries', async () => {
    const inner: QueryExecutor = { query: vi.fn().mockResolvedValue({ rows: [] }) }
    const db = withSchema(inner)

    await Promise.all([db.query('SELECT 1'), db.query('SELECT 2')])
    await db.query('SELECT 3')

    const schemaCalls = vi.mocked(inner.query).mock.calls.filter(([text]) => text === SCHEMA_SQL)
    expect(schemaCalls).toHaveLength(1)
  })

  it('retries the schema on the next query if the first attempt failed', async () => {
    const query = vi
      .fn()
      .mockRejectedValueOnce(new Error('database not ready'))
      .mockResolvedValue({ rows: [] })
    const db = withSchema({ query })

    await expect(db.query('SELECT 1')).rejects.toThrow('database not ready')
    await expect(db.query('SELECT 1')).resolves.toEqual({ rows: [] })

    const schemaCalls = query.mock.calls.filter(([text]) => text === SCHEMA_SQL)
    expect(schemaCalls).toHaveLength(2)
  })
})
