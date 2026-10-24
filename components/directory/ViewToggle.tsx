import Link from 'next/link'
import { List, Table2 } from 'lucide-react'

/**
 * "List / Table" (2026-10-24): the same people as the page's own list, or in the explorer's table
 * (/<trade>/explore, components/directory/explore/Explorer.tsx) with the page's filters carried over. Two links, so
 * it works without JavaScript and a reader can open either in a new tab.
 */
export function ViewToggle({ listHref, tableHref, current, className = '' }: { listHref: string; tableHref: string; current: 'list' | 'table'; className?: string }) {
  const item = (on: boolean) =>
    `inline-flex h-9 items-center gap-1.5 px-3 font-ui text-[13px] font-semibold ${on ? 'bg-foreground text-background' : 'bg-card text-foreground hover:bg-foreground/[0.06]'}`
  return (
    <nav aria-label="View" className={`inline-flex overflow-hidden rounded-[3px] border border-foreground/40 ${className}`}>
      <Link prefetch={false} href={listHref} aria-current={current === 'list' ? 'page' : undefined} className={item(current === 'list')}>
        <List className="h-4 w-4" aria-hidden="true" />
        List
      </Link>
      <Link prefetch={false} href={tableHref} aria-current={current === 'table' ? 'page' : undefined} className={`${item(current === 'table')} border-l border-foreground/40`} rel="nofollow">
        <Table2 className="h-4 w-4" aria-hidden="true" />
        Table
      </Link>
    </nav>
  )
}
