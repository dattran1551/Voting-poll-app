import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { createQuestion, getApprovedQuestions } from '@/lib/questions'

export async function GET() {
  const questions = await getApprovedQuestions(getPool())
  return NextResponse.json({ questions })
}

export async function POST(request: Request) {
  const body = await request.json()
  const content = typeof body.content === 'string' ? body.content.trim() : ''

  if (!content || content.length > 300) {
    return NextResponse.json({ error: 'invalid_content' }, { status: 400 })
  }

  const question = await createQuestion(getPool(), content)
  return NextResponse.json({ question }, { status: 201 })
}
