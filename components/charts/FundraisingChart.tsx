'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  barValue, barsFor, inWindow, usd,
  type Bar, type ChartClose, type ChartMeasure, type ChartPeriod, type ChartViewKey,
} from '@/lib/news/chart-math'

/**
 * Fundraising, charted — a small instrument a reader can play with.
 *
 * Six cuts of the same league-table closes (market, region, size, week, fund,
 * firm), three periods, two measures, and every bar opens to show the funds
 * inside it. Nothing is fetched on interaction: the closes arrive with the
 * page and lib/news/chart-math.ts does the arithmetic, so the chart answers
 * at once.
 *
 * WHAT REACTS TO WHAT (Danny, 2026-10-02: "should react and be active on
 * hover, should not require a click… you can help me determine which"):
 *
 *   hover   the things a reader explores. Resting on a view tab switches to
 *           it; pointing at a bar lights it and opens a card beside it with
 *           the funds inside. No click is needed to see anything.
 *   click   the things a reader sets. Period, measure and the table view sit
 *           between the tabs and the bars, right where the pointer travels;
 *           if they changed on hover they would change by accident.
 *   click   also pins a bar's card open ("when someone does click on the bar
 *           it should have like a pop out with some data and show them where
 *           to go to see the details"). The pinned card stays put, lists the
 *           funds, and ends with the way to the supporting data: the league
 *           table for a group of funds, the reports and the firm's page for
 *           one. On a phone, where there is no room beside the chart and no
 *           hover, the same card opens under it on a tap.
 *
 * Transparency is part of the instrument, not a footnote to it: a bar's
 * contents are a hover away, figures that were converted or disputed are
 * marked, closes reported without a size are counted beside the total, the
 * unfinished week is drawn as unfinished, and "How this is counted" says what
 * is in and what is out.
 *
 * One series, one colour, so there is no legend: the title says what is
 * plotted. Every value is readable without hovering (labels on the rows, the
 * table view for the rest) and with the keyboard (bars are buttons).
 */

export interface FundraisingChartProps {
  /** Final closes of the last ~95 days, in the page's scope. */
  closes: ChartClose[]
  /** Dates of final closes in the same scope that no report put a size on. */
  unsized: string[]
  /** The newsroom's date (ET), fixed by the server so both renders agree. */
  today: string
  /** "Oct 1, 11:40 PM ET" — when the league was last built. */
  updated: string | null
  /** Asset-class labels. */
  labels: Record<string, string>
  /** The tabs, in order. */
  views: ChartViewKey[]
  title?: string
  /** The league table for this scope. */
  href: string
  moreLabel?: string
  /** `asset=` for league-table links, when the chart is one market's. */
  scopeAsset?: string
}

const TAB: Record<ChartViewKey, string> = { market: 'Market', region: 'Region', size: 'Size', weeks: 'Weeks', funds: 'Funds', firms: 'Firms' }
const PERIODS: ChartPeriod[] = [7, 30, 90]
const LIST_ROWS = 6
/** How long the pointer rests on a tab before the view follows it: long enough to cross the strip without flipping it. */
const TAB_DWELL_MS = 140

function titleFor(view: ChartViewKey, measure: ChartMeasure): string {
  const what = measure === 'capital' ? 'Capital closed' : 'Funds closed'
  switch (view) {
    case 'market': return `${what}, by asset class`
    case 'region': return `${what}, by region`
    case 'size': return `${what}, by fund size`
    case 'weeks': return `${what} each week`
    case 'funds': return 'The largest funds closed'
    case 'firms': return measure === 'capital' ? 'Managers that closed the most' : 'Managers that closed the most funds'
  }
}

