import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandHeader } from './BrandHeader'
import { copy } from '@/lib/copy'

describe('BrandHeader', () => {
  it('shows the VNGGames ON logo and both headline lines', () => {
    render(<BrandHeader />)
    expect(screen.getByAltText(copy.shared.logoAlt)).toBeInTheDocument()
    expect(screen.getByText(copy.shared.headerTitleVi)).toBeInTheDocument()
    expect(screen.getByText(copy.shared.headerTitleEn)).toBeInTheDocument()
  })

  it('places the logo above the headline, and the Vietnamese line above the English line', () => {
    render(<BrandHeader />)
    const logo = screen.getByAltText(copy.shared.logoAlt)
    const vi = screen.getByText(copy.shared.headerTitleVi)
    const en = screen.getByText(copy.shared.headerTitleEn)
    expect(logo.compareDocumentPosition(vi) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(vi.compareDocumentPosition(en) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
