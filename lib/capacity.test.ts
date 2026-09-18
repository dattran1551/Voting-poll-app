import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPool } from './test-db'
import { heartbeat, countActive, CAPACITY_LIMIT } from './capacity'
import type { QueryExecutor } from './types'

let db: QueryExecutor

beforeEach(async () => {
  db = await createTestPool()
})

describe('heartbeat', () => {
  it('allows a new device when under capacity', async () => {
    const result = await heartbeat(db, 'device-1')
    expect(result.allowed).toBe(true)
    expect(await countActive(db)).toBe(1)
  })

  it('keeps an already-active device active on repeat heartbeats', async () => {
    const now = new Date('2026-10-07T10:00:00Z')
    await heartbeat(db, 'device-1', now)
    const later = new Date(now.getTime() + 10_000)
    const result = await heartbeat(db, 'device-1', later)
    expect(result.allowed).toBe(true)
    expect(await countActive(db, later)).toBe(1)
  })

  it('treats a device silent for over 30s as inactive, freeing its slot', async () => {
    const now = new Date('2026-10-07T10:00:00Z')
    await heartbeat(db, 'device-1', now)
    const later = new Date(now.getTime() + 31_000)
    expect(await countActive(db, later)).toBe(0)
  })

  it('rejects a new device once capacity is full', async () => {
    const now = new Date('2026-10-07T10:00:00Z')
    for (let i = 0; i < CAPACITY_LIMIT; i++) {
      await heartbeat(db, `device-${i}`, now)
    }
    const result = await heartbeat(db, 'device-overflow', now)
    expect(result.allowed).toBe(false)
    expect(await countActive(db, now)).toBe(CAPACITY_LIMIT)
  }, 30000)

  it('admits a waiting device once a slot frees up', async () => {
    const now = new Date('2026-10-07T10:00:00Z')
    for (let i = 0; i < CAPACITY_LIMIT; i++) {
      await heartbeat(db, `device-${i}`, now)
    }
    const later = new Date(now.getTime() + 31_000)
    const result = await heartbeat(db, 'device-overflow', later)
    expect(result.allowed).toBe(true)
  }, 30000)
})
