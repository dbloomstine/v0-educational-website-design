import { articles } from '@/lib/content/articles'
import { getFundType } from '@/lib/content/fund-types'

const baseUrl = 'https://fundops.com'

export async function GET() {
  // Get all articles sorted by date (newest first)
  const allArticles = Object.values(articles)
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, 50) // Limit to 50 most recent

  const rssItems = allArticles.map(article => {
    const fundType = getFundType(article.fundType)
    const articleUrl = `${baseUrl}/funds/${article.fundType}/${article.pillar}`
    const pubDate = new Date(article.publishedDate).toUTCString()

    return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <description><![CDATA[${article.subtitle}]]></description>
      <category>${fundType?.name || article.fundType}</category>
      <pubDate>${pubDate}</pubDate>
      <author>danny@fundops.com (Danny Bloomstine)</author>
    </item>`
  }).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>FundOpsHQ - Fund Operations Resources</title>
    <link>${baseUrl}</link>
    <description>Educational resources and guides for fund operations professionals covering Private Equity, Venture Capital, Hedge Funds, Private Credit, Real Estate, Infrastructure, Secondaries, and GP Stakes.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/icon.svg</url>
      <title>FundOpsHQ</title>
      <link>${baseUrl}</link>
    </image>
    <managingEditor>danny@fundops.com (Danny Bloomstine)</managingEditor>
    <webMaster>danny@fundops.com (Danny Bloomstine)</webMaster>
    <copyright>Copyright ${new Date().getFullYear()} FundOpsHQ. All rights reserved.</copyright>
    <ttl>60</ttl>
    ${rssItems}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
