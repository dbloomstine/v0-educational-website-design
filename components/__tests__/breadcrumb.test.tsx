import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumb } from '../breadcrumb'

describe('Breadcrumb', () => {
  it('should render home link', () => {
    render(<Breadcrumb items={[]} />)
    // The link contains the "Home" text in a sr-only span
    const homeText = screen.getByText('Home')
    expect(homeText).toBeInTheDocument()
    // Find the link that contains the home icon and text
    const homeLink = homeText.closest('a')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('should render breadcrumb items with links', () => {
    const items = [
      { label: 'Funds', href: '/funds' },
      { label: 'Private Equity', href: '/funds/private-equity' },
    ]
    render(<Breadcrumb items={items} />)

    const fundsLink = screen.getByRole('link', { name: 'Funds' })
    expect(fundsLink).toBeInTheDocument()
    expect(fundsLink).toHaveAttribute('href', '/funds')

    const peLink = screen.getByRole('link', { name: 'Private Equity' })
    expect(peLink).toBeInTheDocument()
    expect(peLink).toHaveAttribute('href', '/funds/private-equity')
  })

  it('should render last item without link when href is not provided', () => {
    const items = [
      { label: 'Funds', href: '/funds' },
      { label: 'CFO' },
    ]
    render(<Breadcrumb items={items} />)

    const fundsLink = screen.getByRole('link', { name: 'Funds' })
    expect(fundsLink).toBeInTheDocument()

    const cfoText = screen.getByText('CFO')
    expect(cfoText).toBeInTheDocument()
    expect(cfoText).toHaveAttribute('aria-current', 'page')
    expect(cfoText.tagName).toBe('SPAN')
  })

  it('should have proper navigation aria-label', () => {
    render(<Breadcrumb items={[{ label: 'Test' }]} />)
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav).toBeInTheDocument()
  })
})
