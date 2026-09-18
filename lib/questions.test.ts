import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPool } from './test-db'
import { createQuestion, getApprovedQuestions, getPendingQuestions, updateQuestionStatus, getAllQuestions } from './questions'
import type { QueryExecutor } from './types'

let db: QueryExecutor

beforeEach(async () => {
  db = await createTestPool()
})

describe('createQuestion', () => {
  it('creates a pending question with zero likes', async () => {
    const question = await createQuestion(db, 'Khi nào có bonus?')
    expect(question.content).toBe('Khi nào có bonus?')
    expect(question.status).toBe('pending')
    expect(question.likeCount).toBe(0)
    expect(question.id).toBeTruthy()
  })
})

describe('getApprovedQuestions', () => {
  it('returns only approved questions, most-liked first, oldest-first on ties', async () => {
    const a = await createQuestion(db, 'Question A')
    const b = await createQuestion(db, 'Question B')
    await createQuestion(db, 'Question C (still pending)')
    await updateQuestionStatus(db, a.id, 'approved')
    await updateQuestionStatus(db, b.id, 'approved')
    await db.query('INSERT INTO likes (question_id, device_id) VALUES ($1, $2)', [b.id, 'device-1'])

    const result = await getApprovedQuestions(db)

    expect(result.map((q) => q.id)).toEqual([b.id, a.id])
    expect(result[0].likeCount).toBe(1)
    expect(result[1].likeCount).toBe(0)
  })

  it('excludes answered questions', async () => {
    const a = await createQuestion(db, 'Question A')
    await updateQuestionStatus(db, a.id, 'approved')
    await updateQuestionStatus(db, a.id, 'answered')

    const result = await getApprovedQuestions(db)

    expect(result).toEqual([])
  })
})

describe('getPendingQuestions', () => {
  it('returns pending questions oldest-first', async () => {
    const a = await createQuestion(db, 'First')
    const b = await createQuestion(db, 'Second')

    const result = await getPendingQuestions(db)

    expect(result.map((q) => q.id)).toEqual([a.id, b.id])
  })
})

describe('updateQuestionStatus', () => {
  it('updates the status and returns the updated question', async () => {
    const a = await createQuestion(db, 'Question A')
    const updated = await updateQuestionStatus(db, a.id, 'rejected')
    expect(updated?.status).toBe('rejected')
  })

  it('returns null for an unknown id', async () => {
    const updated = await updateQuestionStatus(db, 'does-not-exist', 'approved')
    expect(updated).toBeNull()
  })
})

describe('getAllQuestions', () => {
  it('returns every question regardless of status', async () => {
    const a = await createQuestion(db, 'A')
    await updateQuestionStatus(db, a.id, 'rejected')
    await createQuestion(db, 'B')

    const result = await getAllQuestions(db)

    expect(result).toHaveLength(2)
  })
})
