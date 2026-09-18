import { describe, it, expect } from 'vitest'
import { createTestPool } from './test-db'

describe('createTestPool', () => {
  it('creates a pool with the schema already applied', async () => {
    const db = await createTestPool()
    const result = await db.query('SELECT * FROM questions')
    expect(result.rows).toEqual([])
  })
})
