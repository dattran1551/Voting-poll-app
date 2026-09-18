import type { QueryExecutor } from './types'

export const CAPACITY_LIMIT = 500
export const ACTIVE_WINDOW_MS = 30_000

export async function countActive(db: QueryExecutor, now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ACTIVE_WINDOW_MS)
  const result = await db.query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM active_devices WHERE last_seen > $1',
    [cutoff]
  )
  return Number(result.rows[0].count)
}

export async function heartbeat(
  db: QueryExecutor,
  deviceId: string,
  now: Date = new Date()
): Promise<{ allowed: boolean }> {
  const cutoff = new Date(now.getTime() - ACTIVE_WINDOW_MS)

  const existing = await db.query(
    'SELECT device_id FROM active_devices WHERE device_id = $1 AND last_seen > $2',
    [deviceId, cutoff]
  )

  if (existing.rows.length > 0) {
    await db.query('UPDATE active_devices SET last_seen = $2 WHERE device_id = $1', [deviceId, now])
    return { allowed: true }
  }

  const activeCount = await countActive(db, now)
  if (activeCount >= CAPACITY_LIMIT) {
    return { allowed: false }
  }

  await db.query(
    `INSERT INTO active_devices (device_id, last_seen) VALUES ($1, $2)
     ON CONFLICT (device_id) DO UPDATE SET last_seen = $2`,
    [deviceId, now]
  )
  return { allowed: true }
}
