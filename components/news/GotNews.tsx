import Link from 'next/link'
import { SUBMIT_NEWS_ASK, SUBMIT_NEWS_LINK, SUBMIT_NEWS_PATH } from '@/lib/submit/fields'
import { cn } from '@/lib/utils'

/** "Got news? Send us your fund close or hire →", to /submit: a quiet line on the /news pages and in the footer. */
export function GotNews({ className, linkClassName }: { className?: string; linkClassName?: string }) {
  return (
    <p className={cn('font-ui text-[12.5px] text-muted-foreground', className)}>
      {SUBMIT_NEWS_ASK}{' '}
      <Link
        href={SUBMIT_NEWS_PATH}
        prefetch={false}
        className={cn('font-semibold text-foreground/80 underline decoration-foreground/25 underline-offset-2 transition-colors hover:text-foreground', linkClassName)}
      >
        {SUBMIT_NEWS_LINK}&nbsp;&rarr;
      </Link>
    </p>
  )
}
