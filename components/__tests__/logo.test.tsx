import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Logo } from '../logo'

describe('Logo', () => {
  it('should render correctly', () => {
    render(<Logo />)
    const svg = screen.getByLabelText('FundOpsHQ')
    expect(svg).toBeInTheDocument()
  })

  it('should render with default dimensions', () => {
    render(<Logo />)
    const svg = screen.getByLabelText('FundOpsHQ')
    expect(svg).toHaveAttribute('height', '28')
    // Width = height * (279/46) = 28 * 6.065 = ~170
    expect(svg).toHaveAttribute('width', '170')
  })

  it('should render with custom height and calculate width proportionally', () => {
    render(<Logo height={46} />)
    const svg = screen.getByLabelText('FundOpsHQ')
    expect(svg).toHaveAttribute('height', '46')
    expect(svg).toHaveAttribute('width', '279')
  })

  it('should apply custom className', () => {
    render(<Logo className="custom-class" />)
    const svg = screen.getByLabelText('FundOpsHQ')
    expect(svg).toHaveClass('custom-class')
  })
})
