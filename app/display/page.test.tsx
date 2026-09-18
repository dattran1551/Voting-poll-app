import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DisplayPage from './page'
import * as useQuestionListModule from '@/lib/useQuestionList'

vi.mock('@/lib/useQuestionList')

describe('DisplayPage', () => {
  it('shows a loading state on first render', () => {
    vi.spyOn(useQuestionListModule, 'useQuestionList').mockReturnValue({ questions: [], state: 'loading' })
    render(<DisplayPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows the empty-state message when there are no approved questions', () => {
    vi.spyOn(useQuestionListModule, 'useQuestionList').mockReturnValue({ questions: [], state: 'ready' })
    render(<DisplayPage />)
    expect(screen.getByText('Chưa có câu hỏi nào / No questions yet')).toBeInTheDocument()
  })

  it('renders the question list without like buttons', () => {
    vi.spyOn(useQuestionListModule, 'useQuestionList').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'approved', likeCount: 2, createdAt: 'now' }],
      state: 'ready',
    })
    render(<DisplayPage />)
    expect(screen.getByText('Q1')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps showing the last list and no error banner when a poll fails', () => {
    vi.spyOn(useQuestionListModule, 'useQuestionList').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'approved', likeCount: 2, createdAt: 'now' }],
      state: 'error',
    })
    render(<DisplayPage />)
    expect(screen.getByText('Q1')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
