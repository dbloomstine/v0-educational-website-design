import Link from 'next/link'

/**
 * The directory's page heads, one hierarchy everywhere (2026-10-24, design pass): the front page, a trade's hub, a
 * landing page, a firm ranking, a firm and the methodology page all set their H1 the same, and say what the page holds
 * in a serif lede under it. Before this the H1 ran 30, 32, 38, 40 and 42 pixels on six templates.
 */

/** The H1 on every directory page. */
export const DIR_H1 = 'font-news text-[32px] font-medium leading-[1.04] tracking-[-0.02em] text-foreground sm:text-[42px]'

/** The serif line under it. */
export const DIR_LEDE = 'font-news text-[17px] leading-snug text-foreground/80 sm:text-[18px]'

/**
 * Ready-made searches as plain links (Zocdoc's "popular searches", Crunchbase's saved searches): crawlable, one tap
 * each, with how many each holds. A row of quiet pills; never a section of one.
 */
export function PopularLinks({ items, label = 'Popular', className = '' }: { items: { path: string; title: string; count: number }[]; label?: string; className?: string }) {
  if (items.length < 2) return null
  return (
    <nav aria-label={`${label} searches`} className={`flex flex-wrap items-baseline gap-x-2 gap-y-2 ${className}`}>
      <span className="mr-1 font-ui text-[13px] font-semibold text-foreground/70">{label}:</span>
      {items.map((x, i) => (
        <Link
          key={x.path}
          prefetch={false}
          href={x.path}
          className={`${i >= 4 ? 'max-sm:hidden ' : ''}inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-foreground/20 bg-card/70 px-3 font-ui text-[13px] text-foreground hover:border-foreground/60 hover:bg-card`}
        >
          {x.title}
          <span className="tabular-nums text-foreground/55">{x.count.toLocaleString('en-US')}</span>
        </Link>
      ))}
    </nav>
  )
}

export interface TrustFact {
  title: string
  body: React.ReactNode
}

/** Why a reader can trust the lists: four plain facts in a ruled row (Zocdoc's verified-reviews strip, in print). */
export function TrustStrip({ facts, className = '' }: { facts: TrustFact[]; className?: string }) {
  return (
    <dl className={`grid grid-cols-1 border-y border-foreground/20 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {facts.map((f, i) => (
        <div
          key={f.title}
          className={`min-w-0 py-3 sm:px-5 ${i > 0 ? 'max-sm:border-t max-sm:border-foreground/15' : ''} ${i % 2 === 1 ? 'sm:border-l sm:border-foreground/15' : 'sm:pl-0'} ${i >= 2 ? 'sm:max-lg:border-t sm:max-lg:border-foreground/15' : ''} ${i === 2 ? 'lg:border-l lg:border-foreground/15 lg:pl-5' : ''}`}
        >
          <dt className="font-ui text-[13.5px] font-bold text-foreground">{f.title}</dt>
          <dd className="mt-0.5 font-ui text-[13px] leading-snug text-foreground/75">{f.body}</dd>
        </div>
      ))}
    </dl>
  )
}
