/**
 * The Lead Desk grid at the size it has actually reached.
 *
 * On 2026-10-05 the desk held 3,477 leads and drew every one: about 62,000
 * table cells, all redrawn on each checkbox tick and each letter typed. These
 * tests pin the fix — draw a window, but filter, count, search and select
 * over everything — and the two ways it could quietly lose work: a bulk
 * "mark done" that only reaches the rows on screen, and a notes box that
 * opens blank and is saved over real notes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import type { DeskListRow } from '@/lib/crm/queries'

const router = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

import DeskGrid from '../DeskGrid'

function lead(i: number, over: Partial<DeskListRow> = {}): DeskListRow {
  const n = String(i).padStart(4, '0')
  return {
    id: `id-${n}`, lead_ref: `L-${n}`, work_state: 'done', priority: 'B', share_ok: 'yes',
    target_raise: null, date_received: null, status: 'active', blocker: null, lead_type: 'fund_manager',
    service_line: 'fund_admin',
    // newest first, the order the server sends
    created_at: new Date(Date.UTC(2026, 9, 5) - i * 60_000).toISOString(),
    firm_id: `firm-${n}`, firm_name: `Firm ${n} Capital`, domain: `firm${n}.com`, firm_type: 'pe',
    strategy: 'buyout', firm_location: 'Austin, TX', person_location: 'Austin, TX',
    full_name: `Person ${n}`, title: 'CFO', role_class: 'cfo', email: `p${n}@firm${n}.com`,
    email_type: 'direct_work', email_confidence: 'verified', phone: null, linkedin: null,
    linkedin_verified: false, hold_note: null, source_name: null, source_org: null, source_type: null,
    touch_count: 1, email_subject: `Person (Firm ${n}) <> IQ-EQ`, email_body: 'Body', draft_note: null,
    provisional: false, origin: 'Form ADV', origin_note: null,
    ...over,
  }
}

/** 450 leads: the 87 newest still to do, the rest done. */
function desk(): DeskListRow[] {
  return Array.from({ length: 450 }, (_, i) => lead(i, i < 87 ? { work_state: 'to_do' } : {}))
}

const bodyRows = () => document.querySelectorAll('tbody tr').length

// Buttons are found by their text straight from the DOM. Testing Library's
// role queries work out the accessible name of every element on the page,
// which takes seconds on a table this size.
function button(name: string | RegExp): HTMLButtonElement {
  const hit = [...document.querySelectorAll('button')].filter(b => {
    const t = (b.textContent ?? '').trim()
    return typeof name === 'string' ? t === name : name.test(t)
  })
  if (hit.length !== 1) throw new Error(`expected one button matching ${name}, found ${hit.length}`)
  return hit[0] as HTMLButtonElement
}
const hasButton = (name: RegExp) =>
  [...document.querySelectorAll('button')].some(b => name.test((b.textContent ?? '').trim()))
