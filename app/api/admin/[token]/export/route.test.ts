import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { QueryExecutor } from '@/lib/types'

const mockDb: QueryExecutor = { query: vi.fn() }
vi.mock('@/lib/db', () => ({ getPool: () => mockDb }))

import * as questions from '@/lib/questions'
import { GET } from './route'

const ORIGINAL_TOKEN = process.env.ADMIN_SECRET_TOKEN

beforeEach(() => {
  process.env.ADMIN_SECRET_TOKEN = 'correct-token'
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env.ADMIN_SECRET_TOKEN = ORIGINAL_TOKEN
})

describe('GET /api/admin/[token]/export', () => {
  it('returns an xlsx file for a valid token', async () => {
    vi.spyOn(questions, 'getAllQuestions').mockResolvedValue([])

    const response = await GET(new Request('http://localhost/api/admin/correct-token/export') as never, {
      params: Promise.resolve({ token: 'correct-token' }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('spreadsheet')
  })

  it('returns 403 for an invalid token', async () => {
    const response = await GET(new Request('http://localhost/api/admin/wrong/export') as never, {
      params: Promise.resolve({ token: 'wrong' }),
    })
    expect(response.status).toBe(403)
  })
})