const closesWord = (n: number) => `${n} ${n === 1 ? 'close' : 'closes'}`
const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/** "$1.9B", with ≈ for a converted figure and † when the reports also give another. */
function Size({ close }: { close: ChartClose }) {
  return (
    <span className="whitespace-nowrap font-mono text-[12px] font-semibold tabular-nums text-foreground">
      {close.c ? <span className="font-normal text-muted-foreground" title="Reported in another currency; converted to dollars">≈</span> : null}
      {usd(close.v)}
      {close.alt ? <span className="font-normal text-muted-foreground" title={`Reports also give ${usd(close.alt)}`}>†</span> : null}
    </span>
  )
}

/**
 * A bar's card: its total, the funds in it — who, which fund, when, how widely
 * reported, how much — and where to go for the supporting data. The same card
 * is the hover preview, the pinned pop-out, and the list under the chart on a
 * phone.
 */
function BarCard({
  bar, title, single, leagueHref, exact, onClose, assetLabel,
}: {
  bar: Bar
  title: string
  /** The market's name, for a single fund's card. */
  assetLabel?: string
  /** The bar is one fund (the "Funds" view). */
  single: boolean
  leagueHref: string
  /** The league table at that address lists exactly this bar's funds. */
  exact: boolean
  /** Present when the card is pinned. */
  onClose?: () => void
}) {
  const shown = bar.closes.slice(0, LIST_ROWS)
  const first = bar.closes[0]
  const more = 'font-semibold text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground'
  return (
    <>
      <div className="flex items-baseline justify-between gap-2 border-b border-border px-2.5 py-1.5">
        <p className="min-w-0 truncate font-ui text-[11px] font-extrabold uppercase tracking-[0.1em] text-foreground">{title}</p>
        <p className="flex shrink-0 items-baseline gap-2 whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground">
          <span>{single && first.c ? '≈' : ''}{usd(bar.capital)}{single ? '' : ` · ${closesWord(bar.count)}`}{bar.partial ? ' so far' : ''}</span>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close" className="font-ui text-[12px] font-semibold text-muted-foreground hover:text-foreground">
              ×
            </button>
          )}
        </p>
      </div>
      {single ? (
        // One fund: the header already names the manager and the size.
        <div className="px-2.5 py-2">
          <p className="font-news text-[15.5px] font-bold leading-snug text-foreground">{first.n ?? 'Fund not named in the reports'}</p>
          <p className="mt-0.5 font-ui text-[11.5px] leading-snug text-muted-foreground">
            Final close · reported {shortDate(first.d)} · {first.o} {first.o === 1 ? 'source' : 'sources'}
            {first.a && assetLabel ? ` · ${assetLabel}` : ''}
            {first.r ? ` · ${first.r}` : ''}
          </p>
          {first.alt ? <p className="mt-1 font-ui text-[11.5px] leading-snug text-muted-foreground">Reports also give {usd(first.alt)}; the lower figure is used.</p> : null}
        </div>
      ) : (
        <ol className="px-2.5">
          {shown.map((c) => (
            <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 border-b border-border/60 py-[5px] last:border-0">
              <span className="min-w-0">
                <Link prefetch={false} href={`/firm/${c.s}`} className="hl font-news text-[14.5px] font-bold leading-tight text-foreground">{c.f}</Link>
                <Link prefetch={false} href={`/story/${c.id}`} title="The reports of this close" className="block truncate font-ui text-[11.5px] text-muted-foreground hover:text-foreground hover:underline">
                  {c.n ?? 'Fund not named'} · {shortDate(c.d)} · {c.o} {c.o === 1 ? 'source' : 'sources'}
                </Link>
              </span>
              <Size close={c} />
            </li>
          ))}
        </ol>
      )}
      {/* Where the supporting data is. */}
      <div className="border-t border-border bg-background px-2.5 py-1.5 font-ui text-[11.5px] leading-snug text-muted-foreground">
        {single ? (
          <p className="flex flex-wrap gap-x-4 gap-y-0.5">
            <Link prefetch={false} href={`/story/${first.id}`} className={more}>The {first.o === 1 ? 'report' : `${first.o} reports`} →</Link>
            <Link prefetch={false} href={`/firm/${first.s}`} className={more}>Everything on {first.f} →</Link>
          </p>
        ) : (
          <p className="flex flex-wrap gap-x-4 gap-y-0.5">
            <Link href={leagueHref} className={more}>
              {exact ? `All ${bar.count} in the league table →` : 'The league table for this period →'}
            </Link>
            {bar.href && <Link prefetch={false} href={bar.href} className={more}>Firm page →</Link>}
          </p>
        )}
        {shown.some((c) => c.c) && <span className="mt-0.5 block">≈ converted to dollars</span>}
        {!single && shown.some((c) => c.alt) && <span className="block">† reports also give a higher figure; the lower is used</span>}
      </div>
    </>
  )
}

