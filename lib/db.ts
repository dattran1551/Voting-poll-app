import { Pool } from 'pg'
import type { QueryExecutor } from './types'

let pool: QueryExecutor | undefined

export function getPool(): QueryExecutor {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required')
    }
    pool = new Pool({ connectionString })
  }
  return pool
}
