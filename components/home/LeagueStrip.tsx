import Link from 'next/link'
import { sizeLabel, totalLabel } from '@/lib/news/format'
import { firmHref, STAGE_LABEL, type FundClose } from '@/lib/news/league'
import { storyPath } from '@/lib/news/story-path'

/**
 * "Biggest raises": the league table, five rows deep, at the top of the front
 * page. Danny, 2026-10-14: "League table up top" — it is data only this site
 * has, and the social posts built on it out-view story cards about four to one.
 *
 * The rows are league closes (lib/news/league.ts biggestRaises → weekCloses),
 * so every figure is the one /league-tables, the rail chart and the Monday
 * email print. On a desk it is one row across the page, the figures set large
 * with a bar for each one's size against the first; on a phone it is a ranked
 * list that sits under the lead story, so the lead still opens the page.
 *
 * Each row has three ways in: the figure and the fund open the close's own
 * page (summary, every outlet, the way on); the firm opens the firm's page.
 */
export function LeagueStrip({
  raises,
  className = '',
}: {
  raises: { rows: FundClose[]; days: 7 | 30; finals: number; capitalUsdM: number }
  className?: string
}) {
  const { rows, days, finals, capitalUsdM } = raises
  if (rows.length < 3) return null
  const top = rows[0].sizeUsdM
  const period = days === 7 ? 'Past 7 days' : 'Past 30 days'
  const total =
    finals > 0 ? (
      <>
        <span className="font-semibold">{totalLabel(capitalUsdM)}</span> in {finals} final {finals === 1 ? 'close' : 'closes'}
      </>
    ) : null

  return (
    <section aria-label="Biggest raises" className={`league-strip ${className}`}>
      <div className="ls-head">
        <div className="ls-title">
          <h2 className="font-ui text-[11.5px] font-extrabold uppercase tracking-[0.13em]">
            <Link href="/league-tables" className="hover:underline">Biggest raises</Link>
          </h2>
          <span className="ls-note font-ui text-[11px]">{period}</span>
        </div>
        <div className="ls-foot-desk">
          {total && <p className="font-ui text-[12px] leading-snug">{total}</p>}
          <Link href="/league-tables" className="mt-1.5 inline-block font-ui text-[12px] font-semibold underline-offset-2 hover:underline">
            Full league table →
          </Link>
        </div>
      </div>

      <ol className="ls-list">
        {rows.map((c, i) => {
          const href = firmHref(c.firm)
          return (
            <li key={c.id} className="ls-row">
              <span className="ls-rank font-mono text-[10.5px] text-muted-foreground">{i + 1}</span>
              <span className="ls-stage font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">{STAGE_LABEL[c.stage]}</span>
              <Link
                href={storyPath(c)}
                prefetch={false}
                title={c.headline}
                className="ls-amt whitespace-nowrap font-mono font-bold tabular-nums leading-none text-foreground hover:underline"
              >
                {c.converted && <span className="font-normal text-muted-foreground" title="Reported in another currency; converted to dollars">≈</span>}
                {sizeLabel(c.sizeUsdM)}
                {c.altSizeUsdM && <span className="font-normal text-muted-foreground" title={`Reports also give ${sizeLabel(c.altSizeUsdM)}`}>†</span>}
              </Link>
              <span className="ls-bar" aria-hidden="true">
                <span style={{ width: `${Math.max(4, Math.round((c.sizeUsdM / top) * 100))}%` }} />
              </span>
              {href ? (
                <Link
                  href={href}
                  prefetch={false}
                  title={`${c.firm}: every story and fund close`}
                  className="ls-firm truncate font-news text-[15.5px] font-bold leading-tight text-foreground underline-offset-[3px] hover:underline"
                >
                  {c.firm}
                </Link>
              ) : (
                <span className="ls-firm truncate font-news text-[15.5px] font-bold leading-tight text-foreground">{c.firm}</span>
              )}
              <Link
                href={storyPath(c)}
                prefetch={false}
                tabIndex={-1}
                title={c.headline}
                className="ls-fund truncate font-ui text-[11.5px] text-muted-foreground hover:text-foreground hover:underline"
              >
                {c.fund ?? 'The close'}
              </Link>
            </li>
          )
        })}
      </ol>

      <div className="ls-foot-phone flex items-baseline justify-between gap-3 font-ui text-[12px] text-muted-foreground">
        <span>{total}</span>
        <Link href="/league-tables" className="font-semibold text-foreground/70 underline-offset-2 hover:text-foreground hover:underline">
          Full league table →
        </Link>
      </div>
    </section>
  )
}
