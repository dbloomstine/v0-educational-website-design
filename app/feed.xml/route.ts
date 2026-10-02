import { loadStories } from '@/lib/news/front-page'
import { KIND_LABEL } from '@/lib/news/sections'

// RSS for people who read news in a reader. Each item is a story — one event,
// however many outlets reported it — and links to our page for it, which
// carries the summary and every publisher's report.

export const revalidate = 900

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET() {
  const stories = (await loadStories())
    .filter((s) => !s.roundup)
    .sort((a, b) => b.firstSeen.localeCompare(a.firstSeen))
    .slice(0, 60)

  const items = stories
    .map((s) => {
      const outlets = [s.source, ...s.coverage.map((c) => c.source)].filter(Boolean)
      const via = outlets.length > 1 ? `${outlets[0]} and ${outlets.length - 1} other${outlets.length > 2 ? 's' : ''}` : outlets[0]
      const description = [s.summary, via ? `Reported by ${via}.` : null].filter(Boolean).join(' ')
      return `    <item>
      <title>${esc(s.headline)}</title>
      <link>https://fundopshq.com/story/${s.id}</link>
      <guid isPermaLink="true">https://fundopshq.com/story/${s.id}</guid>
      <pubDate>${new Date(s.firstSeen).toUTCString()}</pubDate>
      <category>${esc(KIND_LABEL[s.kind])}</category>
      <description>${esc(description)}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FundOpsHQ</title>
    <link>https://fundopshq.com</link>
    <atom:link href="https://fundopshq.com/feed.xml" rel="self" type="application/rss+xml" />
    <description>Fund closes, launches, deals and moves across private markets — for GPs, LPs and fund service providers.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=900' } })
}
