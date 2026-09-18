import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act as rtlAct } from '@testing-library/react'
import AdminPage from './page'
import * as adminHook from '@/lib/useAdminQuestions'

vi.mock('@/lib/useAdminQuestions')

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
})
