import { describe, it, expect } from 'vitest'
import { GET } from './route'

describe('GET /api/qr', () => {
  it('returns a PNG image for a given url', async () => {
    const request = new Request('http://localhost/api/qr?url=' + encodeURIComponent('https://example.com/employee'))
    const response = await GET(request as never)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    const buffer = Buffer.from(await response.arrayBuffer())
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('returns 400 when url is missing', async () => {
    const request = new Request('http://localhost/api/qr')
    const response = await GET(request as never)
    expect(response.status).toBe(400)
  })
})
