import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryExecutor } from '@/lib/types'

const mockDb: QueryExecutor = { query: vi.fn() }
vi.mock('@/lib/db', () => ({ getPool: () => mockDb }))

import * as questions from '@/lib/questions'
import { GET, POST } from './route'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('GET /api/questions', () => {
  it('returns approved questions from the data layer', async () => {
    vi.spyOn(questions, 'getApprovedQuestions').mockResolvedValue([
      { id: '1', content: 'Q1', status: 'approved', likeCount: 3, createdAt: '2026-10-07T00:00:00.000Z' },
    ])

    const response = await GET()
    const body = await response.json()

    expect(body.questions).toHaveLength(1)
    expect(body.questions[0].content).toBe('Q1')
  })
})

describe('POST /api/questions', () => {
  it('creates a question when content is valid', async () => {
    vi.spyOn(questions, 'createQuestion').mockResolvedValue({
      id: '1', content: 'Hello', status: 'pending', likeCount: 0, createdAt: '2026-10-07T00:00:00.000Z',
    })

    const request = new Request('http://localhost/api/questions', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello' }),
    })
    const response = await POST(request as never)

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.question.content).toBe('Hello')
  })

  it('rejects empty content', async () => {
    const request = new Request('http://localhost/api/questions', {
      method: 'POST',
      body: JSON.stringify({ content: '   ' }),
    })
    const response = await POST(request as never)
    expect(response.status).toBe(400)
  })

  it('rejects content over 500 characters', async () => {
    const request = new Request('http://localhost/api/questions', {
      method: 'POST',
      body: JSON.stringify({ content: 'a'.repeat(501) }),
    })
    const response = await POST(request as never)
    expect(response.status).toBe(400)
  })
})
