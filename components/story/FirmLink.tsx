import Link from 'next/link'
import type { FirmRef } from '@/lib/news/firms'

/**
 * A firm's name, linked to its page (2026-10-22). Beside a story, never inside
 * its headline: the headline is already the link to the story, and a link may
 * not hold another. Styled as the story page's "Firm" field has been since the
 * redesign — a faint underline that darkens on hover — so it reads as a way
 * into the site, where the outlet's arrow is the way out.
 *
 * prefetch={false}: firm pages are built on demand (lib/news/__tests__/links.test.ts).
 */
export function FirmLink({ firm, className = '' }: { firm: FirmRef; className?: string }) {
  return (
    <Link
      prefetch={false}
      href={firm.href}
      title={`Every story on ${firm.name}`}
      className={`underline decoration-foreground/25 underline-offset-[3px] hover:text-foreground hover:decoration-foreground ${className}`}
    >
      {firm.name}
    </Link>
  )
}
