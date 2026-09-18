import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'missing_url' }, { status: 400 })
  }

  const buffer = await QRCode.toBuffer(url, { width: 400 })
  return new NextResponse(buffer, {
    status: 200,
    headers: { 'Content-Type': 'image/png' },
  })
}
