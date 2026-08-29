import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CalendarPlus, MapPin, Ticket, Users } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { queryEventBySlug, queryEventFeed, queryRelatedEvents } from '@/lib/events/api'
import { COLLECTION_BY_SLUG, EVENT_COLLECTIONS, type EventCollection } from '@/lib/events/collections'
import {
  EVENT_KIND_LABELS,
  EVENT_FORMAT_LABELS,
  EVENT_TOPIC_LABELS,
  COST_LABELS,
  formatEventDates,
  formatEventLocation,
} from '@/lib/events/constants'
import { googleCalendarUrl } from '@/lib/events/ics'
import { CATEGORY_LABELS } from '@/lib/news/constants'
import { cn } from '@/lib/utils'
import type { IndustryEvent } from '@/lib/events/types'

export const revalidate = 3600

export async function generateStaticParams() {
  // Collections are always prerendered; event pages render on demand (ISR)
  return EVENT_COLLECTIONS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const collection = COLLECTION_BY_SLUG.get(slug)
  if (collection) {
    const title = `${collection.title} | FundOpsHQ`
    return {
      title,
      description: collection.blurb,
      alternates: { canonical: `https://fundopshq.com/events/${slug}` },
      openGraph: { title, description: collection.blurb, type: 'website', url: `https://fundopshq.com/events/${slug}` },
    }
  }
  const event = await queryEventBySlug(slug)
  if (!event) return { title: 'Event Not Found | FundOpsHQ' }
  const dates = formatEventDates(event.startDate, event.endDate)
  const title = `${event.name} — ${dates} | FundOpsHQ Events`
  const description = event.description
    ? event.description.slice(0, 300)
    : `${event.name} by ${event.organizerName}, ${dates}${event.city ? ` in ${event.city}` : ''}. Dates verified by FundOpsHQ.`
  return {
    title,
    description,
    alternates: { canonical: `https://fundopshq.com/events/${slug}` },
    openGraph: { title, description, type: 'website', url: `https://fundopshq.com/events/${slug}` },
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
  const related = await queryRelatedEvents(event)
  return <EventDetailPage event={event} related={related} />
}

// ── Shared shell ──────────────────────────────────────────────────

function Masthead({ right }: { right: string }) {
  return (
    <div className="border-b border-foreground/10">
      <div className="container mx-auto max-w-[1100px] px-4">
        <div className="flex items-center justify-between gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
          <span className="flex items-center gap-3">
            <span className="text-foreground/80">Section B</span>
            <span aria-hidden="true" className="text-foreground/20">·</span>
            <span>The Circuit</span>
          </span>
          <span className="text-amber-400/90">{right}</span>
        </div>
      </div>
    </div>
  )
}

function MiniEventRow({ event }: { event: IndustryEvent }) {
  const kind = EVENT_KIND_LABELS[event.eventKind] ?? EVENT_KIND_LABELS.other
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex items-center gap-3 border-b border-border/40 px-4 py-2.5 transition-colors hover:bg-accent/40 last:border-b-0"
    >
      <span className="w-[110px] shrink-0 font-mono text-[12px] tabular-nums text-foreground/90">
        {formatEventDates(event.startDate, event.endDate)}
      </span>
      <span className={cn('hidden sm:inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium', kind.color)}>
        {kind.label}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground group-hover:text-amber-400 transition-colors">
        {event.name}
      </span>
      <span className="hidden md:block w-[160px] shrink-0 truncate text-right text-[12px] text-muted-foreground">
        {formatEventLocation(event)}
      </span>
      <span className={cn('w-[52px] shrink-0 text-right text-[12px] font-medium', event.costType === 'free' ? 'text-emerald-400' : 'text-muted-foreground')}>
        {event.costType === 'free' ? 'Free' : (COST_LABELS[event.costType] ?? COST_LABELS.paid).label}
      </span>
    </Link>
  )
}

// ── Collection landing page ───────────────────────────────────────

