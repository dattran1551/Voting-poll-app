import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { QueryExecutor } from '@/lib/types'

const mockDb: QueryExecutor = { query: vi.fn() }
vi.mock('@/lib/db', () => ({ getPool: () => mockDb }))

import * as questions from '@/lib/questions'
import { PATCH } from './route'

const ORIGINAL_TOKEN = process.env.ADMIN_SECRET_TOKEN

beforeEach(() => {
  process.env.ADMIN_SECRET_TOKEN = 'correct-token'
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env.ADMIN_SECRET_TOKEN = ORIGINAL_TOKEN
})

function patchRequest(status: string) {
  return new Request('http://localhost/api/admin/correct-token/questions/q1', {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

describe('PATCH /api/admin/[token]/questions/[id]', () => {
  it('approves a question', async () => {
    vi.spyOn(questions, 'updateQuestionStatus').mockResolvedValue({
      id: 'q1', content: 'Q1', status: 'approved', likeCount: 0, createdAt: '2026-10-07T00:00:00.000Z',
    })

    const response = await PATCH(patchRequest('approved') as never, {
      params: Promise.resolve({ token: 'correct-token', id: 'q1' }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.question.status).toBe('approved')
  })

  it('returns 403 for an invalid token', async () => {
    const response = await PATCH(patchRequest('approved') as never, {
      params: Promise.resolve({ token: 'wrong-token', id: 'q1' }),
    })
    expect(response.status).toBe(403)
  })

  it('rejects an invalid status value', async () => {
    const response = await PATCH(patchRequest('deleted') as never, {
      params: Promise.resolve({ token: 'correct-token', id: 'q1' }),
    })
    expect(response.status).toBe(400)
  })

  it('returns 404 when the question does not exist', async () => {
    vi.spyOn(questions, 'updateQuestionStatus').mockResolvedValue(null)

    const response = await PATCH(patchRequest('approved') as never, {
      params: Promise.resolve({ token: 'correct-token', id: 'missing' }),
    })
    expect(response.status).toBe(404)
  })
})
