import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryExecutor } from '@/lib/types'

const mockDb: QueryExecutor = { query: vi.fn() }
vi.mock('@/lib/db', () => ({ getPool: () => mockDb }))

import * as likes from '@/lib/likes'
import { POST } from './route'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/questions/[id]/like', () => {
  it('likes the question for the given device', async () => {
    vi.spyOn(likes, 'likeQuestion').mockResolvedValue({ likeCount: 4, alreadyLiked: false })

    const request = new Request('http://localhost/api/questions/q1/like', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'device-1' }),
    })
    const response = await POST(request as never, { params: Promise.resolve({ id: 'q1' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ likeCount: 4, alreadyLiked: false })
    expect(likes.likeQuestion).toHaveBeenCalledWith(mockDb, 'q1', 'device-1')
  })

  it('rejects a request with no deviceId', async () => {
    const request = new Request('http://localhost/api/questions/q1/like', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request as never, { params: Promise.resolve({ id: 'q1' }) })
    expect(response.status).toBe(400)
  })
})
