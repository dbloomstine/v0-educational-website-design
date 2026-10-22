import Link from 'next/link'
import { SUBMIT_NEWS_ASK, SUBMIT_NEWS_LINK, SUBMIT_NEWS_PATH } from '@/lib/submit/fields'
import { cn } from '@/lib/utils'

/**
 * "Got news? Send us your news →", to /submit: a quiet line in the footer and
 * on the /news pages. A firm page passes its own ask ("Is this your firm?")
 * and an href with ?firm= so the form opens with the name filled in.
 */
export function GotNews({
  className,
  linkClassName,
  ask = SUBMIT_NEWS_ASK,
  href = SUBMIT_NEWS_PATH,
}: {
  className?: string
  linkClassName?: string
  ask?: string
  href?: string
}) {
  return (
    <p className={cn('font-ui text-[12.5px] text-muted-foreground', className)}>
      {ask}{' '}
      <Link
        href={href}
        prefetch={false}
        // A ?firm= address is one page per firm; crawlers need only /submit.
        rel={href.includes('?') ? 'nofollow' : undefined}
        className={cn('font-semibold text-foreground/80 underline decoration-foreground/25 underline-offset-2 transition-colors hover:text-foreground', linkClassName)}
      >
        {SUBMIT_NEWS_LINK}&nbsp;&rarr;
      </Link>
    </p>
  )
}
