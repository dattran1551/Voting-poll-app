import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { likeQuestion } from '@/lib/likes'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : ''

  if (!deviceId) {
    return NextResponse.json({ error: 'missing_device_id' }, { status: 400 })
  }

  try {
    const result = await likeQuestion(getPool(), id, deviceId)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'question_not_approved') {
      return NextResponse.json({ error: 'question_not_approved' }, { status: 400 })
    }
    throw error
  }
}
