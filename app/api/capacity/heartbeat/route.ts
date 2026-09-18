import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { heartbeat } from '@/lib/capacity'

export async function POST(request: Request) {
  const body = await request.json()
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : ''

  if (!deviceId) {
    return NextResponse.json({ error: 'missing_device_id' }, { status: 400 })
  }

  const result = await heartbeat(getPool(), deviceId)
  return NextResponse.json(result)
}
