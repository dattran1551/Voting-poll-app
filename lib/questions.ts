import { randomUUID } from 'node:crypto'
import type { QueryExecutor, Question, QuestionStatus } from './types'

interface QuestionRow {
  id: string
  content: string
  status: QuestionStatus
  created_at: string
  like_count: string | number
}

function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    content: row.content,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    likeCount: Number(row.like_count),
  }
}

export async function createQuestion(db: QueryExecutor, content: string): Promise<Question> {
  const id = randomUUID()
  const result = await db.query<QuestionRow>(
    `INSERT INTO questions (id, content, status)
     VALUES ($1, $2, 'pending')
     RETURNING id, content, status, created_at, 0 AS like_count`,
    [id, content]
  )
  return toQuestion(result.rows[0])
}

const SELECT_WITH_LIKES = `
  SELECT q.id, q.content, q.status, q.created_at, COUNT(l.device_id)::int AS like_count
  FROM questions q
  LEFT JOIN likes l ON l.question_id = q.id
`

export async function getApprovedQuestions(db: QueryExecutor): Promise<Question[]> {
  const result = await db.query<QuestionRow>(
    `${SELECT_WITH_LIKES}
     WHERE q.status = 'approved'
     GROUP BY q.id
     ORDER BY like_count DESC, q.created_at ASC`
  )
  return result.rows.map(toQuestion)
}

export async function getPendingQuestions(db: QueryExecutor): Promise<Question[]> {
  const result = await db.query<QuestionRow>(
    `${SELECT_WITH_LIKES}
     WHERE q.status = 'pending'
     GROUP BY q.id
     ORDER BY q.created_at ASC`
  )
  return result.rows.map(toQuestion)
}

export async function getAllQuestions(db: QueryExecutor): Promise<Question[]> {
  const result = await db.query<QuestionRow>(
    `${SELECT_WITH_LIKES}
     GROUP BY q.id
     ORDER BY q.created_at ASC`
  )
  return result.rows.map(toQuestion)
}

export async function updateQuestionStatus(
  db: QueryExecutor,
  id: string,
  status: QuestionStatus
): Promise<Question | null> {
  const result = await db.query<{ id: string }>(
    `UPDATE questions SET status = $2 WHERE id = $1 RETURNING id`,
    [id, status]
  )
  if (result.rows.length === 0) {
    return null
  }
  const withLikes = await db.query<QuestionRow>(
    `${SELECT_WITH_LIKES} WHERE q.id = $1 GROUP BY q.id, q.content, q.status, q.created_at`,
    [id]
  )
  return toQuestion(withLikes.rows[0])
}
