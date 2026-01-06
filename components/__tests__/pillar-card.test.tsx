import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PillarCard } from '../pillar-card'

describe('PillarCard', () => {
  const defaultProps = {
    title: 'CFO & Finance',
    description: 'Financial oversight and fund accounting responsibilities',
    articleCount: 5,
    href: '/funds/private-equity/cfo',
    color: '#3b82f6',
  }

  it('should render with title and description', () => {
    render(<PillarCard {...defaultProps} />)

    expect(screen.getByText('CFO & Finance')).toBeInTheDocument()
    expect(screen.getByText('Financial oversight and fund accounting responsibilities')).toBeInTheDocument()
  })

  it('should render as a link with correct href', () => {
    render(<PillarCard {...defaultProps} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/funds/private-equity/cfo')
  })

  it('should render the color indicator with correct background color', () => {
    const { container } = render(<PillarCard {...defaultProps} />)

    const colorIndicator = container.querySelector('[style*="background-color"]')
    expect(colorIndicator).toBeInTheDocument()
    expect(colorIndicator).toHaveStyle({ backgroundColor: '#3b82f6' })
  })

  it('should render with different props', () => {
    const customProps = {
      title: 'Compliance',
      description: 'Regulatory compliance and reporting requirements',
      articleCount: 3,
      href: '/funds/hedge-funds/compliance',
      color: '#10b981',
    }
    render(<PillarCard {...customProps} />)

    expect(screen.getByText('Compliance')).toBeInTheDocument()
    expect(screen.getByText('Regulatory compliance and reporting requirements')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/funds/hedge-funds/compliance')
  })
})
