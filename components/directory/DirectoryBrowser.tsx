'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Search, SlidersHorizontal, X } from 'lucide-react'
import { FirmMark } from '@/components/directory/FirmMark'
import { SearchMissBeacon } from '@/components/directory/owner'
import { practiceLabel } from '@/lib/directory/taxonomy'
import { QUERY_PAGE, SORTS, facetCounts, haystack, isSortKey, normalQuery, queryHref, runQuery, type Query, type Row, type RowFirm, type SortKey } from '@/lib/directory/search'
import { decodeIndex, type CompactIndex } from '@/lib/directory/search-index'

/**
 * A trade's list, searched, filtered, sorted and paged in the browser (2026-10-24 night, the interface pass).
 *
 * Structure taken from the directories people already know how to use, not their looks:
 *   - Zocdoc's search results: one sticky bar holding the search and the filters, the count of what is left always
 *     in view, each filter removable as a chip;
 *   - LinkedIn Sales Navigator's lead lists: dense rows, the company's logo at the left of each, title and company on
 *     one line, filter menus that say how many each choice leaves;
 *   - Chambers and Partners: practice areas as the way in, the firm as the unit people compare.
 *
 * The first render (on the server) is the same component with the address's filters, so a crawler and a reader
 * without JavaScript get the same page and real links between pages; with JavaScript, every change answers at once
 * and the address follows along (replaceState), so a filtered view can still be shared.
 */

export interface BrowserProps {
  path: string
  plural: string
  singular: string
  searchHint: string
  firmHint: [string, string]
  /** The page the server rendered for the address's own query: its rows, how many in all, and the menus' counts. */
  first: { items: Row[]; total: number; counts: Record<Facet, [string, number][]> }
  /** Every firm in the trade, once (names, pages, marks): small, so it travels with the page. */
  firms: Record<string, RowFirm>
  practices: { id: string; label: string }[]
  cities: { key: string; label: string }[]
  initial: Query & { page: number }
  /** The compact index (lib/directory/search-index.ts), fetched on the reader's first move. */
  indexUrl: string
}

type Facet = 'practice' | 'city' | 'firm' | 'level'
const FACETS: Facet[] = ['practice', 'city', 'firm', 'level']

const href = queryHref

const n = (x: number) => x.toLocaleString('en-US')

/** The trade's slug, read from its index address ("/api/directory/index?trade=fund-lawyers"). */
const tradeOf = (indexUrl: string) => {
  try {
    return new URL(indexUrl, 'https://fundopshq.com').searchParams.get('trade') ?? ''
  } catch {
    return ''
  }
}

const control =
  'h-10 w-full rounded-[3px] border border-foreground/30 bg-card px-2.5 font-ui text-[14px] text-foreground focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40'

