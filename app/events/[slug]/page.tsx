import { Metadata } from 'next'
import { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CalendarPlus, MapPin, Ticket, Users } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { queryEventBySlug, queryEventFeed, queryOrganizerUpcoming, queryRelatedEvents } from '@/lib/events/api'
import { COLLECTION_BY_SLUG, EVENT_COLLECTIONS, collectionDescription, collectionTitle, groupEventsByMonth, type EventCollection } from '@/lib/events/collections'
import {
  EVENT_KIND_LABELS,
  EVENT_FORMAT_LABELS,
  EVENT_TOPIC_LABELS,
  costDetail,
  formatEventDates,
  formatEventLocation,
  isVerifiedFree,
  eventTimeZone,
  timeNoteWithZone,
} from '@/lib/events/constants'
import { googleCalendarUrl } from '@/lib/events/ics'
import { CATEGORY_LABELS } from '@/lib/news/constants'
import { cn } from '@/lib/utils'
import { breadcrumbJsonLd, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'
import { Panel } from '@/components/story/StoryBlocks'
import type { IndustryEvent } from '@/lib/events/types'
import { EventsSignup } from '@/components/events/EventsSignup'
import { InlineSignup } from '@/components/newsletter/InlineSignup'
import { eventsOfferHeadline } from '@/lib/events/offer'
import { eventSignupTags } from '@/lib/newsletter/interests'
import { mondayEmailLive } from '@/lib/events/weekly-mode'
import { MiniEventRow } from '@/components/events/MiniEventRow'
import { buildEventTitle, eventMetaDescription } from '@/lib/events/seo'
import { eventJsonLd, eventListJsonLd } from '@/lib/events/event-jsonld'
import { pickNextEdition } from '@/lib/events/similar'
import { isPastVirtualEvent } from '@/lib/events/webinars'

export const revalidate = 3600

export async function generateStaticParams() {
  // Collections are always prerendered; event pages render on demand (ISR)
  return EVENT_COLLECTIONS.map((c) => ({ slug: c.slug }))
}

/**
 * A collection page's events, read once per render (2026-10-22). The meta description now says how many are
 * upcoming, and React's cache hands generateMetadata and the page the same read, so the count costs no query.
 * A failed read is null: the page still renders, with the board link.
 */
const collectionFeed = cache(async (slug: string) => {
  const collection = COLLECTION_BY_SLUG.get(slug)
  if (!collection) return null
  try {
    return await queryEventFeed({ ...collection.filter, limit: 60 })
  } catch {
    return null
  }
})

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const collection = COLLECTION_BY_SLUG.get(slug)
  if (collection) {
    // What search results show: "Chicago Private Equity Events & Conferences 2026–27", the years from today's date.
    const title = collectionTitle(collection)
    const feed = await collectionFeed(slug)
    const description = collectionDescription(collection, feed?.total ?? null)
    return {
      title: { absolute: title },
      description,
      alternates: { canonical: `https://fundopshq.com/events/${slug}` },
      ...shareCard(title, description, `/events/${slug}`),
    }
  }
  const event = await queryEventBySlug(slug)
  if (!event) return { title: 'Event not found' }
  // Built to answer what people search an event by (2026-10-22): its name, city and year, then "date, venue,
  // cost" for whichever of those the page has (lib/events/seo.ts). Was "<name> — <dates> | FundOpsHQ Events".
  const title = buildEventTitle(event)
  // When, where and the checked cost first, then the organiser's words, cut to a search result's length.
  const description = eventMetaDescription(event)
  // A webinar that has happened stays up but out of search (2026-10-22; no recording link in the table yet).
  const today = new Date().toISOString().split('T')[0]
  return {
    title: { absolute: title },
    description,
    ...(isPastVirtualEvent(event, today) ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: `https://fundopshq.com/events/${slug}` },
    ...shareCard(title, description, `/events/${slug}`),
  }
}

export default async function EventOrCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const collection = COLLECTION_BY_SLUG.get(slug)
  if (collection) {
    return <CollectionPage collection={collection} />
  }
  const event = await queryEventBySlug(slug)
  if (!event) notFound()
  const today = new Date().toISOString().split('T')[0]
  const isPast = (event.endDate ?? event.startDate) < today
  // A past event's page stays up (people still search it); it points to the organizer's next one when there is one.
  const [related, organizerNext] = await Promise.all([
    queryRelatedEvents(event),
    isPast ? queryOrganizerUpcoming(event).catch(() => []) : Promise.resolve([]),
  ])
  const next = isPast ? pickNextEdition(event, organizerNext, today) : null
  return <EventDetailPage event={event} related={related} isPast={isPast} next={next} />
}

// ── Shared shell ──────────────────────────────────────────────────

// ── Collection landing page ───────────────────────────────────────