const chip = (label: string) => button(new RegExp(`^${label}\\d+$`))

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  router.refresh.mockClear()
  // The saved column layout lives in localStorage; start every test from the default layout.
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} })
  fetchMock = vi.fn(async (url: string) => {
    if (url.startsWith('/api/desk/work-state')) return new Response(JSON.stringify({ ok: true }), { status: 200 })
    if (url.startsWith('/api/desk/contact-log')) return new Response(JSON.stringify({ entries: [] }), { status: 200 })
    if (url.startsWith('/api/desk/lead')) {
      return new Response(JSON.stringify({ detail: {
        id: 'id-0000', notes: 'call after the close', firm_notes: null,
        research_summary: 'Austin buyout shop', share_ok_reason: null, firm_country: 'US',
      } }), { status: 200 })
    }
    if (url.startsWith('/api/desk/notes')) return new Response(JSON.stringify({ ok: true }), { status: 200 })
    return new Response('{}', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
})

describe('Lead Desk grid — drawing', () => {
  it('draws the first 200 rows, not every lead', () => {
    render(<DeskGrid rows={desk()} />)
    expect(bodyRows()).toBe(200)
    expect(screen.getByText(/showing 200 of 450 matching/)).toBeInTheDocument()
  })

  it('still counts every lead on the filter chips and in the header', () => {
    render(<DeskGrid rows={desk()} />)
    expect(chip('All')).toHaveTextContent('All450')
    expect(chip('To do')).toHaveTextContent('To do87')
    expect(chip('Done')).toHaveTextContent('Done363')
  })

  it('"show more" adds a page and "show all" draws the rest', () => {
    render(<DeskGrid rows={desk()} />)
    fireEvent.click(button('Show 200 more'))
    expect(bodyRows()).toBe(400)
    fireEvent.click(button('Show 50 more'))
    expect(bodyRows()).toBe(450)
    expect(hasButton(/^Show .* more$/)).toBe(false)
  })

  it('offers "show all" in one step', () => {
    render(<DeskGrid rows={desk()} />)
    fireEvent.click(button('Show all 450'))
    expect(bodyRows()).toBe(450)
  })

  it('goes back to the first page when the filter changes', () => {
    render(<DeskGrid rows={desk()} />)
    fireEvent.click(button('Show all 450'))
    fireEvent.click(chip('Done'))
    expect(bodyRows()).toBe(200)
    expect(screen.getByText(/showing 200 of 363 matching/)).toBeInTheDocument()
  })

  it('shows no "more" bar when everything fits', () => {
    render(<DeskGrid rows={desk()} />)
    fireEvent.click(chip('To do'))
    expect(bodyRows()).toBe(87)
    expect(screen.queryByText(/Showing the first/)).not.toBeInTheDocument()
  })
})

describe('Lead Desk grid — search and selection reach rows that are not drawn', () => {
  it('finds a lead far below the first page', async () => {
    render(<DeskGrid rows={desk()} />)
    expect(screen.queryByText('Person 0431')).not.toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Search anything…'), { target: { value: 'firm 0431 cap' } })
    expect(await screen.findByText('Person 0431')).toBeInTheDocument()
    await waitFor(() => expect(bodyRows()).toBe(1))
  })

  it('select-all takes every matching row and says how many are off screen', () => {
    render(<DeskGrid rows={desk()} />)
    fireEvent.click(screen.getByTitle('Select all 450 matching rows'))
    const note = screen.getByText(/250 of them further down, not drawn yet/)
    expect(note.parentElement).toHaveTextContent(/^450selected/)
  })

  it('bulk "mark done" sends every selected lead, drawn or not', async () => {
    const rows = Array.from({ length: 450 }, (_, i) => lead(i, { work_state: 'to_do' }))
    render(<DeskGrid rows={rows} />)
    fireEvent.click(screen.getByTitle('Select all 450 matching rows'))
    fireEvent.click(button('Mark done'))
    await waitFor(() => expect(chip('Done')).toHaveTextContent('Done450'))
    const call = fetchMock.mock.calls.find(c => String(c[0]).startsWith('/api/desk/work-state'))!
    expect(JSON.parse(call[1].body).ids).toHaveLength(450)
  })
})

describe('Lead Desk grid — marking done does not reload the desk', () => {
  it('updates the row and the counts in place', async () => {
    render(<DeskGrid rows={desk()} />)
    fireEvent.click(screen.getAllByTitle('Mark done')[0])
    await waitFor(() => expect(chip('To do')).toHaveTextContent('To do86'))
    expect(chip('Done')).toHaveTextContent('Done364')
    expect(router.refresh).not.toHaveBeenCalled()
    const call = fetchMock.mock.calls.find(c => String(c[0]).startsWith('/api/desk/work-state'))!
    expect(JSON.parse(call[1].body)).toMatchObject({ ids: ['id-0000'], workState: 'done', logAs: 'researched' })
  })

  it('leaves the row alone when the server refuses', async () => {
    fetchMock.mockImplementationOnce(async () => new Response(JSON.stringify({ error: 'Update failed' }), { status: 500 }))
    render(<DeskGrid rows={desk()} />)
    fireEvent.click(screen.getAllByTitle('Mark done')[0])
    expect(await screen.findByText('Update failed')).toBeInTheDocument()
    expect(chip('To do')).toHaveTextContent('To do87')
  })

  it('reloads from the CRM only when asked', () => {
    render(<DeskGrid rows={desk()} />)
    fireEvent.click(button('Refresh'))
    expect(router.refresh).toHaveBeenCalledTimes(1)
  })
})

describe('Lead Desk drawer — notes load when a row is opened', () => {
  it('fetches the notes and research for the lead that was opened', async () => {
    render(<DeskGrid rows={desk()} />)
    fireEvent.click(screen.getByText('Person 0000'))
    expect(await screen.findByDisplayValue('call after the close')).toBeInTheDocument()
    expect(screen.getByText('Austin buyout shop')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(c => c[0] === '/api/desk/lead?id=id-0000')).toBe(true)
  })

  it('offers no notes box when the load fails, so blank text cannot be saved over real notes', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.startsWith('/api/desk/lead')
        ? new Response(JSON.stringify({ error: 'Query failed' }), { status: 500 })
        : new Response(JSON.stringify({ entries: [] }), { status: 200 }))
    render(<DeskGrid rows={desk()} />)
    fireEvent.click(screen.getByText('Person 0000'))
    expect(await screen.findByText(/Could not load the notes and research/)).toBeInTheDocument()
    expect(hasButton(/^Save notes$/)).toBe(false)
    expect(screen.queryByPlaceholderText(/Angle, timing/)).not.toBeInTheDocument()
  })

  it('saves edited notes without reloading the desk', async () => {
    render(<DeskGrid rows={desk()} />)
    fireEvent.click(screen.getByText('Person 0000'))
    const box = await screen.findByDisplayValue('call after the close')
    fireEvent.change(box, { target: { value: 'call in November' } })
    const drawer = box.closest('aside')!
    fireEvent.click(within(drawer).getByText('Save notes'))
    expect(await within(drawer).findByText(/^saved /)).toBeInTheDocument()
    const call = fetchMock.mock.calls.find(c => String(c[0]).startsWith('/api/desk/notes'))!
    expect(JSON.parse(call[1].body)).toEqual({ leadId: 'id-0000', notes: 'call in November', firmNotes: '' })
    expect(router.refresh).not.toHaveBeenCalled()
  })
})
