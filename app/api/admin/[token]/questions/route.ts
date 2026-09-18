import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPendingQuestions, getApprovedQuestions } from '@/lib/questions'
import { isValidAdminToken } from '@/lib/admin-auth'

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!isValidAdminToken(token)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status')

  const questions = status === 'approved'
    ? await getApprovedQuestions(getPool())
    : await getPendingQuestions(getPool())

  return NextResponse.json({ questions })
}
