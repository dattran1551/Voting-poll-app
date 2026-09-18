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

describe('GET /api/admin/[token]/questions', () => {
  it('returns pending questions for a valid token and status=pending', async () => {
    vi.spyOn(questions, 'getPendingQuestions').mockResolvedValue([
      { id: '1', content: 'Q1', status: 'pending', likeCount: 0, createdAt: '2026-10-07T00:00:00.000Z' },
    ])

    const request = new Request('http://localhost/api/admin/correct-token/questions?status=pending')
    const response = await GET(request as never, { params: Promise.resolve({ token: 'correct-token' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.questions).toHaveLength(1)
  })

  it('returns 403 for an invalid token', async () => {
    const request = new Request('http://localhost/api/admin/wrong-token/questions?status=pending')
    const response = await GET(request as never, { params: Promise.resolve({ token: 'wrong-token' }) })
    expect(response.status).toBe(403)
  })
})