async function CollectionPage({ collection }: { collection: EventCollection }) {
  const feed = await collectionFeed(collection.slug)
  const events: IndustryEvent[] = feed?.events ?? []
  // A heading per month (2026-10-22): "November 2026" is how people plan, and what they search with.
  const months = groupEventsByMonth(events)
  const more = feed?.total != null && feed.total > events.length ? feed.total - events.length : 0

  const boardQs = new URLSearchParams(collection.boardParams).toString()

  // The first 25 as full Events, each pointing to its own page, built as the event page's is (2026-10-22: was links alone).
  const jsonLd = eventListJsonLd(collection.title, `https://fundopshq.com/events/${collection.slug}`, events.slice(0, 25))

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <div className="mx-auto max-w-[1100px] px-4 pb-5 pt-5 lg:px-6">
          <Link href="/events" className="mb-3 inline-flex items-center gap-1.5 font-ui text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> All events
          </Link>
          <h1 className="font-news text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[42px]">{collection.heading}</h1>
          <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">{collection.blurb}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href={`/events?${boardQs}`} className="font-ui text-[13px] font-bold text-foreground underline underline-offset-4 hover:no-underline">
              Filter and search this list →
            </Link>
            <a
              href={`/api/events/calendar?${boardQs}`}
              className="inline-flex items-center gap-1.5 font-ui text-[13px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Calendar feed
            </a>
          </div>
          </div>
        </div>
        <div className="mx-auto max-w-[1100px] px-4 pb-12 pt-6 lg:px-6">
          <EventsSignup city={collection.filter.city ?? null} monday={mondayEmailLive()} className="mb-6" />
          {events.length === 0 ? (
            <div className="panel overflow-hidden">
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                Nothing upcoming here right now — check the <Link href="/events" className="font-semibold text-foreground underline underline-offset-2 hover:no-underline">full board</Link>.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {months.map((m, i) => (
                // The last month's count is left off when the list stops partway through it.
                <Panel key={m.key} label={m.label} note={more > 0 && i === months.length - 1 ? undefined : m.events.length === 1 ? '1 event' : `${m.events.length} events`}>
                  <div className="-mx-[14px] -mb-[10px] -mt-1">
                    {m.events.map((e) => (
                      <MiniEventRow key={e.id} event={e} />
                    ))}
                  </div>
                </Panel>
              ))}
            </div>
          )}
          {more > 0 && (
            <p className="mt-4 font-ui text-[13px] text-muted-foreground">
              The next {events.length} of {feed!.total} upcoming.{' '}
              <Link href={`/events?${boardQs}`} className="font-semibold text-foreground underline underline-offset-2 hover:no-underline">
                See them all on the board →
              </Link>
            </p>
          )}

          <p className="mt-8 text-[12px] text-muted-foreground">
            Know an event that belongs here?{' '}
            <Link href="/events/submit" className="font-semibold text-foreground/80 underline underline-offset-2 hover:no-underline">Submit it</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

// ── Event detail page ─────────────────────────────────────────────

function EventDetailPage({
  event,
  related,
  isPast,
  next,
}: {
  event: IndustryEvent
  related: IndustryEvent[]
  isPast: boolean
  next: { event: IndustryEvent; edition: boolean } | null
}) {
  const kind = EVENT_KIND_LABELS[event.eventKind] ?? EVENT_KIND_LABELS.other
  // Said only where we saw it (2026-10-15): no Cost line at all rather than a guess.
  const cost = costDetail(event)
  const dates = formatEventDates(event.startDate, event.endDate)
  const offerCity = event.eventFormat === 'virtual' ? null : event.city
  const monday = mondayEmailLive()
  const location = formatEventLocation(event)
  // schema.org Event for Google's event results (lib/events/event-jsonld.ts): the time and zone when the note
  // states them, end date, place, image, organizer and its site, status, and the price only where we checked it.
  const jsonLd = eventJsonLd(event)
  const isCancelled = event.status === 'cancelled'
  // Front page → Events → this event, as the "All events" link above the name reads.
  const breadcrumbs = breadcrumbJsonLd([{ name: 'Events', path: '/events' }, { name: event.name }])

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <div className="mx-auto max-w-[1100px] px-4 pb-5 pt-5 lg:px-6">
          <Link href="/events" className="mb-3 inline-flex items-center gap-1.5 font-ui text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> All events
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium', kind.color)}>{kind.label}</span>
            {event.topics.map((t) => (
              <span key={t} className="inline-flex rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {EVENT_TOPIC_LABELS[t] ?? t}
              </span>
            ))}
            {event.fundCategories.map((c) => (
              <span key={c} className={cn('inline-flex rounded px-2 py-0.5 text-[11px] font-medium', CATEGORY_LABELS[c]?.color ?? 'bg-muted text-muted-foreground')}>
                {CATEGORY_LABELS[c]?.label ?? c}
              </span>
            ))}
          </div>

          <h1 className="mt-3 font-news text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[42px]">{event.name}</h1>
          <p className="mt-1.5 font-news text-[17px] text-foreground/70">by {event.organizerName}</p>

          {/* Said on the page as in the markup (2026-10-22): a cancelled event's page stays up, marked. */}
          {isCancelled && (
            <p className="mt-4 max-w-[72ch] border-l-[3px] border-[var(--tab)] bg-card px-3 py-2 font-ui text-[13.5px] leading-snug text-foreground">
              <strong className="font-bold">This event has been cancelled.</strong> Check the organizer&apos;s site for any new date.
            </p>
          )}

          {isPast && !isCancelled && (
            <p className="mt-4 max-w-[72ch] border-l-[3px] border-[var(--tab)] bg-card px-3 py-2 font-ui text-[13.5px] leading-snug text-foreground">
              <strong className="font-bold">This event has passed.</strong>{' '}
              {next ? (
                <>
                  {next.edition ? 'The next edition: ' : `Next from ${event.organizerName}: `}
                  <Link prefetch={false} href={`/events/${next.event.slug}`} className="font-semibold underline underline-offset-2 hover:no-underline">
                    {next.event.name}
                  </Link>
                  , {formatEventDates(next.event.startDate, next.event.endDate)}
                  {next.event.city && next.event.eventFormat !== 'virtual' ? `, ${next.event.city}` : ''}.
                </>
              ) : (
                <>
                  See what is coming up on the{' '}
                  <Link href="/events" className="font-semibold underline underline-offset-2 hover:no-underline">
                    events board
                  </Link>
                  .
                </>
              )}
            </p>
          )}

          </div>
        </div>
        <div className="mx-auto max-w-[1100px] px-4 pb-12 pt-6 lg:px-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="panel panel-lead lg:col-span-2 space-y-6">
              {event.description && (
                <p className="max-w-[68ch] font-news text-[18px] leading-[1.45] text-foreground/85">{event.description}</p>
              )}

              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 max-w-2xl">
                <div>
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">When</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {dates}
                    {event.timeNote && <span className="text-muted-foreground"> · {timeNoteWithZone(event.timeNote, eventTimeZone(event))}</span>}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Where</dt>
                  <dd className="mt-1 flex items-start gap-1.5 text-sm text-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>
                      {event.venue ? `${event.venue}, ${location}` : location}
                      {event.eventFormat !== 'in_person' && (
                        <span className="text-muted-foreground"> · {EVENT_FORMAT_LABELS[event.eventFormat]}</span>
                      )}
                    </span>
                  </dd>
                </div>
                {cost && (
                  <div>
                    <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Cost</dt>
                    <dd className={cn('mt-1 flex items-start gap-1.5 text-sm', isVerifiedFree(event) ? 'text-emerald-700' : 'text-foreground')}>
                      <Ticket className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span>{cost}</span>
                    </dd>
                  </div>
                )}
                {event.expectedAttendance && (
                  <div>
                    <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Expected Attendance</dt>
                    <dd className="mt-1 flex items-start gap-1.5 text-sm text-foreground">
                      <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span>{event.expectedAttendance.toLocaleString()}+</span>
                    </dd>
                  </div>
                )}
              </dl>

              {/* The offer, right under the date and venue (2026-10-22; until then a block below the details): the
                  reader came for this event, the next ones are a field away. One ask on the page. The wrapper is
                  rendered on the server so the signup box and the welcome screen know the city even for a subscriber. */}
              <div data-signup-events={offerCity ?? ''} data-signup-events-monday={monday ? '1' : '0'}>
                <InlineSignup form="inline-event" line={eventsOfferHeadline(offerCity, { monday })} button="Get them" interests={eventSignupTags(offerCity)} />
              </div>
            </div>

            <div className="panel panel-pad space-y-3 self-start">
              <a
                href={event.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90"
              >
                Visit Event Site
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={googleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-sm border border-foreground/20 px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-amber-400/60 hover:text-amber-300"
                >
                  <CalendarPlus className="h-3 w-3" /> Google Cal
                </a>
                <a
                  href={`/api/events/calendar?slug=${event.slug}`}
                  className="flex items-center justify-center gap-1.5 rounded-sm border border-foreground/20 px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-amber-400/60 hover:text-amber-300"
                >
                  <CalendarPlus className="h-3 w-3" /> .ics
                </a>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Date verified at the organizer&apos;s site by FundOpsHQ. Registration and pricing are handled by the organizer.
              </p>
            </div>
          </div>


          {related.length > 0 && (
            <div className="mt-6">
              <Panel label="Similar events" note="Upcoming">
                <div className="-mx-[14px] -mb-[10px] -mt-1">
                  {related.map((e) => (
                    <MiniEventRow key={e.id} event={e} />
                  ))}
                </div>
              </Panel>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
