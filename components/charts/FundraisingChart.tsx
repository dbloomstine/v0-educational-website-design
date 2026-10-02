'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Fundraising, charted — one panel, a few views of the same league-table data.
 *
 * One series in one colour, so there is no legend: the tab names the measure.
 * Every bar is labelled with its value (there are never more than twelve), a
 * readout line under the chart gives the count behind the bar under the
 * pointer or the keyboard focus, and the bars are a list a screen reader can
 * walk — the chart is its own table.
 */
export interface ChartBar { label: string; value: number; count: number }
export interface ChartView {
  key: string
  /** Tab label. */
  tab: string
  /** What the bars measure, in a sentence fragment: "Capital closed, by asset class". */
  title: string
  /** The period, said once: "Past 30 days". */
  period: string
  unit: 'usd' | 'count'
  layout: 'rows' | 'columns'
  bars: ChartBar[]
}

function usd(m: number): string {
  if (m >= 1000) return `$${(m / 1000).toFixed(m >= 10_000 ? 0 : 1).replace(/\.0$/, '')}B`
  return `$${Math.round(m)}M`
}
const fmt = (v: number, unit: ChartView['unit']) => (unit === 'usd' ? usd(v) : String(v))
const closes = (n: number) => `${n} ${n === 1 ? 'close' : 'closes'}`

export function FundraisingChart({ views, href }: { views: ChartView[]; href: string }) {
  const usable = views.filter((v) => v.bars.some((b) => b.value > 0))
  const [active, setActive] = useState(usable[0]?.key)
  const [hover, setHover] = useState<number | null>(null)
  if (usable.length === 0) return null
  const view = usable.find((v) => v.key === active) ?? usable[0]
  const max = Math.max(...view.bars.map((b) => b.value), 1)
  const total = view.bars.reduce((s, b) => s + (view.unit === 'usd' ? b.value : b.count), 0)
  const totalCount = view.bars.reduce((s, b) => s + b.count, 0)
  const focus = hover != null ? view.bars[hover] : null

  return (
    <section aria-label="Fundraising, charted" className="panel">
      <div className="panel-head">
        <h2 className="font-ui text-[11.5px] font-extrabold uppercase tracking-[0.13em]">Fundraising, charted</h2>
        <span className="note whitespace-nowrap font-ui text-[11px]">Final closes</span>
      </div>

      <div role="tablist" aria-label="Chart view" className="flex gap-x-4 border-b border-border px-[14px]">
        {usable.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={v.key === view.key}
            onClick={() => { setActive(v.key); setHover(null) }}
            className={cn(
              '-mb-px border-b-[3px] pb-1.5 pt-2 font-ui text-[12.5px] transition-colors',
              v.key === view.key ? 'border-foreground font-bold text-foreground' : 'border-transparent font-medium text-foreground/60 hover:text-foreground',
            )}
          >
            {v.tab}
          </button>
        ))}
      </div>

      <div className="px-[14px] pb-3 pt-2.5" onMouseLeave={() => setHover(null)}>
        <p className="font-ui text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground">{view.title}</span> · {view.period}
        </p>

        {view.layout === 'rows' ? (
          <ol className="mt-2 space-y-[7px]">
            {view.bars.map((b, i) => (
              <li
                key={b.label}
                tabIndex={0}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${b.label}: ${fmt(b.value, view.unit)}${view.unit === 'usd' ? ` across ${closes(b.count)}` : ''}`}
                className="grid cursor-default grid-cols-[92px_minmax(0,1fr)_46px] items-center gap-x-2 outline-none"
              >
                <span className={cn('truncate font-ui text-[12px]', hover === i ? 'font-semibold text-foreground' : 'text-foreground/80')}>{b.label}</span>
                <span className="h-[10px]">
                  <span
                    className="block h-full rounded-r-[4px] transition-[width,background-color] duration-300"
                    style={{ width: `${Math.max((b.value / max) * 100, b.value > 0 ? 1.5 : 0)}%`, background: hover === i ? 'var(--tab)' : 'var(--ink)' }}
                  />
                </span>
                <span className="text-right font-mono text-[11.5px] font-semibold tabular-nums text-foreground">{fmt(b.value, view.unit)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="mt-3 grid h-[132px] items-end gap-x-[3px]" style={{ gridTemplateColumns: `repeat(${view.bars.length}, minmax(0, 1fr))` }}>
            {view.bars.map((b, i) => (
              <li
                key={`${b.label}-${i}`}
                tabIndex={0}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`Week of ${b.label}: ${fmt(b.value, view.unit)} across ${closes(b.count)}`}
                className="flex h-full cursor-default flex-col justify-end outline-none"
              >
                {/* Only the peak carries its number; the readout below gives the rest. */}
                {b.value === max && <span className="mb-0.5 text-center font-mono text-[10px] font-semibold tabular-nums text-foreground">{fmt(b.value, view.unit)}</span>}
                <span
                  className="block w-full rounded-t-[4px] transition-[height,background-color] duration-300"
                  style={{ height: `${Math.max((b.value / max) * 100, b.value > 0 ? 2 : 0)}%`, maxHeight: 'calc(100% - 14px)', background: hover === i ? 'var(--tab)' : 'var(--ink)' }}
                />
              </li>
            ))}
          </ol>
        )}
        {view.layout === 'columns' && (
          <div className="mt-1 flex justify-between border-t border-border pt-1 font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
            <span>{view.bars[0]?.label}</span>
            <span>{view.bars[Math.floor(view.bars.length / 2)]?.label}</span>
            <span>{view.bars[view.bars.length - 1]?.label}</span>
          </div>
        )}

        <p className="mt-2.5 min-h-[18px] border-t border-border/70 pt-1.5 font-ui text-[12px] text-muted-foreground" aria-live="polite">
          {focus ? (
            <>
              <span className="font-semibold text-foreground">{view.layout === 'columns' ? `Week of ${focus.label}` : focus.label}:</span>{' '}
              {view.unit === 'usd' ? `${usd(focus.value)} across ${closes(focus.count)}` : closes(focus.count)}
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">{view.unit === 'usd' ? usd(total) : closes(total)}</span>
              {view.unit === 'usd' ? ` across ${closes(totalCount)}` : ''} · as reported
            </>
          )}
        </p>
        <Link href={href} className="mt-1 inline-block font-ui text-[12px] font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline">
          Full league tables →
        </Link>
      </div>
    </section>
  )
}
