import { queryEventFeed, queryEventBySlug } from '@/lib/events/api'
import { buildIcsCalendar } from '@/lib/events/ics'

export const dynamic = 'force-dynamic'

// iCalendar feed. Two modes:
//   ?slug=<event-slug>  → single-event .ics download (detail pages)
//   ?city=&topic=&kind=&cost=&format=&ops=  → subscribable filtered feed;
//     users add webcal://fundopshq.com/api/events/calendar?... to Outlook/
//     Google/Apple Calendar and the board lives inside their calendar.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const params = url.searchParams

  try {
    const slug = params.get('slug')
    if (slug) {
      const event = await queryEventBySlug(slug)
      if (!event) {
        return new Response('Not found', { status: 404 })
      }
      return icsResponse(buildIcsCalendar([event], 'FundOpsHQ Event'), `${slug}.ics`)
    }

    const result = await queryEventFeed({
      when: params.get('when') || undefined,
      kind: params.get('kind') || undefined,
      format: params.get('format') || undefined,
      cost: params.get('cost') || undefined,
      category: params.get('category') || undefined,
      topic: params.get('topic') || undefined,
      city: params.get('city') || undefined,
      region: params.get('region') || undefined,
      ops: params.get('ops') || undefined,
      limit: 200,
    })

    const nameParts = ['FundOpsHQ Events']
    if (params.get('city')) nameParts.push(params.get('city')!)
    if (params.get('topic')) nameParts.push(params.get('topic')!.replace(/_/g, ' '))
    if (params.get('cost') === 'free') nameParts.push('free')

    return icsResponse(buildIcsCalendar(result.events, nameParts.join(' — ')), 'fundopshq-events.ics')
  } catch {
    return new Response('Failed to build calendar', { status: 500 })
  }
}

function icsResponse(body: string, filename: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
