import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WifiNotice } from './WifiNotice'

describe('WifiNotice', () => {
  it('shows the bilingual VNG wifi reminder', () => {
    render(<WifiNotice />)
    expect(
      screen.getByText('Vui lòng dùng wifi VNG để truy cập / Please use VNG wifi to access the app')
    ).toBeInTheDocument()
  })

  it('uses the same text size as the English headline line', () => {
    render(<WifiNotice />)
    const el = screen.getByText(/Please use VNG wifi/)
    for (const cls of ['text-sm', 'sm:text-lg', 'lg:text-xl']) expect(el.className).toContain(cls)
  })
})
