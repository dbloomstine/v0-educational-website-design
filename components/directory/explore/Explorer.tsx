'use client'

import { memo, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { BadgeCheck, Columns3, Rows3, Search, SlidersHorizontal, X } from 'lucide-react'
import { FirmMark } from '@/components/directory/FirmMark'
import type { RowFirm } from '@/lib/directory/search'
import { practiceLabel } from '@/lib/directory/taxonomy'
import {
  FACETS,
  dayLabel,
  emptyQuery,
  exploreCounts,
  exploreHref,
  facetLabel,
  fieldsPresent,
  filterCount,
  firstDir,
  liveFacets,
  runExplore,
  toggleValue,
  xHaystack,
  yearsIn,
  type FacetKey,
  type FacetValue,
  type SortCol,
  type XQuery,
  type XRow,
} from '@/lib/directory/explore'
import { decodeExplore, type ExploreIndex } from '@/lib/directory/explore-index'
import { PersonPanel } from './PersonPanel'
import { FacetRail } from './FacetRail'
import { useModal } from './use-modal'
import css from './explore.module.css'

/**
 * A trade's people as a table you can work (2026-10-24, Danny: "like the Lead Desk… a table and a list of names and
 * filter by all sorts of different data fields… click on someone and get more details and reach out").
 *
 *   - Lead Desk (app/desk/DeskGrid.tsx): dense rows, sticky header and first column, a column picker and a row that
 *     opens a side panel; the panel follows the arrow keys.
 *   - Faceted search as Zocdoc and LinkedIn Sales Navigator do it: every facet a list of tick-boxes with what each
 *     choice would leave, any of a facet's choices, all of the facets.
 *   - Set like a newspaper's market-data table (explore.module.css).
 *
 * The server renders the first rows for the address's own query (a reader without JavaScript gets a working table and
 * a form); the browser fetches the whole trade's compact index (lib/directory/explore-index.ts) at once and answers
 * every change itself. Rows are virtualised: only what is on screen is drawn. The address follows the view.
 */

export interface ExplorerProps {
  trade: { slug: string; plural: string; singular: string; credentialLabel: string }
  /** /fund-lawyers/explore, and the hub's /fund-lawyers. */
  path: string
  hub: string
  firms: Record<string, RowFirm>
  indexUrl: string
  year: number
  initial: XQuery
  /** The person whose panel the address opens (?p=slug). */
  initialOpen: string | null
  first: { items: XRow[]; total: number; all: number; counts: Record<FacetKey, FacetValue[]>; present: ReturnType<typeof fieldsPresent> }
}

type ColKey = 'firm' | 'title' | 'office' | 'practice' | 'primary' | 'exp' | 'focus' | 'side' | 'school' | 'prior' | 'lang' | 'verified'

interface Col {
  key: ColKey
  label: string
  w: number
  sort?: SortCol
  /** The field it needs: a column with nothing in it is never offered. */
  need?: keyof ReturnType<typeof fieldsPresent>
  on: boolean
  cell: (r: XRow, ctx: Ctx) => ReactNode
  /** The cell as plain words (its tooltip, and what a screen reader hears). */
  text: (r: XRow, ctx: Ctx) => string
}

interface Ctx {
  firms: Record<string, RowFirm>
  year: number
}

const n = (x: number) => x.toLocaleString('en-US')
const dash = <span className={css.dash} aria-label="none">–</span>
const list = (xs: string[], max = 2) => (xs.length ? `${xs.slice(0, max).join(', ')}${xs.length > max ? ` +${xs.length - max}` : ''}` : '')

const COLS: Col[] = [
  {
    key: 'firm',
    label: 'Firm',
    w: 230,
    sort: 'firm',
    on: true,
    text: (r) => r.f,
    cell: (r, { firms }) => {
      const f = firms[r.d]
      return (
        <span className="flex min-w-0 items-center gap-2">
          {f ? <FirmMark name={f.name} logo={f.logo} mono={f.mono} size="xs" decorative /> : null}
          <span className="truncate">{r.f}</span>
        </span>
      )
    },
  },
  { key: 'title', label: 'Title', w: 190, sort: 'title', on: true, text: (r) => r.t ?? '', cell: (r) => (r.t ? r.t : dash) },
  {
    key: 'office',
    label: 'Office',
    w: 170,
    sort: 'office',
    on: true,
    text: (r) => `${r.o ?? ''}${r.om ? ` + ${r.om} more` : ''}`,
    cell: (r) =>
      r.o ? (
        <>
          {r.o}
          {r.om > 0 && <span className={css.soft}> +{r.om}</span>}
        </>
      ) : (
        dash
      ),
  },
  {
    key: 'practice',
    label: 'Practices',
    w: 250,
    sort: 'practice',
    need: 'p',
    on: true,
    text: (r) => r.p.map(practiceLabel).join(', '),
    cell: (r) => (r.p.length ? list(r.p.map(practiceLabel)) : dash),
  },
  { key: 'primary', label: 'Primary practice', w: 170, need: 'pp', on: true, text: (r) => (r.pp ? practiceLabel(r.pp) : ''), cell: (r) => (r.pp ? <span className={css.primaryTag}>{practiceLabel(r.pp)}</span> : dash) },
  {
    key: 'exp',
    label: 'Experience',
    w: 108,
    sort: 'exp',
    need: 'y',
    on: true,
    text: (r, { year }) => {
      const y = yearsIn(r.y, year)
      return y === null ? '' : `${y} years`
    },
    cell: (r, { year }) => {
      const y = yearsIn(r.y, year)
      return y === null ? dash : <span>{y} yrs</span>
    },
  },
  { key: 'school', label: 'Schools', w: 210, sort: 'school', need: 'sc', on: true, text: (r) => r.sc.join(', '), cell: (r) => (r.sc.length ? list(r.sc) : dash) },
  { key: 'prior', label: 'Prior firms', w: 200, need: 'pf', on: true, text: (r) => r.pf.join(', '), cell: (r) => (r.pf.length ? list(r.pf) : dash) },
  {
    key: 'focus',
    label: 'Client focus',
    w: 190,
    need: 'cf',
    on: false,
    text: (r) => r.cf.map((x) => facetLabel('focus', x)).join(', '),
    cell: (r) => (r.cf.length ? list(r.cf.map((x) => facetLabel('focus', x))) : dash),
  },
  {
    key: 'side',
    label: 'Represents',
    w: 170,
    need: 'rp',
    on: false,
    text: (r) => r.rp.map((x) => facetLabel('side', x)).join(', '),
    cell: (r) => (r.rp.length ? list(r.rp.map((x) => facetLabel('side', x))) : dash),
  },
  { key: 'lang', label: 'Languages', w: 150, need: 'lg', on: false, text: (r) => r.lg.join(', '), cell: (r) => (r.lg.length ? list(r.lg) : dash) },
  {
    key: 'verified',
    label: 'Verified',
    w: 104,
    sort: 'verified',
    need: 'v',
    on: false,
    text: (r, { year }) => (r.v === null ? '' : `Last verified ${dayLabel(r.v, year)}`),
    cell: (r, { year }) => (r.v === null ? dash : <span className={css.soft}>{dayLabel(r.v, year)}</span>),
  },
]

const NAME_W = { wide: 230, narrow: 150 }
const ROW_H = { compact: 36, comfy: 46 }
type Density = keyof typeof ROW_H
const OVERSCAN = 12
const COLS_KEY = 'dir-explore-cols-v1'
const DENSITY_KEY = 'dir-explore-density-v1'

const read = (k: string): string | null => {
  try {
    return window.localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string) => {
  try {
    window.localStorage.setItem(k, v)
  } catch {
    /* private window: the choice lasts the visit */
  }
}

export function Explorer(props: ExplorerProps) {
  const { trade, path, hub, firms, year } = props
  const [query, setQuery] = useState<XQuery>(props.initial)
  const [text, setText] = useState(props.initial.q)
  const typed = useDeferredValue(text)
  const live: XQuery = useMemo(() => ({ ...query, q: typed.trim() }), [query, typed])

  // ── The index ──
  const [rows, setRows] = useState<XRow[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let gone = false
    fetch(props.indexUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((ix: ExploreIndex) => !gone && setRows(decodeExplore(ix, (d) => firms[d]?.name ?? d)))
      .catch(() => !gone && setFailed(true))
    return () => {
      gone = true
    }
  }, [props.indexUrl, firms])

  const hay = useMemo(() => (rows ? rows.map(xHaystack) : undefined), [rows])
  const shown = useMemo(() => (rows ? runExplore(rows, live, year, hay) : null), [rows, live, year, hay])
  const counts = useMemo(() => (rows ? exploreCounts(rows, live, year, hay) : props.first.counts), [rows, live, year, hay, props.first.counts])
  const allCounts = useMemo(() => (rows ? exploreCounts(rows, emptyQuery(), year, hay) : props.first.counts), [rows, year, hay, props.first.counts])
  const present = useMemo(() => (rows ? fieldsPresent(rows) : props.first.present), [rows, props.first.present])
  const facets = useMemo(() => liveFacets(allCounts, live), [allCounts, live])
  const items = shown ?? props.first.items
  const total = shown ? shown.length : props.first.total
  const everyone = rows ? rows.length : props.first.all
  const pending = !rows && !failed && exploreHref(path, live) !== exploreHref(path, props.initial)

  // ── Columns and density (kept in this browser) ──
  const [colOn, setColOn] = useState<Record<ColKey, boolean>>(() => Object.fromEntries(COLS.map((c) => [c.key, c.on])) as Record<ColKey, boolean>)
  const [density, setDensity] = useState<Density>('compact')
  useEffect(() => {
    try {
      const saved = JSON.parse(read(COLS_KEY) ?? 'null') as Record<string, boolean> | null
      if (saved && typeof saved === 'object') setColOn((c) => ({ ...c, ...Object.fromEntries(Object.entries(saved).filter(([k, v]) => k in c && typeof v === 'boolean')) }))
    } catch {
      /* ignore a bad saved layout */
    }
    const d = read(DENSITY_KEY)
    if (d === 'compact' || d === 'comfy') setDensity(d)
  }, [])
  const offered = COLS.filter((c) => !c.need || present[c.need])
  const visible = offered.filter((c) => colOn[c.key])
  const setCol = (k: ColKey, on: boolean) =>
    setColOn((c) => {
      const next = { ...c, [k]: on }
      write(COLS_KEY, JSON.stringify(next))
      return next
    })
  const pickDensity = (d: Density) => {
    setDensity(d)
    write(DENSITY_KEY, d)
  }

  // ── The panel ──
  const [open, setOpen] = useState<string | null>(props.initialOpen)
  const openRow = useMemo(() => (open ? (rows ?? props.first.items).find((r) => r.s === open) ?? null : null), [open, rows, props.first.items])

  // ── The address follows the view (no history entry per keystroke). ──
  const firstSync = useRef(true)
  useEffect(() => {
    if (firstSync.current) {
      firstSync.current = false
      return
    }
    const base = exploreHref(path, live)
    const url = open ? `${base}${base.includes('?') ? '&' : '?'}p=${encodeURIComponent(open)}` : base
    window.history.replaceState(window.history.state, '', url)
  }, [path, live, open])

  // ── Changing the query ──
  const scroller = useRef<HTMLDivElement>(null)
  const update = useCallback((next: XQuery) => {
    setQuery(next)
    setActive(0)
    if (scroller.current) scroller.current.scrollTop = 0
  }, [])
  const toggle = (k: FacetKey, v: string) => update(toggleValue({ ...query, q: text }, k, v))
  const clearFacet = (k: FacetKey) => {
    const f = { ...query.f }
    delete f[k]
    update({ ...query, f })
  }
  const clearAll = () => {
    setText('')
    update({ ...emptyQuery(), sort: query.sort, dir: query.dir })
  }
  const sortBy = (col: SortCol) => update({ ...query, sort: col, dir: query.sort === col ? (query.dir === 1 ? -1 : 1) : firstDir(col) })

  // ── Virtual rows ──
  const rowH = ROW_H[density]
  const [view, setView] = useState({ top: 0, height: 800 })
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => setView({ top: el.scrollTop, height: el.clientHeight || 800 })
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    el.addEventListener('scroll', measure, { passive: true })
    return () => {
      ro?.disconnect()
      el.removeEventListener('scroll', measure)
    }
  }, [])
  const HEAD = 35
  const virtual = Boolean(shown)
  const start = virtual ? Math.max(0, Math.floor((view.top - HEAD) / rowH) - OVERSCAN) : 0
  const end = virtual ? Math.min(items.length, Math.ceil((view.top + view.height) / rowH) + OVERSCAN) : items.length
  const slice = items.slice(start, end)

  // ── Keyboard: the arrow keys move through the rows; Enter opens; Escape closes. ──
  const [active, setActive] = useState(0)
  const pendingFocus = useRef<number | null>(null)
  const focusRow = useCallback(
    (i: number) => {
      const el = scroller.current
      if (!el) return
      const top = HEAD + i * rowH
      if (top < el.scrollTop + HEAD) el.scrollTop = top - HEAD
      else if (top + rowH > el.scrollTop + el.clientHeight) el.scrollTop = top + rowH - el.clientHeight
      // Draw the window at the new position now (the scroll event comes later), then focus the row once it is drawn.
      setView({ top: el.scrollTop, height: el.clientHeight || 800 })
      pendingFocus.current = i
    },
    [rowH],
  )
  useEffect(() => {
    const i = pendingFocus.current
    if (i === null) return
    const tr = scroller.current?.querySelector(`tr[data-i="${i}"]`) as HTMLElement | null
    if (tr) {
      pendingFocus.current = null
      tr.focus({ preventScroll: true })
    }
  })
  const onKey = (e: React.KeyboardEvent) => {
    if (!items.length) return
    // The row that has focus is where a move starts from (a click may have put it elsewhere).
    const at = (e.target as HTMLElement).tagName === 'TR' ? Number((e.target as HTMLElement).dataset.i ?? active) : active
    const page = Math.max(1, Math.floor((view.height - HEAD) / rowH) - 1)
    const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: page, PageUp: -page, j: 1, k: -1 }
    let next: number | null = null
    if (e.key in moves && !e.altKey && !e.metaKey && !e.ctrlKey) next = Math.min(items.length - 1, Math.max(0, at + moves[e.key]))
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement).tagName === 'TR') {
      e.preventDefault()
      setActive(at)
      setOpen(items[at]?.s ?? null)
      return
    }
    if (next === null) return
    e.preventDefault()
    setActive(next)
    focusRow(next)
    // With the panel open, it follows the row (as the Lead Desk's drawer does).
    if (open) setOpen(items[next].s)
  }
  const openAt = (i: number) => {
    setActive(i)
    setOpen(items[i].s)
  }
  const closePanel = useCallback(() => {
    const slug = open
    setOpen(null)
    // Focus goes back to the row it came from.
    setTimeout(() => {
      const el = scroller.current?.querySelector(`tr[data-slug="${slug}"]`) as HTMLElement | null
      ;(el ?? scroller.current)?.focus({ preventScroll: true })
    })
  }, [open])

  // ── Menus ──
  const [colsOpen, setColsOpen] = useState(false)
  const [sheet, setSheet] = useState(false)
  const activeChips = FACETS.flatMap(({ key }) => (live.f[key] ?? []).map((v) => ({ key, v, label: facetLabel(key, v, (d) => firms[d]?.name) })))
  const nameW = useNarrow() ? NAME_W.narrow : NAME_W.wide
  const ctx: Ctx = { firms, year }
  const sortState = (c?: SortCol): 'ascending' | 'descending' | undefined => (c && live.sort === c ? (live.dir === 1 ? 'ascending' : 'descending') : !live.sort && c === 'name' && !live.q ? 'ascending' : undefined)

  const rail = (
    <FacetRail
      facets={facets}
      counts={counts}
      query={live}
      firmName={(d) => firms[d]?.name}
      onToggle={toggle}
      onClear={clearFacet}
      onPracticeMode={(pm) => update({ ...query, pm })}
      hasPrimary={present.pp}
      loading={!rows && !failed}
    />
  )

  return (
    <div className={`${css.frame} ${density === 'comfy' ? css.comfy : ''}`} style={{ ['--row-h' as string]: `${rowH}px` }}>
      {/* The toolbar: search, the count, what is on, and the table's own controls. */}
      <form
        action={path}
        method="get"
        role="search"
        aria-label={`Search and filter ${trade.plural.toLowerCase()}`}
        id="xp-form"
        onSubmit={(e) => {
          if (!failed) e.preventDefault()
        }}
        className="shrink-0 pb-2"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative min-w-0 flex-1 basis-[150px]">
            <label htmlFor="xp-q" className="mb-1 block font-ui text-[12px] font-semibold text-foreground/75">
              Name, firm, city, school or practice
            </label>
            <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-foreground/55" aria-hidden="true" />
            <input
              id="xp-q"
              type="search"
              name="q"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setActive(0)
                if (scroller.current) scroller.current.scrollTop = 0
              }}
              placeholder="e.g. venture, Kirkland, Boston, Harvard"
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full rounded-[3px] border border-foreground/30 bg-card pl-9 pr-2.5 font-ui text-[16px] text-foreground focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:text-[14px]"
            />
          </div>
          <button
            type="button"
            onClick={() => setSheet(true)}
            aria-haspopup="dialog"
            className="inline-flex h-10 items-center gap-1.5 rounded-[3px] border border-foreground/30 bg-card px-3 font-ui text-[13.5px] font-semibold text-foreground hover:border-foreground lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters{filterCount(live) ? ` (${filterCount(live)})` : ''}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setColsOpen((o) => !o)}
              aria-expanded={colsOpen}
              aria-controls="xp-cols"
              className="inline-flex h-10 items-center gap-1.5 rounded-[3px] border border-foreground/30 bg-card px-3 font-ui text-[13.5px] font-semibold text-foreground hover:border-foreground"
            >
              <Columns3 className="h-4 w-4" aria-hidden="true" />
              <span className="max-sm:sr-only">Columns</span>
            </button>
            {colsOpen && (
              <ColumnMenu
                cols={offered}
                on={colOn}
                onSet={setCol}
                density={density}
                onDensity={pickDensity}
                onClose={() => setColsOpen(false)}
              />
            )}
          </div>
          <noscript>
            <button type="submit" className="h-10 rounded-[3px] bg-foreground px-4 font-ui text-[13px] font-bold text-background">
              Search
            </button>
          </noscript>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="font-ui text-[13px] text-foreground" role="status" aria-live="polite">
            {pending ? 'Loading everyone…' : <><b className="font-semibold">{n(total)}</b> of {n(everyone)} {trade.plural.toLowerCase()}</>}
          </p>
          {activeChips.length > 0 && (
            <ul className="flex flex-wrap items-center gap-1.5" aria-label="Filters in use">
              {activeChips.map((c) => (
                <li key={`${c.key}:${c.v}`}>
                  <button
                    type="button"
                    onClick={() => toggle(c.key, c.v)}
                    className="inline-flex min-h-[28px] items-center gap-1 rounded-full border border-foreground/30 bg-card py-0.5 pl-2.5 pr-2 font-ui text-[12.5px] text-foreground hover:border-foreground"
                  >
                    {c.key === 'practice' && live.pm === 'primary' ? `Primary: ${c.label}` : c.label}
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">(remove this filter)</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {(activeChips.length > 0 || text.trim()) && (
            <button type="button" onClick={clearAll} className="min-h-[28px] font-ui text-[12.5px] font-semibold text-foreground/80 underline underline-offset-2 hover:text-foreground">
              Clear all
            </button>
          )}
        </div>
      </form>

      <div className="flex min-h-0 flex-1 gap-5">
        <aside aria-label="Filters" className={`${css.rail} hidden w-[248px] shrink-0 lg:block`}>
          {rail}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            ref={scroller}
            className={css.scroller}
            tabIndex={-1}
            onKeyDown={onKey}
            aria-busy={pending || undefined}
            style={pending ? { opacity: 0.55 } : undefined}
          >
            <table className={css.table} aria-label={trade.plural} aria-rowcount={total + 1} style={{ width: nameW + visible.reduce((s, c) => s + c.w, 0) }}>
              <colgroup>
                <col style={{ width: nameW }} />
                {visible.map((c) => (
                  <col key={c.key} style={{ width: c.w }} />
                ))}
              </colgroup>
              <thead>
                <tr aria-rowindex={1}>
                  <th scope="col" className={css.stick} aria-sort={sortState('name')}>
                    <SortButton label="Name" on={sortState('name')} onClick={() => sortBy('name')} />
                  </th>
                  {visible.map((c) => (
                    <th key={c.key} scope="col" aria-sort={sortState(c.sort)}>
                      {c.sort ? <SortButton label={c.label} on={sortState(c.sort)} onClick={() => sortBy(c.sort!)} /> : <span className={css.thPlain}>{c.label}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={visible.length + 1} className={css.empty}>
                      <p className="font-news text-[18px] text-foreground">Nobody matches all of that.</p>
                      <p className="mt-1 font-ui text-[13.5px] text-foreground/75">
                        Untick a filter or two, or{' '}
                        <button type="button" onClick={clearAll} className="font-semibold text-foreground underline underline-offset-2">
                          clear them all
                        </button>
                        .
                      </p>
                    </td>
                  </tr>
                ) : (
                  <>
                    {start > 0 && <tr aria-hidden="true" style={{ height: start * rowH }} />}
                    {slice.map((r, j) => (
                      <XRowView
                        key={r.s}
                        r={r}
                        i={start + j}
                        hub={hub}
                        cols={visible}
                        ctx={ctx}
                        open={open === r.s}
                        tab={start + j === active}
                        onOpen={openAt}
                      />
                    ))}
                    {end < items.length && <tr aria-hidden="true" style={{ height: (items.length - end) * rowH }} />}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 shrink-0 font-ui text-[12px] text-foreground/65 max-sm:hidden">
            Arrow keys move through the list, Enter opens a person, Escape closes. Facts from each firm&rsquo;s public bio page; nobody pays to be listed.
          </p>
        </div>
      </div>

      {sheet && (
        <FilterSheet onClose={() => setSheet(false)} count={total}>
          {rail}
        </FilterSheet>
      )}

      {open && (
        <PersonPanel
          key={open}
          row={openRow}
          slug={open}
          trade={trade}
          firm={openRow ? firms[openRow.d] : undefined}
          year={year}
          onClose={closePanel}
        />
      )}
    </div>
  )
}

function SortButton({ label, on, onClick }: { label: string; on: 'ascending' | 'descending' | undefined; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${css.sortBtn} ${on ? css.sortOn : ''}`}>
      {label}
      <span className={css.sortMark} aria-hidden="true">
        {on === 'descending' ? '▼' : on === 'ascending' ? '▲' : '▲▼'}
      </span>
      <span className="sr-only">{on ? `, sorted ${on}` : ', sort'}</span>
    </button>
  )
}

/** One row. Memoised: scrolling and typing redraw only what changed. */
const XRowView = memo(function XRowView({
  r,
  i,
  hub,
  cols,
  ctx,
  open,
  tab,
  onOpen,
}: {
  r: XRow
  i: number
  hub: string
  cols: Col[]
  ctx: Ctx
  open: boolean
  tab: boolean
  onOpen: (i: number) => void
}) {
  return (
    <tr
      data-i={i}
      data-slug={r.s}
      aria-rowindex={i + 2}
      tabIndex={tab ? 0 : -1}
      className={open ? css.rowOpen : undefined}
      aria-selected={open || undefined}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a') && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return
        e.preventDefault()
        onOpen(i)
      }}
    >
      <th scope="row" className={css.stick}>
        <span className="flex min-w-0 items-center gap-1.5">
          {/* A real link (a new tab, a copied address); a plain click opens the panel instead. */}
          <a href={`${hub}/people/${r.s}`} className={`${css.name} truncate`} tabIndex={-1}>
            {r.n}
          </a>
          {r.cl && (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#1d6b43]" aria-label="Claimed profile" role="img" />
          )}
        </span>
      </th>
      {cols.map((c) => (
        <td key={c.key} title={c.text(r, ctx) || undefined}>
          {c.cell(r, ctx)}
        </td>
      ))}
    </tr>
  )
})

function ColumnMenu({ cols, on, onSet, density, onDensity, onClose }: { cols: Col[]; on: Record<ColKey, boolean>; onSet: (k: ColKey, v: boolean) => void; density: Density; onDensity: (d: Density) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector('input')?.focus()
    const away = (e: MouseEvent) => !ref.current?.parentElement?.contains(e.target as Node) && onClose()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [onClose])
  return (
    <div ref={ref} id="xp-cols" className="absolute right-0 top-[calc(100%+6px)] z-40 w-[240px] rounded-[3px] border border-foreground/25 bg-card p-3 shadow-[0_8px_24px_-12px_rgba(19,35,58,0.45)]">
      <fieldset>
        <legend className="font-ui text-[13px] font-bold text-foreground">Show columns</legend>
        <div className="mt-1.5">
          <label className="flex min-h-[30px] items-center gap-2 font-ui text-[13px] text-foreground/60">
            <input type="checkbox" checked disabled className="h-[15px] w-[15px] accent-foreground" /> Name (always)
          </label>
          {cols.map((c) => (
            <label key={c.key} className="flex min-h-[30px] cursor-pointer items-center gap-2 font-ui text-[13px] text-foreground">
              <input type="checkbox" checked={on[c.key]} onChange={(e) => onSet(c.key, e.target.checked)} className="h-[15px] w-[15px] accent-foreground" />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-3 border-t border-border pt-2.5">
        <legend className="sr-only">Row height</legend>
        <div className="flex items-center gap-1" role="group" aria-label="Row height">
          <Rows3 className="mr-1 h-4 w-4 text-foreground/60" aria-hidden="true" />
          {(['compact', 'comfy'] as Density[]).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={density === d}
              onClick={() => onDensity(d)}
              className={`h-8 flex-1 rounded-[3px] border font-ui text-[12.5px] font-semibold ${density === d ? 'border-foreground bg-foreground text-background' : 'border-foreground/30 text-foreground hover:border-foreground'}`}
            >
              {d === 'compact' ? 'Compact' : 'Roomy'}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

/** On a phone, the filters come up as a sheet over the table. */
function FilterSheet({ children, onClose, count }: { children: ReactNode; onClose: () => void; count: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useModal(ref, onClose)
  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <div className="absolute inset-0 bg-[rgba(19,35,58,0.45)]" onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="xp-sheet-h" className="paper absolute inset-x-0 bottom-0 top-10 flex flex-col rounded-t-[6px] bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 id="xp-sheet-h" tabIndex={-1} className="font-news text-[20px] font-semibold text-foreground outline-none">
            Filters
          </h2>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-[3px] text-foreground hover:bg-foreground/5" aria-label="Close filters">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        <div className="border-t border-border px-4 py-3">
          <button type="button" onClick={onClose} className="h-11 w-full rounded-[3px] bg-foreground font-ui text-[14px] font-bold text-background">
            Show {n(count)} {count === 1 ? 'person' : 'people'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Narrower than a tablet: the name column gives up some width. */
function useNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const m = window.matchMedia('(max-width: 639px)')
    const on = () => setNarrow(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return narrow
}
