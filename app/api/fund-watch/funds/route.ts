import { NextRequest, NextResponse } from 'next/server'
import { getFundDirectoryData } from '@/lib/content/fund-watch-loader'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Query parameters
    const category = searchParams.get('category')
    const stage = searchParams.get('stage')
    const firm = searchParams.get('firm')
    const since = searchParams.get('since') // Date filter: YYYY-MM-DD
    const covered = searchParams.get('covered') // 'true' or 'false'
    const minAmount = searchParams.get('min_amount') // In millions
    const maxAmount = searchParams.get('max_amount') // In millions
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50),
      200
    )
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0)

    const data = await getFundDirectoryData()

    if (!data) {
      return NextResponse.json(
        { error: 'Fund directory data unavailable' },
        { status: 500 }
      )
    }

    let funds = data.funds

    // Apply filters
    if (category) {
      funds = funds.filter((f) => f.category === category)
    }

    if (stage) {
      funds = funds.filter((f) => f.stage.toLowerCase() === stage.toLowerCase())
    }

    if (firm) {
      const firmLower = firm.toLowerCase()
      funds = funds.filter((f) => f.firm.toLowerCase().includes(firmLower))
    }

    if (since) {
      funds = funds.filter((f) => f.announcement_date && f.announcement_date >= since)
    }

    if (covered !== null && covered !== undefined) {
      const isCovered = covered === 'true'
      funds = funds.filter((f) => f.is_covered === isCovered)
    }

    if (minAmount) {
      const min = parseFloat(minAmount)
      funds = funds.filter(
        (f) => f.amount_usd_millions !== null && f.amount_usd_millions >= min
      )
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount)
      funds = funds.filter(
        (f) => f.amount_usd_millions !== null && f.amount_usd_millions <= max
      )
    }

    // Pagination
    const totalCount = funds.length
    const paginatedFunds = funds.slice(offset, offset + limit)

    // Map to public API format (omit internal fields)
    const publicFunds = paginatedFunds.map((f) => ({
      fund_name: f.fund_name,
      firm: f.firm,
      firm_slug: f.firm_slug,
      firm_website: f.firm_website,
      amount: f.amount,
      amount_usd_millions: f.amount_usd_millions,
      category: f.category,
      location: f.location,
      city: f.city,
      country: f.country,
      stage: f.stage,
      announcement_date: f.announcement_date,
      source_url: f.source_url,
      source_name: f.source_name,
      is_covered: f.is_covered,
      articles: f.articles.map((a) => ({
        title: a.title,
        url: a.url,
        source_name: a.source_name,
        published_date: a.published_date,
      })),
    }))

    return NextResponse.json(
      {
        generated_at: data.generated_at,
        total_count: totalCount,
        offset,
        limit,
        funds: publicFunds,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('[Funds API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