export function DirectoryBrowser(props: BrowserProps) {
  const { path, plural, firms, practices, cities } = props
  const [q, setQ] = useState(props.initial.q ?? '')
  const [practice, setPractice] = useState(props.initial.practice ?? '')
  const [city, setCity] = useState(props.initial.city ?? '')
  const [firm, setFirm] = useState(props.initial.firm ?? '')
  const [level, setLevel] = useState(props.initial.level === 'senior' ? 'senior' : '')
  const [sort, setSort] = useState<SortKey>(isSortKey(props.initial.sort) ? props.initial.sort : 'name')
  const [page, setPage] = useState(props.initial.page)
  const [open, setOpen] = useState(false)
  const listTop = useRef<HTMLDivElement>(null)

  // The whole list arrives only when the reader first moves (focus, a key, a filter, a page): until then the page
  // shows what the server rendered, and a page link is a plain link to the server's own next page.
  const [rows, setRows] = useState<Row[] | null>(null)
  const loading = useRef<Promise<void> | null>(null)
  const failed = useRef(false)
  const firmsRef = useRef(firms)
  const load = useCallback(() => {
    if (loading.current) return
    loading.current = fetch(props.indexUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((ix: CompactIndex) => setRows(decodeIndex(ix, (d) => firmsRef.current[d]?.name ?? d)))
      .catch(() => {
        // No index: fall back to the server, which answers every filter itself.
        loading.current = null
        failed.current = true
      })
  }, [props.indexUrl])

  const typed = useDeferredValue(q)
  const hay = useMemo(() => (rows ? rows.map((r) => haystack(r, r.c)) : []), [rows])
  const query: Query = useMemo(() => ({ q: typed.trim(), practice, city, firm, level, sort }), [typed, practice, city, firm, level, sort])
  // The address the server rendered, built from the same fields as the live query and nothing else. (Until 2026-10-24
  // it spread `initial` whole, page included, so "?page=1" never matched the live "" and a fresh hub sat faded on
  // "Searching…" with aria-busy until the reader touched a control.)
  const initialKey = useMemo(() => href(path, normalQuery(props.initial), props.initial.page), [path, props.initial])
  const changed = href(path, query, page) !== initialKey
  const shown = useMemo(() => (rows ? runQuery(rows, query, hay) : null), [rows, query, hay])
  const total = shown ? shown.length : props.first.total
  const pages = Math.max(1, Math.ceil(total / QUERY_PAGE))
  const at = shown ? Math.min(page, pages) : props.initial.page
  const items = shown ? shown.slice((at - 1) * QUERY_PAGE, at * QUERY_PAGE) : props.first.items
  const pending = !rows && changed

  // With no index (offline, or the route failed), a change goes to the server as a plain request.
  useEffect(() => {
    if (pending && failed.current) window.location.assign(href(path, query, page))
  }, [pending, path, query, page])

  const counts = useMemo(() => {
    const out = {} as Record<Facet, Map<string, number>>
    for (const f of FACETS) out[f] = rows ? facetCounts(rows, query, f) : new Map(props.first.counts[f])
    return out
  }, [rows, query, props.first.counts])

  // The address follows the view, without a trip to the server or a new history entry for each keystroke.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    window.history.replaceState(window.history.state, '', href(path, query, at))
  }, [path, query, at])

  const change = useCallback(
    <T,>(set: (v: T) => void) =>
      (v: T) => {
        load()
        set(v)
        setPage(1)
      },
    [load],
  )

  const goTo = (p: number) => (e: React.MouseEvent) => {
    // Before the index has come, a page link is an ordinary link: the server renders that page.
    if (!rows || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    setPage(p)
    listTop.current?.scrollIntoView({ block: 'start' })
  }

  const firmList = useMemo(() => Object.values(firms).sort((a, b) => a.name.localeCompare(b.name, 'en')), [firms])
  const active: { key: string; label: string; clear: () => void }[] = [
    ...(practice ? [{ key: 'practice', label: practices.find((p) => p.id === practice)?.label ?? practice, clear: () => change(setPractice)('') }] : []),
    ...(city ? [{ key: 'city', label: cities.find((c) => c.key === city)?.label ?? city, clear: () => change(setCity)('') }] : []),
    ...(firm ? [{ key: 'firm', label: firms[firm]?.name ?? firm, clear: () => change(setFirm)('') }] : []),
    ...(level ? [{ key: 'level', label: 'Partners and MDs only', clear: () => change(setLevel)('') }] : []),
  ]
  const filtersOn = active.length
  const clearAll = () => {
    setQ('')
    setPractice('')
    setCity('')
    setFirm('')
    setLevel('')
    setPage(1)
  }

  const option = (count: number | undefined, selected: boolean) => !selected && !count

  const filters = (
    <>
      <div className="min-w-0">
        <label htmlFor="dir-practice" className="mb-1 block font-ui text-[12px] font-semibold text-foreground/75">
          Practice
        </label>
        <select id="dir-practice" name="practice" value={practice} onChange={(e) => change(setPractice)(e.target.value)} className={control}>
          <option value="">All practices</option>
          {practices.map((p) =>
            option(counts.practice.get(p.id), practice === p.id) ? null : (
              <option key={p.id} value={p.id}>
                {p.label} ({n(counts.practice.get(p.id) ?? 0)})
              </option>
            ),
          )}
        </select>
      </div>
      <div className="min-w-0">
        <label htmlFor="dir-city" className="mb-1 block font-ui text-[12px] font-semibold text-foreground/75">
          City
        </label>
        <select id="dir-city" name="city" value={city} onChange={(e) => change(setCity)(e.target.value)} className={control}>
          <option value="">All cities</option>
          {cities.map((c) =>
            option(counts.city.get(c.key), city === c.key) ? null : (
              <option key={c.key} value={c.key}>
                {c.label} ({n(counts.city.get(c.key) ?? 0)})
              </option>
            ),
          )}
        </select>
      </div>
      <div className="min-w-0">
        <label htmlFor="dir-firm" className="mb-1 block font-ui text-[12px] font-semibold text-foreground/75">
          Firm
        </label>
        <select id="dir-firm" name="firm" value={firm} onChange={(e) => change(setFirm)(e.target.value)} className={control}>
          <option value="">All firms</option>
          {firmList.map((f) =>
            option(counts.firm.get(f.domain), firm === f.domain) ? null : (
              <option key={f.domain} value={f.domain}>
                {f.name} ({n(counts.firm.get(f.domain) ?? 0)})
              </option>
            ),
          )}
        </select>
      </div>
      <div className="flex min-w-0 items-end">
        <button
          type="button"
          aria-pressed={level === 'senior'}
          onClick={() => change(setLevel)(level ? '' : 'senior')}
          className={`inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] border px-3 font-ui text-[13.5px] font-semibold ${level ? 'border-foreground bg-foreground text-background' : 'border-foreground/30 bg-card text-foreground hover:border-foreground'}`}
        >
          Partners and MDs
          <span className={level ? 'text-background/80' : 'text-foreground/65'}>({n(counts.level.get('senior') ?? 0)})</span>
        </button>
      </div>
    </>
  )

  return (
    <div>
      {/* The bar stays in view under the site's own sticky menu while the list scrolls. */}
      <form
        id="dir-form"
        action={path}
        method="get"
        role="search"
        aria-label={`Search ${plural.toLowerCase()}`}
        onSubmit={(e) => {
          if (rows || !failed.current) e.preventDefault()
        }}
        onFocusCapture={load}
        onPointerEnter={load}
        onTouchStart={load}
        className="sticky top-[var(--dir-sticky,42px)] z-30 -mx-4 border-b border-border bg-background/95 px-4 pb-2.5 pt-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:mx-0 lg:px-0"
      >
        <div className="flex flex-wrap items-end gap-2 lg:flex-nowrap">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="dir-q" className="mb-1 block font-ui text-[12px] font-semibold text-foreground/75">
              Name, firm or city
            </label>
            <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-foreground/55" aria-hidden="true" />
            <input
              id="dir-q"
              type="search"
              name="q"
              value={q}
              onChange={(e) => change(setQ)(e.target.value)}
              placeholder={props.searchHint}
              autoComplete="off"
              spellCheck={false}
              className={`${control} pl-9 text-[16px] sm:text-[14px]`}
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="dir-filters"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[3px] border border-foreground/30 bg-card px-3 font-ui text-[13.5px] font-semibold text-foreground hover:border-foreground lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters{filtersOn ? ` (${filtersOn})` : ''}
          </button>
          {/* One set of controls: folded away behind "Filters" on a phone, always out on a desk. */}
          <div
            id="dir-filters"
            className={`${open ? 'grid' : 'hidden'} mt-0.5 w-full grid-cols-1 gap-2 min-[400px]:grid-cols-2 lg:mt-0 lg:grid lg:w-auto lg:min-w-0 lg:flex-[1.6] lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]`}
          >
            {filters}
          </div>
          <noscript>
            <button type="submit" className="h-10 rounded-[3px] bg-foreground px-4 font-ui text-[13px] font-bold text-background">
              Search
            </button>
          </noscript>
        </div>
        {(filtersOn > 0 || q) && (
          <ul className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Filters in use">
            {active.map((a) => (
              <li key={a.key}>
                <button
                  type="button"
                  onClick={a.clear}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-foreground/30 bg-card py-0.5 pl-2.5 pr-2 font-ui text-[12.5px] text-foreground hover:border-foreground"
                >
                  {a.label}
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">(remove this filter)</span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={clearAll} className="min-h-[32px] px-1.5 font-ui text-[12.5px] font-semibold text-foreground/75 underline underline-offset-2 hover:text-foreground">
                Clear all
              </button>
            </li>
          </ul>
        )}
      </form>

      <div ref={listTop} className="scroll-mt-[calc(var(--dir-sticky,42px)+64px)]" />
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t-2 border-foreground pt-1.5">
        <h2 className="whitespace-nowrap font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
          {typed.trim() ? 'Best matches' : sort === 'firm' ? 'By firm' : 'A to Z by surname'}
        </h2>
        <div className="flex items-baseline gap-3">
          <p className="whitespace-nowrap font-ui text-[12.5px] text-foreground/75" role="status" aria-live="polite">
            {pending ? 'Searching…' : total ? `${n((at - 1) * QUERY_PAGE + 1)}–${n((at - 1) * QUERY_PAGE + items.length)} of ${n(total)}` : 'No matches'}
          </p>
          <label className="flex items-baseline gap-1 font-ui text-[12.5px] text-foreground/75">
            <span>Sort</span>
            <select
              name="sort"
              form="dir-form"
              value={sort}
              onChange={(e) => change(setSort)(e.target.value as SortKey)}
              className="rounded-[3px] border border-foreground/25 bg-card py-0.5 pl-1 pr-0.5 font-ui text-[12.5px] font-semibold text-foreground focus:border-foreground focus:outline-none"
            >
              {SORTS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {total === 0 && !pending ? (
        <div className="py-8">
          <p className="font-news text-[18px] leading-snug text-foreground">Nobody matches that.</p>
          <p className="mt-1.5 font-ui text-[13.5px] leading-relaxed text-foreground/75">
            Try fewer words, or a firm&rsquo;s short name (&ldquo;{props.firmHint[0]}&rdquo;, not &ldquo;{props.firmHint[1]}&rdquo;).
            {filtersOn > 0 && (
              <>
                {' '}
                Or{' '}
                <button type="button" onClick={clearAll} className="font-semibold text-foreground underline underline-offset-2">
                  clear the filters
                </button>
                .
              </>
            )}
          </p>
          {/* Workstream B (2026-10-24): log the miss (aggregated, lib/directory/views.ts) and offer a way to add who is missing. */}
          <SearchMissBeacon trade={tradeOf(props.indexUrl)} q={filtersOn ? '' : typed} />
          <p className="mt-3 font-ui text-[13.5px] leading-relaxed text-foreground/75">
            Someone missing?{' '}
            <Link
              prefetch={false}
              href={`/directory/suggest?trade=${encodeURIComponent(tradeOf(props.indexUrl))}${typed.trim() ? `&q=${encodeURIComponent(typed.trim().slice(0, 60))}` : ''}`}
              className="font-semibold text-foreground underline underline-offset-2"
            >
              Suggest a firm or add yourself
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul aria-label={plural} aria-busy={pending || undefined} className={`divide-y divide-border/80 transition-opacity ${pending ? 'opacity-50' : ''}`}>
          {items.map((r, i) => (
            <PersonRow key={r.s} r={r} firm={firms[r.d]} path={path} eager={i < 8} />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-5 flex flex-wrap items-center gap-2">
          {at > 1 && (
            <a rel="prev" href={href(path, query, at - 1)} onClick={goTo(at - 1)} className="inline-flex h-10 items-center rounded-[3px] border border-foreground/30 px-3 font-ui text-[13px] font-semibold text-foreground hover:border-foreground">
              ← Previous
            </a>
          )}
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pages || Math.abs(p - at) <= 1)
            .map((p, i, list) => (
              <span key={p} className="flex items-center gap-2">
                {i > 0 && p - list[i - 1] > 1 && <span className="font-ui text-[13px] text-foreground/60">…</span>}
                <a
                  href={href(path, query, p)}
                  onClick={goTo(p)}
                  aria-current={p === at ? 'page' : undefined}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-[3px] border px-2 font-ui text-[13px] font-semibold ${p === at ? 'border-foreground bg-foreground text-background' : 'border-foreground/30 text-foreground hover:border-foreground'}`}
                >
                  {p}
                </a>
              </span>
            ))}
          {at < pages && (
            <a rel="next" href={href(path, query, at + 1)} onClick={goTo(at + 1)} className="inline-flex h-10 items-center rounded-[3px] border border-foreground/30 px-3 font-ui text-[13px] font-semibold text-foreground hover:border-foreground">
              Next →
            </a>
          )}
        </nav>
      )}
    </div>
  )
}

/** One person: the firm's mark, the name set like a headline, title and firm on one line, the office, practices. */
export function PersonRow({ r, firm, path, eager = false, hideFirm = false }: { r: Row; firm?: RowFirm; path: string; eager?: boolean; hideFirm?: boolean }) {
  const base = path.split('/').slice(0, 2).join('/')
  return (
    <li data-slug={r.s} className={hideFirm ? 'py-3' : 'grid grid-cols-[56px_minmax(0,1fr)] items-start gap-x-3 py-3 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-x-4'}>
      {!hideFirm && (
        <span className="pt-0.5">
          {firm ? <FirmMark name={firm.name} logo={firm.logo} mono={firm.mono} size="sm" decorative eager={eager} className="max-sm:!h-[28px] max-sm:!w-[56px]" /> : null}
        </span>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Link prefetch={false} href={`${base}/people/${r.s}`} className="hl font-news text-[17.5px] font-bold leading-snug text-foreground">
            {r.n}
          </Link>
          {r.cl && (
            <span className="inline-flex items-center gap-0.5 font-ui text-[11.5px] font-semibold text-[#1d6b43]">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Claimed
            </span>
          )}
        </div>
        <p className="mt-0.5 font-ui text-[13.5px] leading-snug text-foreground/80">
          {r.t && <span>{r.t}</span>}
          {r.t && !hideFirm && <span aria-hidden="true"> · </span>}
          {hideFirm ? null : firm?.page ? (
            <Link prefetch={false} href={`${base}/firms/${firm.slug}`} className="font-semibold text-foreground hover:underline">
              {r.f}
            </Link>
          ) : (
            <span className="font-semibold text-foreground">{r.f}</span>
          )}
        </p>
        {(r.o || r.p.length > 0) && (
          <p className="mt-0.5 font-ui text-[12.5px] leading-snug text-foreground/65">
            {r.o}
            {r.om > 0 && ` + ${r.om} more`}
            {r.o && r.p.length > 0 && <span aria-hidden="true"> · </span>}
            {r.p.length > 0 && <PracticeText ids={r.p} />}
          </p>
        )}
      </div>
    </li>
  )
}


/** Practices as quiet text, not a row of boxes: a list scans faster with one less shape on every line. */
function PracticeText({ ids }: { ids: string[] }) {
  const shown = ids.slice(0, 3).map(practiceLabel)
  return (
    <span>
      <span className="sr-only">Practices: </span>
      {shown.join(', ')}
      {ids.length > 3 && ` + ${ids.length - 3} more`}
    </span>
  )
}
