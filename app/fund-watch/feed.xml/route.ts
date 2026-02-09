import { getFundDirectoryData } from '@/lib/content/fund-watch-loader'

export const dynamic = 'force-dynamic'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatAmount(amount: string | null, millions: number | null): string {
  if (millions === null || millions === 0) return 'Undisclosed'
  if (millions >= 1000) {
    const billions = millions / 1000
    return `$${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)}B`
  }
  return `$${millions.toFixed(0)}M`
}

export async function GET() {
  try {
    const data = await getFundDirectoryData()

    if (!data) {
      return new Response('Fund data unavailable', { status: 500 })
    }

    // Get the 50 most recent funds
    const recentFunds = data.funds.slice(0, 50)

    const baseUrl = 'https://fundopshq.com'
    const now = new Date().toUTCString()

    const items = recentFunds
      .map((fund) => {
        const amountStr = formatAmount(fund.amount, fund.amount_usd_millions)
        const title = `${fund.fund_name} (${amountStr}) - ${fund.firm}`
        const description = `${fund.category} | ${fund.stage} | ${fund.location || 'N/A'}. ${fund.description_notes || ''}`
        const pubDate = fund.announcement_date
          ? new Date(fund.announcement_date + 'T12:00:00Z').toUTCString()
          : now

        const fundUrl = fund.firm_slug
          ? `${baseUrl}/fund-watch/managers/${fund.firm_slug}`
          : fund.source_url

        return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(fundUrl)}</link>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${escapeXml(`fund-${fund.firm_slug}-${fund.fund_name}`)}</guid>
      <category>${escapeXml(fund.category)}</category>
    </item>`
      })
      .join('\n')

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Fund Watch - FundOpsHQ</title>
    <link>${baseUrl}/fund-watch</link>
    <description>Track private equity, venture capital, credit, and alternative fund closes and launches worldwide.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/fund-watch/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>Fund Watch - FundOpsHQ</title>
      <link>${baseUrl}/fund-watch</link>
    </image>
${items}
  </channel>
</rss>`

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('[RSS Feed] Error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
