import Link from 'next/link'
import type { FirmEntry } from '@/lib/news/firms'

/**
 * Firms in the news — one still line of names across the top of the front
 * page, each to the firm's own page. Bold serif, because on this site a bold
 * serif name is a firm. It is the way into firm pages for a reader who has
 * not gone looking for one.
 */
export function InTheNews({ firms }: { firms: FirmEntry[] }) {
  if (firms.length < 4) return null
  return (
    <nav aria-label="Firms in the news" className="tab-scroll mb-4 flex items-baseline gap-x-5 overflow-x-auto border-b border-border pb-2.5">
      <span className="flex shrink-0 items-center gap-2 font-ui text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-foreground">
        <span className="h-[11px] w-[4px]" style={{ background: 'var(--tab)' }} aria-hidden="true" />
        Firms in the news
      </span>
      {firms.map((f) => (
        <Link
          prefetch={false}
          key={f.slug}
          href={`/firm/${f.slug}`}
          title={`${f.name}: every story and fund close`}
          className="shrink-0 whitespace-nowrap font-news text-[15.5px] font-bold leading-none text-foreground underline-offset-[3px] hover:underline"
        >
          {f.shortName}
        </Link>
      ))}
      <Link href="/firms" className="ml-auto shrink-0 whitespace-nowrap pl-3 font-ui text-[12px] font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline">
        All firms →
      </Link>
    </nav>
  )
}
