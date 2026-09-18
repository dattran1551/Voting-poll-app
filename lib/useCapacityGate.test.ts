import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCapacityGate } from './useCapacityGate'

vi.mock('./device-id', () => ({ getDeviceId: () => 'device-1' }))

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useCapacityGate', () => {
  it('starts checking, then becomes admitted when the server allows it', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ allowed: true }) }) as never

    const { result } = renderHook(() => useCapacityGate())
    expect(result.current).toBe('checking')

    await waitFor(() => expect(result.current).toBe('admitted'))
  })

  it('moves to waiting when the server is at capacity, then admitted once a slot frees', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ allowed: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ allowed: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ allowed: true }) })
    global.fetch = fetchMock as never

    const { result } = renderHook(() => useCapacityGate())
    await waitFor(() => expect(result.current).toBe('waiting'))

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(result.current).toBe('waiting')

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    await waitFor(() => expect(result.current).toBe('admitted'))
  })

  it('keeps sending heartbeats every 15s once admitted', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ allowed: true }) })
    global.fetch = fetchMock as never

    renderHook(() => useCapacityGate())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    await act(async () => {
      vi.advanceTimersByTime(15000)
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })
})
