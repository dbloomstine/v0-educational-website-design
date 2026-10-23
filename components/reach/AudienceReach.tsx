import { SectionFlag } from '@/components/story/StoryBlocks'
import { getReach } from '@/lib/reach'

/**
 * Who FundOpsHQ reaches, in plain lines: email readers, website traffic and
 * social video views, each with where the number comes from. Every figure is
 * computed (lib/reach); a line we cannot back up is not drawn, and with no
 * lines at all the block is not drawn.
 */
export async function AudienceReach({
  label = 'Who it reaches',
  className = 'mt-10',
  omitEmail = false,
}: {
  label?: string
  className?: string
  /** For a page that already shows the email figures. */
  omitEmail?: boolean
}) {
  const reach = await getReach().catch(() => null)
  const lines = (reach?.lines ?? []).filter((l) => !(omitEmail && l.key === 'email'))
  if (lines.length === 0) return null
  return (
    <section aria-label={label} className={className}>
      <SectionFlag label={label} />
      <dl>
        {lines.map((l) => (
          <div key={l.key} className="grid gap-x-6 border-b border-border/70 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline">
            <dt className="font-news text-[17px] leading-[1.4] text-foreground">{l.text}</dt>
            <dd className="font-ui text-[11.5px] leading-snug text-muted-foreground sm:text-right">{l.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
