import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { updateQuestionStatus } from '@/lib/questions'
import { isValidAdminToken } from '@/lib/admin-auth'
import type { QuestionStatus } from '@/lib/types'

const VALID_STATUSES: QuestionStatus[] = ['approved', 'rejected', 'answered']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  const { token, id } = await params
  if (!isValidAdminToken(token)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const status = body.status as string

  if (!VALID_STATUSES.includes(status as QuestionStatus)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
  }

  const question = await updateQuestionStatus(getPool(), id, status as QuestionStatus)
  if (!question) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json({ question })
}
