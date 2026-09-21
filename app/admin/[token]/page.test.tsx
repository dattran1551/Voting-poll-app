import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act as rtlAct, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import AdminPage from './page'
import * as adminHook from '@/lib/useAdminQuestions'

vi.mock('@/lib/useAdminQuestions')

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('AdminPage', () => {
  // Note: AdminPage unwraps `params` (a Promise) via React's `use()`. Even a
  // pre-resolved Promise only settles on a microtask, and with no Suspense
  // boundary React only performs that retry render inside an `act()` scope.
  // These tests wrap the initial `render()` in `await rtlAct(async () => ...)`
  // so the retry is flushed before assertions run — this does not change
  // what's being asserted, only how the initial async render is awaited.

  it('shows the pending tab by default with approve/reject buttons', async () => {
    vi.spyOn(adminHook, 'useAdminQuestions').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'pending', likeCount: 0, createdAt: 'now' }],
      state: 'ready',
      act: vi.fn(),
    })

    await rtlAct(async () => {
      render(<AdminPage params={Promise.resolve({ token: 'secret-token' })} />)
    })

    expect(screen.getByText('Q1')).toBeInTheDocument()
    expect(screen.getByText('Duyệt / Approve')).toBeInTheDocument()
    expect(screen.getByText('Không duyệt / Reject')).toBeInTheDocument()
  })

  it('shows the pending-empty message when there are no pending questions', async () => {
    vi.spyOn(adminHook, 'useAdminQuestions').mockReturnValue({ questions: [], state: 'ready', act: vi.fn() })

    await rtlAct(async () => {
      render(<AdminPage params={Promise.resolve({ token: 'secret-token' })} />)
    })

    expect(screen.getByText('Không có câu hỏi mới / No new questions')).toBeInTheDocument()
  })

  it('switches to the approved tab and shows "mark as answered"', async () => {
    vi.spyOn(adminHook, 'useAdminQuestions').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'approved', likeCount: 5, createdAt: 'now' }],
      state: 'ready',
      act: vi.fn(),
    })

    await rtlAct(async () => {
      render(<AdminPage params={Promise.resolve({ token: 'secret-token' })} />)
    })
    fireEvent.click(screen.getByText('Đã duyệt / Approved'))

    expect(screen.getByText('Đánh dấu đã trả lời / Mark as answered')).toBeInTheDocument()
  })

  it('calls act with "approved" when Approve is clicked', async () => {
    const act = vi.fn().mockResolvedValue(true)
    vi.spyOn(adminHook, 'useAdminQuestions').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'pending', likeCount: 0, createdAt: 'now' }],
      state: 'ready',
      act,
    })

    await rtlAct(async () => {
      render(<AdminPage params={Promise.resolve({ token: 'secret-token' })} />)
    })
    fireEvent.click(screen.getByText('Duyệt / Approve'))

    expect(act).toHaveBeenCalledWith('1', 'approved')
  })

  it('shows the load-failure message when state is "error"', async () => {
    vi.spyOn(adminHook, 'useAdminQuestions').mockReturnValue({ questions: [], state: 'error', act: vi.fn() })

    await rtlAct(async () => {
      render(<AdminPage params={Promise.resolve({ token: 'secret-token' })} />)
    })

    expect(screen.getByText('Không tải được câu hỏi, thử lại / Failed to load questions, please retry')).toBeInTheDocument()
  })

  describe('export', () => {
    beforeEach(() => {
      vi.spyOn(adminHook, 'useAdminQuestions').mockReturnValue({
        questions: [{ id: '1', content: 'Q1', status: 'pending', likeCount: 0, createdAt: 'now' }],
        state: 'ready',
        act: vi.fn(),
      })
      vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn().mockReturnValue('blob:mock'), revokeObjectURL: vi.fn() })
    })

    it('fetches the export file from the correct URL when the export button is clicked', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['data']),
      }) as never

      await rtlAct(async () => {
        render(<AdminPage params={Promise.resolve({ token: 'secret-token' })} />)
      })

      await rtlAct(async () => {
        fireEvent.click(screen.getByText('Xuất Excel / Export to Excel'))
      })

      await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/admin/secret-token/export'))
    })

    it('shows an error toast when the export request fails', async () => {
      const toastErrorSpy = vi.spyOn(toast, 'error')
      global.fetch = vi.fn().mockResolvedValue({ ok: false }) as never

      await rtlAct(async () => {
        render(<AdminPage params={Promise.resolve({ token: 'secret-token' })} />)
      })

      await rtlAct(async () => {
        fireEvent.click(screen.getByText('Xuất Excel / Export to Excel'))
      })

      await waitFor(() =>
        expect(toastErrorSpy).toHaveBeenCalledWith('Xuất file thất bại, thử lại / Export failed, please retry')
      )
    })
  })
})
