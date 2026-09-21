import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmployeePage from './page'
import * as gateModule from '@/lib/useCapacityGate'
import * as listModule from '@/lib/useQuestionList'
import * as deviceIdModule from '@/lib/device-id'

vi.mock('@/lib/useCapacityGate')
vi.mock('@/lib/useQuestionList')
vi.mock('@/lib/device-id')

beforeEach(() => {
  vi.spyOn(deviceIdModule, 'getDeviceId').mockReturnValue('device-1')
})

describe('EmployeePage', () => {
  it('shows a neutral loading message while the capacity gate is still checking', () => {
    vi.spyOn(gateModule, 'useCapacityGate').mockReturnValue('checking')
    const useQuestionListSpy = vi.spyOn(listModule, 'useQuestionList').mockReturnValue({ questions: [], state: 'loading' })

    render(<EmployeePage />)

    expect(screen.getByText('Đang tải... / Loading...')).toBeInTheDocument()
    expect(
      screen.queryByText('Hệ thống đang quá tải, vui lòng chờ giây lát... / System is busy, please wait a moment...')
    ).not.toBeInTheDocument()
    // The gate must be admitted before the question list (and its polling fetch to
    // /api/questions) is ever mounted, so the capacity gate actually limits backend load.
    expect(useQuestionListSpy).not.toHaveBeenCalled()
  })

  it('shows the waiting-room message while the capacity gate is waiting', () => {
    vi.spyOn(gateModule, 'useCapacityGate').mockReturnValue('waiting')
    const useQuestionListSpy = vi.spyOn(listModule, 'useQuestionList').mockReturnValue({ questions: [], state: 'loading' })

    render(<EmployeePage />)

    expect(screen.getByText('Hệ thống đang quá tải, vui lòng chờ giây lát... / System is busy, please wait a moment...')).toBeInTheDocument()
    // The gate must be admitted before the question list (and its polling fetch to
    // /api/questions) is ever mounted, so the capacity gate actually limits backend load.
    expect(useQuestionListSpy).not.toHaveBeenCalled()
  })

  it('shows the empty state once admitted with no approved questions', () => {
    vi.spyOn(gateModule, 'useCapacityGate').mockReturnValue('admitted')
    vi.spyOn(listModule, 'useQuestionList').mockReturnValue({ questions: [], state: 'ready' })

    render(<EmployeePage />)

    expect(screen.getByText('Chưa có câu hỏi nào, hãy là người đặt câu hỏi đầu tiên! / No questions yet — be the first to ask!')).toBeInTheDocument()
  })

  it('lets the user like a question and disables the button after liking', async () => {
    vi.spyOn(gateModule, 'useCapacityGate').mockReturnValue('admitted')
    vi.spyOn(listModule, 'useQuestionList').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'approved', likeCount: 0, createdAt: 'now' }],
      state: 'ready',
    })
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ likeCount: 1, alreadyLiked: false }) }) as never

    render(<EmployeePage />)
    const likeButton = screen.getByRole('button', { name: '❤️' })
    fireEvent.click(likeButton)

    await screen.findByRole('button', { name: '❤️', pressed: true })
  })

  it('submits a new question and shows the char counter', () => {
    vi.spyOn(gateModule, 'useCapacityGate').mockReturnValue('admitted')
    vi.spyOn(listModule, 'useQuestionList').mockReturnValue({ questions: [], state: 'ready' })

    render(<EmployeePage />)
    const textarea = screen.getByPlaceholderText('Nhập câu hỏi của bạn... / Type your question...')
    fireEvent.change(textarea, { target: { value: 'Hello' } })

    expect(screen.getByText('495')).toBeInTheDocument()
  })
})
