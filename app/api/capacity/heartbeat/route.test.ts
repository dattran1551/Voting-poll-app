import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryExecutor } from '@/lib/types'

const mockDb: QueryExecutor = { query: vi.fn() }
vi.mock('@/lib/db', () => ({ getPool: () => mockDb }))

import * as capacity from '@/lib/capacity'
import { POST } from './route'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/capacity/heartbeat', () => {
  it('returns allowed=true when under capacity', async () => {
    vi.spyOn(capacity, 'heartbeat').mockResolvedValue({ allowed: true })

    const request = new Request('http://localhost/api/capacity/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'device-1' }),
    })
    const response = await POST(request as never)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ allowed: true })
  })

  it('returns allowed=false when at capacity', async () => {
    vi.spyOn(capacity, 'heartbeat').mockResolvedValue({ allowed: false })

    const request = new Request('http://localhost/api/capacity/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'device-501' }),
    })
    const response = await POST(request as never)

    expect(await response.json()).toEqual({ allowed: false })
  })

  it('rejects a request with no deviceId', async () => {
    const request = new Request('http://localhost/api/capacity/heartbeat', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request as never)
    expect(response.status).toBe(400)
  })
})
