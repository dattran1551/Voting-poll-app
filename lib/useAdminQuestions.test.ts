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

  it('sets state to "error" when the first load fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as never

    const { result } = renderHook(() => useAdminQuestions('secret-token', 'pending'))
    await waitFor(() => expect(result.current.state).toBe('error'))
    expect(result.current.questions).toHaveLength(0)
  })

  it('keeps state "ready" and the existing questions when a later refresh fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ questions: [{ id: '1', content: 'Q', status: 'pending', likeCount: 0, createdAt: 'now' }] }) })
      .mockResolvedValue({ ok: false, json: async () => ({}) })

    const { result } = renderHook(() => useAdminQuestions('secret-token', 'pending'))
    await waitFor(() => expect(result.current.state).toBe('ready'))
    expect(result.current.questions).toHaveLength(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000)
    })

    expect(result.current.state).toBe('ready')
    expect(result.current.questions).toHaveLength(1)
    vi.useRealTimers()
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