export function FundraisingChart({
  closes, unsized, today, updated, labels, views, title = 'Fundraising, charted', href, moreLabel = 'Full league tables', scopeAsset,
}: FundraisingChartProps) {
  const [view, setView] = useState<ChartViewKey>(views[0])
  const [period, setPeriod] = useState<ChartPeriod>(30)
  const [wanted, setMeasure] = useState<ChartMeasure>('capital')
  const [table, setTable] = useState(false)
  const [pinned, setPinned] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  /** Where the hovered and the pinned bar sit in the plot, so the card opens level with its bar. */
  const [hoverTop, setHoverTop] = useState(0)
  const [pinTop, setPinTop] = useState(0)
  const dwell = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (dwell.current) clearTimeout(dwell.current) }, [])

  // A list of single funds has one measure: their size.
  const measure: ChartMeasure = view === 'funds' ? 'capital' : wanted
  const bars = useMemo(() => barsFor(view, closes, { today, period, measure, labels }), [view, closes, today, period, measure, labels])

  if (closes.length === 0) return null

  const inPeriod = view === 'weeks' ? bars.flatMap((b) => b.closes) : inWindow(closes, period, today)
  const max = Math.max(...bars.map((b) => barValue(b, measure)), 1)
  const active = bars.find((b) => b.key === (hover ?? pinned)) ?? null
  const open = bars.find((b) => b.key === pinned && b.count > 0) ?? null
  const peek = hover ? bars.find((b) => b.key === hover && b.count > 0) ?? null : null
  // The card shows the bar under the pointer, and otherwise the pinned one.
  const card = peek ?? open
  const cardTop = peek ? hoverTop : pinTop
  const totalCapital = inPeriod.reduce((s, c) => s + c.v, 0)
  const noSize = inWindow(unsized.map((d) => ({ d })), view === 'weeks' ? 84 : period, today).length
  const periodLabel = view === 'weeks' ? 'Past 12 weeks' : `Past ${period} days`
  const fmt = (b: Bar) => (measure === 'capital' ? usd(b.capital) : String(b.count))
  const columns = view === 'weeks'
  const wideLabels = view === 'funds' || view === 'firms'
  const empty = bars.every((b) => b.count === 0)

  const select = (next: ChartViewKey) => { setView(next); setPinned(null); setHover(null) }
  const toggle = (key: string, el: HTMLElement) => {
    setPinned((cur) => (cur === key ? null : key))
    setPinTop(columns ? 0 : el.offsetTop)
  }
  const point = (key: string, el: HTMLElement) => { setHover(key); setHoverTop(columns ? 0 : el.offsetTop) }
  const restOn = (next: ChartViewKey) => {
    if (dwell.current) clearTimeout(dwell.current)
    if (next !== view) dwell.current = setTimeout(() => select(next), TAB_DWELL_MS)
  }
  const leaveTab = () => { if (dwell.current) clearTimeout(dwell.current) }
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = views.indexOf(view)
    const next = e.key === 'ArrowRight' ? views[(i + 1) % views.length] : e.key === 'ArrowLeft' ? views[(i - 1 + views.length) % views.length] : null
    if (!next) return
    e.preventDefault()
    select(next)
    // Focus follows the selection, as a tab list should.
    const root = e.currentTarget
    requestAnimationFrame(() => root.querySelector<HTMLElement>('[aria-selected="true"]')?.focus())
  }

  // League-table link for a bar: the same period, and the market when the bar is one.
  const leagueHrefFor = (b: Bar | null) => {
    const asset = view === 'market' && b && b.key !== 'other' ? b.key : scopeAsset
    const qs = new URLSearchParams({ ...(period === 90 || view === 'weeks' ? { period: '90d' } : {}), ...(asset ? { asset } : {}) }).toString()
    return qs ? `/league-tables?${qs}` : '/league-tables'
  }
  // Only a market bar over 30 or 90 days is a view the league-table page has.
  const exact = view === 'market' && period !== 7
  const barTitle = (b: Bar) => (columns ? `Week of ${b.label}` : b.label)

  const readout = active ? (
    view === 'funds' ? (
      <>
        <span className="font-semibold text-foreground">{active.label}</span>
        {active.closes[0].n ? ` — ${active.closes[0].n}` : ''} · {usd(active.capital)} · reported {shortDate(active.closes[0].d)}
      </>
    ) : (
      <>
        <span className="font-semibold text-foreground">{barTitle(active)}:</span>{' '}
        {active.count === 0 ? 'no closes reported' : `${usd(active.capital)} across ${closesWord(active.count)}`}
        {active.partial ? ' so far' : ''}
        {active.count > 1 ? ` · largest ${active.closes[0].f}, ${usd(active.closes[0].v)}` : ''}
      </>
    )
  ) : (
    <>
      <span className="font-semibold text-foreground">{usd(totalCapital)}</span> across {closesWord(inPeriod.length)}
      {noSize > 0 ? ` · ${noSize} more reported without a size` : ''}
    </>
  )

  return (
    <section aria-label={title} className="panel" onKeyDown={(e) => { if (e.key === 'Escape') setPinned(null) }}>
      <div className="panel-head">
        <h2 className="font-ui text-[11.5px] font-extrabold uppercase tracking-[0.13em]">{title}</h2>
        <span className="note whitespace-nowrap font-ui text-[11px]">Final closes</span>
      </div>

      {views.length > 1 && (
        <div role="tablist" aria-label="Chart view" onKeyDown={onTabKey} onMouseLeave={leaveTab} className="tab-scroll flex gap-x-[15px] overflow-x-auto border-b border-border px-[14px]">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={v === view}
              tabIndex={v === view ? 0 : -1}
              onClick={() => { leaveTab(); select(v) }}
              onMouseEnter={() => restOn(v)}
              className={cn(
                '-mb-px shrink-0 border-b-[3px] pb-1.5 pt-2 font-ui text-[12.5px] transition-colors',
                v === view ? 'border-foreground font-bold text-foreground' : 'border-transparent font-medium text-foreground/60 hover:text-foreground',
              )}
            >
              {TAB[v]}
            </button>
          ))}
        </div>
      )}

      <div className="px-[14px] pb-3 pt-2.5">
        {/* One row of controls, above everything they scope. These are settings: they change on a click. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {view === 'weeks' ? (
            <span className="font-ui text-[11.5px] text-muted-foreground">12 weeks</span>
          ) : (
            <Segmented
              label="Period"
              options={PERIODS.map((p) => ({ key: String(p), label: `${p}d`, title: `Past ${p} days` }))}
              value={String(period)}
              onChange={(k) => { setPeriod(Number(k) as ChartPeriod); setPinned(null) }}
            />
          )}
          {view !== 'funds' && (
            <Segmented
              label="Measure"
              options={[{ key: 'capital', label: 'Capital', title: 'Dollars closed' }, { key: 'count', label: 'Funds', title: 'Number of funds closed' }]}
              value={measure}
              onChange={(k) => setMeasure(k as ChartMeasure)}
            />
          )}
          <button
            type="button"
            aria-pressed={table}
            onClick={() => setTable((t) => !t)}
            title={table ? 'Show the chart' : 'Show the numbers as a table'}
            className={cn(
              'ml-auto h-[22px] rounded-sm border px-2 font-ui text-[11px] font-semibold transition-colors',
              table ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground/70 hover:border-foreground/50 hover:text-foreground',
            )}
          >
            Table
          </button>
        </div>

        <p className="mt-2 font-ui text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground">{titleFor(view, measure)}</span> · {periodLabel}
        </p>

        <div className="relative" onMouseLeave={() => setHover(null)}>
          {empty ? (
            <p className="py-6 text-center font-news text-[15px] text-muted-foreground">
              No final closes were reported in this period.
              {view !== 'weeks' && period !== 90 && (
                <>
                  {' '}
                  <button type="button" onClick={() => setPeriod(90)} className="font-semibold text-foreground underline underline-offset-2">
                    Show 90 days
                  </button>
                </>
              )}
            </p>
          ) : table ? (
            <table className="mt-1.5 w-full border-collapse">
              <thead>
                <tr className="border-b border-border font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th scope="col" className="py-1 text-left font-bold">{columns ? 'Week of' : view === 'funds' ? 'Manager' : TAB[view]}</th>
                  <th scope="col" className="py-1 text-right font-bold">Capital</th>
                  <th scope="col" className="w-12 py-1 text-right font-bold">Funds</th>
                </tr>
              </thead>
              <tbody>
                {bars.map((b) => (
                  <tr
                    key={b.key}
                    onMouseEnter={(e) => point(b.key, e.currentTarget)}
                    className={cn('border-b border-border/60 last:border-0', (hover === b.key || pinned === b.key) && 'bg-background')}
                  >
                    <th scope="row" className="max-w-0 py-[5px] pr-2 text-left font-normal">
                      <button
                        type="button"
                        aria-pressed={pinned === b.key}
                        onClick={(e) => toggle(b.key, e.currentTarget.closest('tr') as HTMLElement)}
                        onFocus={(e) => point(b.key, e.currentTarget.closest('tr') as HTMLElement)}
                        onBlur={() => setHover(null)}
                        className="block w-full truncate text-left font-ui text-[12px] text-foreground underline-offset-2 hover:underline"
                      >
                        {b.label}{b.partial ? ' (so far)' : ''}
                      </button>
                    </th>
                    <td className="py-[5px] text-right font-mono text-[11.5px] font-semibold tabular-nums text-foreground">{b.count ? usd(b.capital) : '—'}</td>
                    <td className="py-[5px] text-right font-mono text-[11.5px] tabular-nums text-foreground/80">{b.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : columns ? (
            <>
              <ol className="mt-3 grid h-[132px] items-end gap-x-[3px]" style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}>
                {bars.map((b) => {
                  const v = barValue(b, measure)
                  const lit = hover === b.key || pinned === b.key
                  return (
                    <li key={b.key} className="flex h-full flex-col justify-end">
                      <button
                        type="button"
                        aria-pressed={pinned === b.key}
                        aria-label={`Week of ${b.label}: ${b.count === 0 ? 'no closes reported' : `${usd(b.capital)} across ${closesWord(b.count)}`}${b.partial ? ', week not over' : ''}`}
                        onClick={(e) => toggle(b.key, e.currentTarget)}
                        onMouseEnter={(e) => point(b.key, e.currentTarget)}
                        onFocus={(e) => point(b.key, e.currentTarget)}
                        onBlur={() => setHover(null)}
                        className="flex h-full w-full cursor-pointer flex-col justify-end outline-none focus-visible:ring-1 focus-visible:ring-foreground"
                      >
                        {/* Only the peak carries its number; the readout, the card and the table carry the rest. */}
                        {v === max && v > 0 && <span className="mb-0.5 text-center font-mono text-[10px] font-semibold tabular-nums text-foreground">{fmt(b)}</span>}
                        <span
                          className="bar-y block w-full rounded-t-[4px] transition-[height,background-color,opacity] duration-300"
                          style={{
                            height: `${Math.max((v / max) * 100, v > 0 ? 2 : 0)}%`,
                            maxHeight: 'calc(100% - 14px)',
                            background: lit ? 'var(--tab)' : 'var(--ink)',
                            opacity: lit ? 1 : b.partial ? 0.45 : pinned ? 0.55 : 1,
                          }}
                        />
                      </button>
                    </li>
                  )
                })}
              </ol>
              <div className="mt-1 flex justify-between border-t border-border pt-1 font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
                <span>{bars[0]?.label}</span>
                <span>{bars[Math.floor(bars.length / 2)]?.label}</span>
                <span>This week</span>
              </div>
            </>
          ) : (
            <ol className="mt-2">
              {bars.map((b) => {
                const v = barValue(b, measure)
                const lit = hover === b.key || pinned === b.key
                const fill = (
                  <span
                    className="bar-x block h-full rounded-r-[4px] transition-[width,background-color,opacity] duration-300"
                    style={{
                      width: `${Math.max((v / max) * 100, v > 0 ? 1.5 : 0)}%`,
                      background: lit ? 'var(--tab)' : 'var(--ink)',
                      opacity: lit || !pinned ? 1 : 0.55,
                    }}
                  />
                )
                return (
                  <li key={b.key}>
                    <button
                      type="button"
                      aria-pressed={pinned === b.key}
                      aria-label={`${b.label}: ${b.count === 0 ? 'no closes' : `${usd(b.capital)} across ${closesWord(b.count)}`}. Show the funds.`}
                      onClick={(e) => toggle(b.key, e.currentTarget)}
                      onMouseEnter={(e) => point(b.key, e.currentTarget)}
                      onFocus={(e) => point(b.key, e.currentTarget)}
                      onBlur={() => setHover(null)}
                      className={cn(
                        'w-full cursor-pointer text-left outline-none focus-visible:ring-1 focus-visible:ring-foreground',
                        wideLabels ? 'block py-[4px]' : 'grid grid-cols-[108px_minmax(0,1fr)_46px] items-center gap-x-2 py-[3.5px]',
                      )}
                    >
                      {wideLabels ? (
                        // A firm's name needs the whole width: the name and the figure on one line, the bar under them.
                        <>
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={cn('min-w-0 truncate font-ui text-[12px]', lit ? 'font-semibold text-foreground' : 'text-foreground/85')}>
                              {b.label}
                              {view === 'funds' && b.closes[0].n && <span className="font-normal text-muted-foreground"> · {b.closes[0].n}</span>}
                            </span>
                            <span className="shrink-0 font-mono text-[11.5px] font-semibold tabular-nums text-foreground">{fmt(b)}</span>
                          </span>
                          <span className="mt-[3px] block h-[6px]">{fill}</span>
                        </>
                      ) : (
                        <>
                          <span className={cn('truncate font-ui text-[12px]', lit ? 'font-semibold text-foreground' : 'text-foreground/80')} title={b.label}>{b.label}</span>
                          <span className="h-[10px]">{fill}</span>
                          <span className="text-right font-mono text-[11.5px] font-semibold tabular-nums text-foreground">{fmt(b)}</span>
                        </>
                      )}
                    </button>
                  </li>
                )
              })}
            </ol>
          )}

          {/* The pop-out: the bar under the pointer, or the pinned one, level
              with its bar and to the left, over the page. It is inside the
              plot's box in the document, so moving onto it does not leave the
              plot; the padding on its right bridges the gap between the two.
              For a pointer and a wide screen only (globals.css `.hover-card`). */}
          {card && (
            <div className="hover-card absolute right-full z-30 w-[330px] pr-3" style={{ top: Math.max(cardTop - 34, -8) }}>
              <div className="panel shadow-[0_10px_30px_-8px_rgba(19,35,58,0.35)]">
                <BarCard
                  bar={card}
                  title={barTitle(card)}
                  single={view === 'funds'}
                  leagueHref={leagueHrefFor(card)}
                  exact={exact && card.key !== 'other'}
                  assetLabel={labels[card.closes[0]?.a ?? '']}
                  onClose={card.key === pinned ? () => setPinned(null) : undefined}
                />
              </div>
            </div>
          )}
        </div>

        <p className="mt-2.5 min-h-[18px] border-t border-border/70 pt-1.5 font-ui text-[12px] leading-snug text-muted-foreground" aria-live="polite">
          {readout}
        </p>

        {open ? (
          // No hover and no room beside the chart: the pinned card opens here instead.
          <div className="touch-card mt-2 border border-border bg-card">
            <BarCard bar={open} title={barTitle(open)} single={view === 'funds'} leagueHref={leagueHrefFor(open)} exact={exact && open.key !== 'other'} assetLabel={labels[open.closes[0]?.a ?? '']} onClose={() => setPinned(null)} />
          </div>
        ) : (
          !empty && (
            <p className="mt-1 font-ui text-[11.5px] text-muted-foreground/90">
              <span className="hover-hint">Point at a bar for the funds in it; click to pin them.</span>
              <span className="touch-hint">Tap a bar for the funds in it.</span>
            </p>
          )
        )}

        <details className="group mt-2.5 border-t border-border/70 pt-1.5">
          <summary className="flex cursor-pointer list-none items-center justify-between font-ui text-[12px] font-semibold text-foreground/70 hover:text-foreground [&::-webkit-details-marker]:hidden">
            <span>How this is counted</span>
            <span className="font-mono text-[11px] group-open:hidden" aria-hidden="true">+</span>
            <span className="hidden font-mono text-[11px] group-open:inline" aria-hidden="true">−</span>
          </summary>
          <ul className="mt-1.5 space-y-1.5 font-ui text-[11.5px] leading-snug text-muted-foreground">
            <li><span className="font-semibold text-foreground/85">In:</span> final closes of private funds that a publication reported, with a named manager and a stated size. Rumoured and expected closes are left out until they happen.</li>
            <li><span className="font-semibold text-foreground/85">Out:</span> hedge funds, continuation vehicles, CLOs, single-investor mandates and evergreen funds.</li>
            <li><span className="font-semibold text-foreground/85">One fund, one count:</span> several reports of a close are joined. Where they give different figures the lower one is used (†).</li>
            <li>
              <span className="font-semibold text-foreground/85">Sizes:</span> as reported; other currencies converted to dollars (≈).
              {noSize > 0 ? ` ${noSize} more ${noSize === 1 ? 'close was' : 'closes were'} reported in this period without a size and ${noSize === 1 ? 'is' : 'are'} not in the totals.` : ''}
            </li>
            {views.includes('region') && <li><span className="font-semibold text-foreground/85">Region:</span> where the fund invests or its manager is based, as the reports describe it.</li>}
            <li>It counts the closes in the stories FundOpsHQ carried, since March 2026; it is not a census.{updated ? ` Updated ${updated}.` : ''}</li>
          </ul>
        </details>

        <Link href={href} className="mt-2 inline-block font-ui text-[12px] font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline">
          {moreLabel} →
        </Link>
      </div>
    </section>
  )
}

function Segmented({
  label, options, value, onChange,
}: {
  label: string
  options: { key: string; label: string; title: string }[]
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex overflow-hidden rounded-sm border border-border">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={o.key === value}
          title={o.title}
          onClick={() => onChange(o.key)}
          className={cn(
            'h-[22px] border-l border-border px-2 font-ui text-[11px] font-semibold transition-colors first:border-l-0',
            o.key === value ? 'bg-foreground text-background' : 'bg-background text-foreground/70 hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