async function CollectionPage({ collection }: { collection: EventCollection }) {
  let events: IndustryEvent[] = []
  try {
    const feed = await queryEventFeed({ ...collection.filter, limit: 60 })
    events = feed.events
  } catch {
    // page still renders with the board link
  }

  const boardQs = new URLSearchParams(collection.boardParams).toString()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: collection.title,
    url: `https://fundopshq.com/events/${collection.slug}`,
    itemListElement: events.slice(0, 25).map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://fundopshq.com/events/${e.slug}`,
    })),
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main id="main-content" className="flex-1 border-t-2 border-foreground/15 bg-background">
        <Masthead right={`${events.length} Upcoming`} />
        <div className="container mx-auto max-w-[1100px] px-4 py-10 sm:py-14">
          <Link href="/events" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" /> All Events
          </Link>
          <h1
            className="font-display text-foreground"
            style={{ fontSize: 'clamp(32px, 4.5vw, 54px)', lineHeight: 1, letterSpacing: '-0.03em', fontWeight: 500, fontVariationSettings: '"opsz" 144' }}
          >
            {collection.heading}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{collection.blurb}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link href={`/events?${boardQs}`} className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400 hover:text-amber-300 transition-colors">
              Filter &amp; search this list →
            </Link>
            <a
              href={`/api/events/calendar?${boardQs}`}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
            >
              <CalendarPlus className="h-3 w-3" /> Calendar feed
            </a>
          </div>

          <div className="mt-8 rounded-lg border border-border bg-card overflow-hidden">
            {events.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                Nothing upcoming here right now — check the <Link href="/events" className="text-amber-400 hover:text-amber-300">full board</Link>.
              </p>
            ) : (
              events.map((e) => <MiniEventRow key={e.id} event={e} />)
            )}
          </div>

          <p className="mt-8 text-[12px] text-muted-foreground/70">
            Know an event that belongs here?{' '}
            <Link href="/events/submit" className="text-amber-400/90 hover:text-amber-300">Submit it</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

// ── Event detail page ─────────────────────────────────────────────

function EventDetailPage({ event, related }: { event: IndustryEvent; related: IndustryEvent[] }) {
  const kind = EVENT_KIND_LABELS[event.eventKind] ?? EVENT_KIND_LABELS.other
  const cost = COST_LABELS[event.costType] ?? COST_LABELS.paid
  const dates = formatEventDates(event.startDate, event.endDate)
  const location = formatEventLocation(event)
  const isPast = event.startDate < new Date().toISOString().split('T')[0]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: event.startDate,
    ...(event.endDate ? { endDate: event.endDate } : {}),
    description: event.description ?? undefined,
    eventAttendanceMode:
      event.eventFormat === 'virtual'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : event.eventFormat === 'hybrid'
          ? 'https://schema.org/MixedEventAttendanceMode'
          : 'https://schema.org/OfflineEventAttendanceMode',
    location:
      event.eventFormat === 'virtual'
        ? { '@type': 'VirtualLocation', url: event.eventUrl }
        : {
            '@type': 'Place',
            name: event.venue ?? event.city ?? 'TBA',
            address: {
              '@type': 'PostalAddress',
              ...(event.city ? { addressLocality: event.city } : {}),
              ...(event.stateRegion ? { addressRegion: event.stateRegion } : {}),
              ...(event.country ? { addressCountry: event.country } : {}),
            },
          },
    organizer: { '@type': 'Organization', name: event.organizerName },
    url: `https://fundopshq.com/events/${event.slug}`,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main id="main-content" className="flex-1 border-t-2 border-foreground/15 bg-background">
        <Masthead right={isPast ? 'Archived' : 'Verified Date'} />
        <div className="container mx-auto max-w-[1100px] px-4 py-10 sm:py-14">
          <Link href="/events" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" /> All Events
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

          <h1
            className="mt-4 font-display text-foreground"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 500, fontVariationSettings: '"opsz" 144' }}
          >
            {event.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">by {event.organizerName}</p>

          {isPast && (
            <p className="mt-4 inline-block rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[12px] text-amber-300">
              This event has passed — see <Link href="/events" className="underline hover:text-amber-200">upcoming events</Link>.
            </p>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {event.description && (
                <p className="max-w-2xl text-[15px] leading-relaxed text-foreground/90">{event.description}</p>
              )}

              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 max-w-2xl">
                <div>
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">When</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {dates}
                    {event.timeNote && <span className="text-muted-foreground"> · {event.timeNote}</span>}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">Where</dt>
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
                <div>
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">Cost</dt>
                  <dd className={cn('mt-1 flex items-start gap-1.5 text-sm', event.costType === 'free' ? 'text-emerald-400' : 'text-foreground')}>
                    <Ticket className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{event.priceNote ?? cost.label}</span>
                  </dd>
                </div>
                {event.expectedAttendance && (
                  <div>
                    <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">Expected Attendance</dt>
                    <dd className="mt-1 flex items-start gap-1.5 text-sm text-foreground">
                      <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span>{event.expectedAttendance.toLocaleString()}+</span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="space-y-3">
              <a
                href={event.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-all hover:bg-amber-400"
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
              <p className="text-[11px] leading-relaxed text-muted-foreground/70">
                Date verified at the organizer&apos;s site by FundOpsHQ. Registration and pricing are handled by the organizer.
              </p>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-14">
              <div className="mb-3 border-b border-foreground/10 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                Related Events
              </div>
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                {related.map((e) => (
                  <MiniEventRow key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
