import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAdminQuestions } from './useAdminQuestions'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useAdminQuestions', () => {
  it('loads questions for the given tab', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [{ id: '1', content: 'Q', status: 'pending', likeCount: 0, createdAt: 'now' }] }),
    }) as never

    const { result } = renderHook(() => useAdminQuestions('secret-token', 'pending'))
    await waitFor(() => expect(result.current.state).toBe('ready'))
    expect(result.current.questions).toHaveLength(1)
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/secret-token/questions?status=pending')
  })

  it('act() removes the question from the local list on success', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ questions: [{ id: '1', content: 'Q', status: 'pending', likeCount: 0, createdAt: 'now' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ question: { id: '1', content: 'Q', status: 'approved', likeCount: 0, createdAt: 'now' } }) })

    const { result } = renderHook(() => useAdminQuestions('secret-token', 'pending'))
    await waitFor(() => expect(result.current.questions).toHaveLength(1))

    let success = false
    await act(async () => {
      success = await result.current.act('1', 'approved')
    })

    expect(success).toBe(true)
    expect(result.current.questions).toHaveLength(0)
  })

  it('act() keeps the question in the list and returns false on failure', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ questions: [{ id: '1', content: 'Q', status: 'pending', likeCount: 0, createdAt: 'now' }] }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'not_found' }) })

    const { result } = renderHook(() => useAdminQuestions('secret-token', 'pending'))
    await waitFor(() => expect(result.current.questions).toHaveLength(1))

    let success = true
    await act(async () => {
      success = await result.current.act('1', 'approved')
    })

    expect(success).toBe(false)
    expect(result.current.questions).toHaveLength(1)
  })
})
