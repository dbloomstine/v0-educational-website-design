import Link from 'next/link'
import { OUTBOUND } from '@/components/story/StoryLink'
import { LEAGUE_ASSET_LABEL as ASSET_LABEL, STAGE_LABEL, type FundClose } from '@/lib/news/league'
import { sizeLabel } from '@/lib/news/format'
import { storyPath } from '@/lib/news/story-path'

// One row of a league table, shared by /league-tables and its market pages (/league-tables/<market>).

const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export function LeagueTableHead() {
  return (
    <thead>
      <tr className="border-b border-border font-ui text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        <th scope="col" className="w-9 py-2 pl-3.5 pr-1 font-bold">#</th>
        <th scope="col" className="px-2 py-2 font-bold">Manager and fund</th>
        <th scope="col" className="px-2 py-2 text-right font-bold">Size</th>
        <th scope="col" className="hidden px-2 py-2 font-bold md:table-cell">Market</th>
        <th scope="col" className="hidden px-2 py-2 font-bold sm:table-cell">Reported</th>
        <th scope="col" className="py-2 pl-2 pr-3.5 font-bold">Source</th>
      </tr>
    </thead>
  )
}

export function LeagueRow({ c, rank, showStage }: { c: FundClose; rank: number; showStage: boolean }) {
  return (
    <tr className="border-b border-border/70 align-baseline last:border-0 hover:bg-background">
      <td className="py-2 pl-3.5 pr-1 font-mono text-[11px] tabular-nums text-muted-foreground">{rank}</td>
      <td className="px-2 py-2">
        <Link prefetch={false} href={`/firm/${c.firmSlug}`} className="hl font-news text-[16px] font-bold leading-tight text-foreground">
          {c.firm}
        </Link>
        <span className="block font-ui text-[12px] leading-snug text-muted-foreground">
          {/* The fund's name opens our page for the close; the source cell is the citation and stays out. */}
          {c.fund && <Link prefetch={false} href={storyPath(c)} className="hl text-foreground/80">{c.fund}</Link>}
          {c.fund && showStage && ' · '}
          {showStage && STAGE_LABEL[c.stage]}
          {!c.fund && !showStage && 'Fund not named in the reports'}
        </span>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-[14px] font-bold tabular-nums text-foreground">
        {c.converted && <span className="font-normal text-muted-foreground" title="Reported in another currency; converted to dollars">≈</span>}
        {sizeLabel(c.sizeUsdM)}
        {c.altSizeUsdM && <span className="font-normal text-muted-foreground" title={`Reports also give ${sizeLabel(c.altSizeUsdM)}`}>†</span>}
      </td>
      <td className="hidden whitespace-nowrap px-2 py-2 font-ui text-[12.5px] text-foreground/80 md:table-cell">{c.assetClass ? ASSET_LABEL[c.assetClass] ?? '—' : '—'}</td>
      <td className="hidden whitespace-nowrap px-2 py-2 font-mono text-[11px] uppercase tracking-tight text-muted-foreground sm:table-cell">{day(c.date)}</td>
      <td className="py-2 pl-2 pr-3.5 font-ui text-[12.5px]">
        <a href={c.url} {...OUTBOUND} title={c.headline} className="font-semibold text-foreground underline decoration-foreground/25 underline-offset-2 hover:decoration-foreground">
          {c.source ?? 'Report'}
        </a>
        {c.sources > 1 && (
          <Link prefetch={false} href={storyPath(c)} className="block whitespace-nowrap text-[11.5px] text-muted-foreground hover:text-foreground hover:underline">
            {c.sources} sources
          </Link>
        )}
      </td>
    </tr>
  )
}
