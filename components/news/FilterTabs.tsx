import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The cut within a page: a row of plain text tabs, the chosen one underlined.
 *
 * These were pills with a count in each ("Venture 33"). Danny, 2026-10-01:
 * "only that amount of stories in the filter? over what period of time?… it
 * seems weird." A bare number beside a filter reads as an inventory with no
 * time frame, so the counts are gone; the list's own heading still says how
 * many stories it holds and over how long.
 */
export function FilterTabs({
  items,
  label,
  ariaLabel,
  className,
}: {
  items: { href: string; label: string; active: boolean }[]
  /** Small caption before the row, for pages with more than one row. */
  label?: string
  ariaLabel: string
  className?: string
}) {
  return (
    <nav aria-label={ariaLabel} className={cn('tab-scroll flex items-stretch gap-x-5 overflow-x-auto', className)}>
      {label && (
        <span className="flex w-[52px] shrink-0 items-center font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
      )}
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          scroll={false}
          aria-current={item.active ? 'true' : undefined}
          className={cn(
            '-mb-px shrink-0 whitespace-nowrap border-b-[3px] pb-2 pt-2 font-ui text-[13.5px] transition-colors',
            item.active
              ? 'border-foreground font-bold text-foreground'
              : 'border-transparent font-medium text-foreground/60 hover:border-foreground/25 hover:text-foreground',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
