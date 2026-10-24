'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { haystack, scoreQuery, type Row } from '@/lib/directory/search'

/**
 * The search box on a landing page (2026-10-24). Without JavaScript it is a plain form: it opens the trade's hub
 * searched for the words, already filtered to this page's practice and city, so it always works. With JavaScript it
 * also narrows the list on this page as the reader types (the same matching as the hub's, synonyms included: "VC",
 * "PE", "attorney"), by hiding the rows that do not fit. Enter still searches the whole trade.
 */
export function LandingSearch({
  rows,
  total,
  action,
  practice,
  city,
  listId,
  label,
  hint,
}: {
  /** This page's rows, in the order shown. */
  rows: Pick<Row, 's' | 'n' | 'f' | 'o' | 'c' | 'p'>[]
  /** Everyone on the page's list (all its pages). */
  total: number
  /** The hub's path. */
  action: string
  practice?: string
  city?: string
  /** The rendered list's id. */
  listId: string
  label: string
  hint: string
}) {
  const [q, setQ] = useState('')
  const hay = useMemo(() => rows.map((r) => haystack(r, r.c)), [rows])
  const shown = useMemo(() => {
    if (!q.trim()) return null
    return new Set(rows.filter((_, i) => scoreQuery(q, hay[i]) > 0).map((r) => r.s))
  }, [q, rows, hay])

  const apply = (value: string) => {
    setQ(value)
    const list = document.getElementById(listId)
    if (!list) return
    const fit = value.trim() ? new Set(rows.filter((_, i) => scoreQuery(value, hay[i]) > 0).map((r) => r.s)) : null
    list.querySelectorAll<HTMLElement>('li[data-slug]').forEach((li) => {
      li.hidden = Boolean(fit && !fit.has(li.dataset.slug ?? ''))
    })
  }

  const more = total > rows.length
  return (
    <form action={action} method="get" role="search" className="mt-4 max-w-[640px]">
      <label htmlFor={`${listId}-q`} className="sr-only">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" aria-hidden="true" />
          <input
            id={`${listId}-q`}
            name="q"
            type="search"
            autoComplete="off"
            value={q}
            onChange={(e) => apply(e.target.value)}
            placeholder={hint}
            className="h-11 w-full rounded-sm border border-foreground/30 bg-card pl-9 pr-3 font-ui text-[15px] text-foreground placeholder:text-foreground/45 focus:border-foreground focus:outline-none"
          />
        </div>
        {practice ? <input type="hidden" name="practice" value={practice} /> : null}
        {city ? <input type="hidden" name="city" value={city} /> : null}
        <button type="submit" className="h-11 shrink-0 rounded-sm bg-foreground px-4 font-ui text-[14px] font-semibold text-background hover:bg-foreground/85">
          Search
        </button>
      </div>
      <p className="mt-1.5 min-h-[18px] font-ui text-[12.5px] text-foreground/65" aria-live="polite">
        {shown
          ? `${shown.size} of the ${rows.length} on this page match${more ? '. Press Search for all ' + total.toLocaleString('en-US') : ''}.`
          : `By name, firm or city. ${more ? `Search covers all ${total.toLocaleString('en-US')}.` : ''}`}
      </p>
    </form>
  )
}
