'use client'

import { useId, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { finderMeta, matchFinder, peopleSearches, type FinderEntry } from '@/lib/directory/finder-match'

/**
 * The one box on /directory (2026-10-24, design pass): a name, a firm, a strategy or a city, across every trade.
 *
 * Without JavaScript it is a plain form: /directory?q=… answers on the server with the same matching. With it, the
 * suggestions open as the reader types (and, empty, on focus: the popular searches, Airbnb's pattern), grouped as
 * pages, firms and rankings, with a last row per trade that searches people by name (Zocdoc's "search for 'smith'
 * among doctors"). An ARIA 1.2 combobox: arrows move, Enter opens, Escape closes; the list is announced with its count.
 */

type Option = { id: string; label: string; meta: string; href: string; people?: boolean }

export function DirectoryFinder({
  entries,
  popular,
  trades,
  initial = '',
}: {
  entries: FinderEntry[]
  popular: { title: string; path: string; count: number }[]
  trades: { plural: string; slug: string }[]
  initial?: string
}) {
  const router = useRouter()
  const uid = useId()
  const listId = `${uid}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState(initial)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const options: Option[] = useMemo(() => {
    const v = q.trim()
    if (!v) return popular.slice(0, 6).map((p, i) => ({ id: `${uid}-p${i}`, label: p.title, meta: `${p.count.toLocaleString('en-US')} listed`, href: p.path }))
    const hits = matchFinder(entries, v, 7).map((e, i) => ({ id: `${uid}-m${i}`, label: e.t, meta: finderMeta(e), href: e.h }))
    // A name ("Smith") finds no page: the hubs' people search answers it. A page match needs no such rows.
    const people = (hits.length >= 4 ? [] : peopleSearches(trades, v)).map((s, i) => ({ id: `${uid}-s${i}`, label: s.label, meta: 'People, by name', href: s.href, people: true }))
    return [...hits, ...people]
  }, [q, entries, popular, trades, uid])

  const hitCount = q.trim() ? options.filter((o) => !o.people).length : options.length
  const expanded = open && options.length > 0

  const go = (o: Option) => {
    setOpen(false)
    router.push(o.href)
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a + 1) % Math.max(options.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1))
    } else if (e.key === 'Enter' && expanded && active >= 0 && options[active]) {
      e.preventDefault()
      go(options[active])
    } else if (e.key === 'Escape') {
      if (expanded) {
        e.preventDefault()
        setOpen(false)
        setActive(-1)
      } else if (q) {
        setQ('')
      }
    }
  }

  return (
    <form action="/directory" method="get" role="search" aria-label="Search the directory" className="relative" onSubmit={() => setOpen(false)}>
      <label htmlFor={`${uid}-q`} className="block font-ui text-[14px] font-semibold text-foreground">
        Find fund lawyers, auditors and tax partners by name, firm, strategy or city
      </label>
      <div className="mt-2 flex items-stretch gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/55" aria-hidden="true" />
          <input
            ref={inputRef}
            id={`${uid}-q`}
            name="q"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-activedescendant={expanded && active >= 0 && options[active] ? options[active].id : undefined}
            aria-describedby={`${uid}-status`}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            maxLength={80}
            value={q}
            placeholder="e.g. hedge funds, Kirkland, Boston"
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
              setActive(-1)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKey}
            className="h-14 w-full rounded-[3px] border-2 border-foreground/80 bg-card pl-12 pr-3 font-ui text-[16px] text-foreground shadow-[0_1px_0_rgba(0,0,0,0.04)] placeholder:text-foreground/50 focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold,#e2b13c)] focus-visible:ring-offset-1 sm:text-[17px]"
          />
        </div>
        <button
          type="submit"
          className="h-14 shrink-0 rounded-[3px] bg-foreground px-5 font-ui text-[15px] font-semibold text-background hover:bg-foreground/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:px-7"
        >
          Search
        </button>
      </div>
      <p id={`${uid}-status`} className="sr-only" aria-live="polite">
        {expanded ? (q.trim() ? `${hitCount} pages and firms match. Use the arrow keys to choose.` : `${options.length} popular searches. Use the arrow keys to choose.`) : ''}
      </p>
      <ul
        id={listId}
        role="listbox"
        aria-label={q.trim() ? 'Suggestions' : 'Popular searches'}
        hidden={!expanded}
        className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[min(70vh,460px)] overflow-y-auto rounded-[3px] border border-foreground/25 bg-card py-1 shadow-[0_10px_30px_-12px_rgba(20,30,50,0.35)]"
      >
        {!q.trim() && (
          <li role="presentation" className="px-4 pb-1 pt-2 font-ui text-[12px] font-semibold text-foreground/60">
            Popular searches
          </li>
        )}
        {options.map((o, i) => {
          const firstPeople = o.people && !options[i - 1]?.people
          return (
            <li
              key={o.id}
              id={o.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(o)}
              className={`flex cursor-pointer items-baseline justify-between gap-4 px-4 py-2.5 ${firstPeople && i > 0 ? 'mt-1 border-t border-border' : ''} ${i === active ? 'bg-foreground/10 shadow-[inset_3px_0_0_currentColor]' : ''}`}
            >
              <span className={`min-w-0 font-news text-[16px] leading-snug text-foreground ${o.people ? 'italic text-foreground/85' : ''}`}>{o.label}</span>
              <span className="shrink-0 font-ui text-[12px] tabular-nums text-foreground/60">{o.meta}</span>
            </li>
          )
        })}
      </ul>
    </form>
  )
}
