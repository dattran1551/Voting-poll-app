import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandHeader } from './BrandHeader'
import { copy } from '@/lib/copy'

describe('BrandHeader', () => {
  it('shows the VNGGames ON logo and the bilingual heading', () => {
    render(<BrandHeader />)
    expect(screen.getByAltText(copy.shared.logoAlt)).toBeInTheDocument()
    expect(screen.getByText(copy.shared.headerTitle)).toBeInTheDocument()
  })

  it('places the logo in the DOM before the heading (left-to-right reading order)', () => {
    render(<BrandHeader />)
    const logo = screen.getByAltText(copy.shared.logoAlt)
    const heading = screen.getByText(copy.shared.headerTitle)
    expect(logo.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
