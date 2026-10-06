import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionCard } from './QuestionCard'
import type { Question } from '@/lib/types'

const question: Question = {
  id: '1',
  content: 'Khi nào có bonus?',
  status: 'approved',
  likeCount: 3,
  createdAt: '2026-10-07T00:00:00.000Z',
}

describe('QuestionCard', () => {
  it('shows the content and like count', () => {
    render(<QuestionCard question={question} likable liked={false} onLike={() => {}} />)
    expect(screen.getByText('Khi nào có bonus?')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('calls onLike when the like button is pressed and not yet liked', () => {
    const onLike = vi.fn()
    render(<QuestionCard question={question} likable liked={false} onLike={onLike} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onLike).toHaveBeenCalledOnce()
  })

  it('disables the like button once already liked', () => {
    const onLike = vi.fn()
    render(<QuestionCard question={question} likable liked onLike={onLike} />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onLike).not.toHaveBeenCalled()
  })

  it('renders no like button when likable is false (Display screen)', () => {
    render(<QuestionCard question={question} likable={false} liked={false} onLike={() => {}} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps the default size: 18px on phones, 26px from the sm breakpoint', () => {
    render(<QuestionCard question={question} likable liked={false} onLike={() => {}} />)
    for (const el of [screen.getByText('Khi nào có bonus?'), screen.getByText('3')]) {
      expect(el.className).toContain('text-lg')
      expect(el.className).toContain('sm:text-[26px]')
    }
  })

  it('uses a ~30% smaller 18px size on the stage Display for both text and like count', () => {
    render(<QuestionCard question={question} likable={false} liked={false} onLike={() => {}} variant="stage" />)
    for (const el of [screen.getByText('Khi nào có bonus?'), screen.getByText('3')]) {
      expect(el.className).toContain('text-[18px]')
      expect(el.className).not.toContain('sm:text-[26px]')
    }
  })
})
