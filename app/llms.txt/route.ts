import { SECTIONS, sectionHref } from '@/lib/news/sections'
import { LEAGUE_MARKETS } from '@/lib/news/league-markets'
import { SOCIAL } from '@/lib/brand/social'
import { DIRECTORY_PATH, LIVE_CATEGORIES, directoryEnabled } from '@/lib/directory/taxonomy'

/**
 * /llms.txt (2026-10-22, the seo-ai-visibility skill's audit): a plain-language description of the site at its root, for
 * AI assistants and other machines that read it. A young convention, not a standard. Facts only, and only ones the
 * site states elsewhere; the lists come from the site's own section and market lists, so they stay current. No
 * instructions to any assistant (that is the manipulation the convention must never become).
 */
export const revalidate = 86400

const SITE = 'https://fundopshq.com'

export function GET() {
  const sections = SECTIONS.map((s) => `- ${s.title}: ${SITE}${sectionHref(s.slug)}`).join('\n')
  const markets = LEAGUE_MARKETS.map((m) => `- Largest ${m.name} fund closes this year: ${SITE}/league-tables/${m.slug}`).join('\n')
  // The directory (2026-10-24 night), only while it is switched on.
  const directory = directoryEnabled()
    ? `\n## Directory\nA free directory of the US professionals who work on private funds, each profile drawn from the firm's own\npublic bio page and linked to it. Listed in surname order; nobody pays to be listed or to rank: ${SITE}${DIRECTORY_PATH}\n${LIVE_CATEGORIES.map((c) => `- ${c.plural}: ${SITE}/${c.slug}`).join('\n')}\n`
    : ''
  const social = SOCIAL.map((s) => `- ${s.name}: ${s.href}`).join('\n')
  const body = `# FundOpsHQ

> Daily news on private markets for GPs, LPs and fund service providers: fund closes and launches, deals,
> LP commitments, people moves, regulation and service-provider news, one line per story with links to every
> outlet that reported it. Free. North America first.

## What it publishes
- The news feed, updated through the day: ${SITE}/news
- FundOps Daily, a free email every morning by 7:30am ET: the top stories, the day's biggest fund closes, deals and hires, ranked, and every section. Sign up: ${SITE}/join
- League tables of the largest private fund closes, ranked by size, each row linked to its report: ${SITE}/league-tables
- A page for each fund manager in the news, with its reported closes: ${SITE}/firms
- An events calendar for private markets in North America, every date checked at the organizer: ${SITE}/events
- A glossary of fund terms: ${SITE}/glossary
- An archive of past stories by month: ${SITE}/archive

## Sections
${sections}
${directory}
## League tables by market
${markets}

## How stories are made
Stories are gathered from publishers' feeds and press releases, grouped when several outlets report the same news,
and summarized in a line. Each story links to the original reports. Fund sizes are as reported; a figure in another
currency is converted to dollars and marked as converted.

## Contact and more
- About FundOpsHQ and how to reach the editor: ${SITE}/about
- Send news (a fund close, launch, hire or deal): ${SITE}/submit
- Sponsor FundOps Daily: ${SITE}/sponsor
${social}
- Sitemap: ${SITE}/sitemap.xml
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
