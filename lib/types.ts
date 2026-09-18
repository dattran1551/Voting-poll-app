export type QuestionStatus = 'pending' | 'approved' | 'rejected' | 'answered'

export interface Question {
  id: string
  content: string
  status: QuestionStatus
  likeCount: number
  createdAt: string
}

export interface QueryExecutor {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: T[] }>
}
