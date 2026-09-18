import type { QueryExecutor } from './types'

export async function likeQuestion(
  db: QueryExecutor,
  questionId: string,
  deviceId: string
): Promise<{ likeCount: number; alreadyLiked: boolean }> {
  const existing = await db.query(
    'SELECT 1 FROM likes WHERE question_id = $1 AND device_id = $2',
    [questionId, deviceId]
  )
  const alreadyLiked = existing.rows.length > 0

  if (!alreadyLiked) {
    await db.query(
      'INSERT INTO likes (question_id, device_id) VALUES ($1, $2)',
      [questionId, deviceId]
    )
  }

  const countResult = await db.query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM likes WHERE question_id = $1',
    [questionId]
  )

  return { likeCount: Number(countResult.rows[0].count), alreadyLiked }
}
