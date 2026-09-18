import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPool } from './test-db'
import { createQuestion, updateQuestionStatus, getApprovedQuestions } from './questions'
import { likeQuestion } from './likes'
import type { QueryExecutor } from './types'

let db: QueryExecutor

beforeEach(async () => {
  db = await createTestPool()
})

describe('likeQuestion', () => {
  it('increments the like count for a first-time like', async () => {
    const q = await createQuestion(db, 'Question A')
    await updateQuestionStatus(db, q.id, 'approved')

    const result = await likeQuestion(db, q.id, 'device-1')

    expect(result).toEqual({ likeCount: 1, alreadyLiked: false })
  })

  it('is idempotent: liking twice from the same device does not double-count', async () => {
    const q = await createQuestion(db, 'Question A')
    await updateQuestionStatus(db, q.id, 'approved')

    await likeQuestion(db, q.id, 'device-1')
    const result = await likeQuestion(db, q.id, 'device-1')

    expect(result).toEqual({ likeCount: 1, alreadyLiked: true })
    const [approved] = await getApprovedQuestions(db)
    expect(approved.likeCount).toBe(1)
  })

  it('counts likes from different devices separately', async () => {
    const q = await createQuestion(db, 'Question A')
    await updateQuestionStatus(db, q.id, 'approved')

    await likeQuestion(db, q.id, 'device-1')
    const result = await likeQuestion(db, q.id, 'device-2')

    expect(result).toEqual({ likeCount: 2, alreadyLiked: false })
  })
})
