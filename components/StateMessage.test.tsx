import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StateMessage } from './StateMessage'

describe('StateMessage', () => {
  it('renders loading text with a loading role', () => {
    render(<StateMessage kind="loading" text="Đang tải... / Loading..." />)
    expect(screen.getByRole('status')).toHaveTextContent('Đang tải... / Loading...')
  })

  it('renders empty state text', () => {
    render(<StateMessage kind="empty" text="Chưa có câu hỏi nào / No questions yet" />)
    expect(screen.getByText('Chưa có câu hỏi nào / No questions yet')).toBeInTheDocument()
  })

  it('renders error state text with an alert role', () => {
    render(<StateMessage kind="error" text="Lỗi / Error" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Lỗi / Error')
  })

  it('defaults to muted text so Admin keeps its existing look unchanged', () => {
    render(<StateMessage kind="loading" text="Đang tải... / Loading..." />)
    expect(screen.getByRole('status').className).toContain('text-white/60')
  })

  it('renders full-brightness text when bright is true (Display/Employee)', () => {
    render(<StateMessage kind="loading" text="Đang tải... / Loading..." bright />)
    const el = screen.getByRole('status')
    expect(el.className).toContain('text-white')
    expect(el.className).not.toContain('text-white/60')
  })

  it('renders full-brightness text for the empty state when bright is true', () => {
    render(<StateMessage kind="empty" text="Chưa có câu hỏi nào / No questions yet" bright />)
    const el = screen.getByText('Chưa có câu hỏi nào / No questions yet')
    expect(el.className).toContain('text-white')
    expect(el.className).not.toContain('text-white/60')
  })
})
