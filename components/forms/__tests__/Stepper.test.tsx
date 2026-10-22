import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SubmitEventForm } from '@/components/events/SubmitEventForm'

/** The step-by-step form, driven as a person would: type, Enter, Back, Edit. Nothing is sent. */

function question() {
  return screen.getAllByRole('heading', { level: 2 })[0].textContent ?? ''
}

beforeEach(() => {
  window.sessionStorage.clear()
  vi.restoreAllMocks()
  // jsdom draws nothing, so it has no scrollIntoView.
  Element.prototype.scrollIntoView = vi.fn()
})

describe('Stepper (on the event form)', () => {
  it('stops on a required step with a message, then moves on with Enter', () => {
    render(<SubmitEventForm />)
    expect(question()).toMatch(/What’s the event called/)
    expect(screen.getByText('1 of 10')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^OK/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/Add the name of the event/)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Private Funds CFO Forum 2027' } })
    fireEvent.submit(input.closest('form')!)
    expect(question()).toMatch(/Where is the date published/)
    expect(screen.getByText('2 of 10')).toBeInTheDocument()
  })

  it('keeps answers on Back, offers Skip on optional steps, and edits from the review', () => {
    render(<SubmitEventForm />)
    const form = () => screen.getAllByRole('heading', { level: 2 })[0].closest('form')!
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Private Funds CFO Forum 2027' } })
    fireEvent.submit(form())
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'example.com/forum' } })
    fireEvent.submit(form())

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('textbox')).toHaveValue('example.com/forum')
    fireEvent.submit(form())

    // Seven optional steps to the review.
    for (let i = 0; i < 7; i++) fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(question()).toMatch(/Here’s your event/)
    expect(screen.getByText('https://example.com/forum')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Edit: What’s the event called?' }))
    expect(screen.getByRole('textbox')).toHaveValue('Private Funds CFO Forum 2027')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'CFO Forum 2027' } })
    expect(screen.getByRole('button', { name: /Back to review/ })).toBeInTheDocument()
    fireEvent.submit(form())
    expect(question()).toMatch(/Here’s your event/)
    expect(screen.getByText('CFO Forum 2027')).toBeInTheDocument()
  })

  it('a choice card answers to its letter and moves on', async () => {
    vi.useFakeTimers()
    render(<SubmitEventForm />)
    const form = () => screen.getAllByRole('heading', { level: 2 })[0].closest('form')!
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Private Funds CFO Forum 2027' } })
    fireEvent.submit(form())
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'https://example.com/forum' } })
    fireEvent.submit(form())
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(question()).toMatch(/in person or online/)
    ;(document.activeElement as HTMLElement | null)?.blur()
    fireEvent.keyDown(document, { key: 'b' })
    expect(screen.getByRole('radio', { name: /Hybrid/ })).toHaveAttribute('aria-checked', 'true')
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(question()).toMatch(/What kind of event/)
    vi.useRealTimers()
  })

  it('keeps the draft in sessionStorage', () => {
    render(<SubmitEventForm />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Draft Event Name' } })
    expect(JSON.parse(window.sessionStorage.getItem('fohq:submit-event:v1') ?? '{}').name).toBe('Draft Event Name')
  })

  it('Enter in a field that is not the screen’s last moves to the next field', () => {
    window.sessionStorage.setItem('fohq:submit-event:v1:pos', JSON.stringify({ index: 3 }))
    render(<SubmitEventForm />)
    const org = screen.getByLabelText('Organizer')
    org.focus()
    fireEvent.keyDown(org, { key: 'Enter' })
    expect(document.activeElement).toBe(screen.getByLabelText('City'))
    expect(question()).toMatch(/hosting it/)
  })
})
