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
})
