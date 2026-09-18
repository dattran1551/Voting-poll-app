import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useQuestionList } from './useQuestionList'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useQuestionList', () => {
  it('starts in loading state then becomes ready with fetched questions', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [{ id: '1', content: 'Q', status: 'approved', likeCount: 0, createdAt: 'now' }] }),
    }) as never

    const { result } = renderHook(() => useQuestionList())
    expect(result.current.state).toBe('loading')

    await waitFor(() => expect(result.current.state).toBe('ready'))
    expect(result.current.questions).toHaveLength(1)
  })

  it('polls again after 4 seconds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [] }),
    })
    global.fetch = fetchMock as never

    renderHook(() => useQuestionList())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    await act(async () => {
      vi.advanceTimersByTime(4000)
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('keeps the last known questions and does not surface an error on a failed poll after success', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ questions: [{ id: '1', content: 'Q', status: 'approved', likeCount: 0, createdAt: 'now' }] }) })
      .mockRejectedValueOnce(new Error('network down'))
    global.fetch = fetchMock as never

    const { result } = renderHook(() => useQuestionList())
    await waitFor(() => expect(result.current.state).toBe('ready'))

    await act(async () => {
      vi.advanceTimersByTime(4000)
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    expect(result.current.state).toBe('ready')
    expect(result.current.questions).toHaveLength(1)
  })

  it('surfaces an error state when the very first load fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down')) as never

    const { result } = renderHook(() => useQuestionList())
    await waitFor(() => expect(result.current.state).toBe('error'))
  })
})
