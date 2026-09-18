import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getAllQuestions } from '@/lib/questions'
import { isValidAdminToken } from '@/lib/admin-auth'
import { buildQuestionsWorkbook } from '@/lib/export'

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!isValidAdminToken(token)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const questions = await getAllQuestions(getPool())
  const buffer = await buildQuestionsWorkbook(questions)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="audience-qa-export.xlsx"',
    },
  })
}
