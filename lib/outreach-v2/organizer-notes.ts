/**
 * The organizer-note program (2026-10-22): up to five a weekday, a short note
 * to the events or marketing contact at the organizer of an event on the
 * fundopshq.com events board ("<Event> on <date> is listed on the FundOpsHQ
 * events board ... if any detail is off, just reply"). Server only.
 *
 * Modelled on the news notes (news-notes.ts): the same message table, the same
 * do-not-contact screen, the same dispatcher, halt flag and plain-text copy.
 *
 * Who is never written to, beyond the shared rules in store.ts screenEmails:
 *  - an organizer whose type is fund_admin, or whose name (or the contact's
 *    company or title) reads as a fund administrator or IQ-EQ competitor
 *    (exclusions.ts isExcludedFirm);
 *  - an organizer (by web domain) already sent a note in ORGANIZER_NOTE_DAYS;
 *  - media, regulators, banks and anything else outside ORGANIZER_TYPES;
 *  - an event its organizer sent in themselves (they had a confirmation);
 *  - anyone outside the US.
 *
 * Credit discipline, as for the news notes: the people search is free; the
 * reveal (people/match) costs one credit, at most one per organizer, never past
 * ORGANIZER_APOLLO_CREDITS_PER_DAY in a New York day. A person revealed for an
 * earlier preview is used again for free.
 */
import type { ApolloMatchPerson, ApolloSearchPerson } from '@/lib/outreach/apollo-client'
import {
  ORGANIZER_APOLLO_CREDITS_PER_DAY, ORGANIZER_EVENT_MAX_DAYS, ORGANIZER_EVENT_MIN_DAYS, ORGANIZER_NOTE_DAYS, ORGANIZER_NOTES_PER_DAY,
  SITE, nyDay, organizerMode, type Mode,
} from './config'
import { eventDateLabel, renderOrganizerNote } from './compose'
import { isExcludedFirm, isIqeqEmail, isUsCountry, normalizeFirmName, organizerTitleRank, sameFirm } from './exclusions'
import { bareDomain, domainsAgree } from './firm-domains'
import { creditsUsedToday, effectiveMode, logRun, newToken, screenEmails, statusForMode, type DbClient } from './store'

export interface OrganizerApolloPort {
  search(organizer: string, organizerType: string): Promise<ApolloSearchPerson[]>
  /** One credit. */
  match(personId: string): Promise<ApolloMatchPerson | null>
}

/** The organizer types written to, best first. fund_admin never; media and other (regulators, banks) not either. */
export const ORGANIZER_TYPES = ['association', 'conference_producer', 'community', 'law_firm', 'accounting_firm', 'tech_vendor'] as const
const OPS_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }

/** One industry_events row, with its source's URL and type when it has one. */
export interface OrganizerEventRow {
  id: string
  slug: string
  name: string
  start_date: string
  end_date: string | null
  organizer_name: string
  organizer_type: string
  ops_relevance: string | null
  status: string
  region: string | null
  event_format: string | null
  is_submitted: boolean | null
  event_url: string | null
  registration_url: string | null
  source_url?: string | null
  source_organizer_type?: string | null
}

export interface OrganizerCandidate {
  event: OrganizerEventRow
  organizer: string
  /** The name searched for at Apollo: the organizer's name without its bracketed part. */
  searchName: string
  /** The organizer's own web domains (event page, registration page, source), event platforms left out. */
  domains: string[]
  /** The event's page on fundopshq.com. */
  url: string
}

/** A note already made: its contact's domain, the event's own page, the organizer. */
export interface NotedOrganizer {
  domain: string | null
  sourceUrl: string | null
  company: string | null
}

/**
 * Sites events are hosted or sold on: a domain here is nobody's own, so it
 * neither identifies an organizer nor vouches for a contact.
 */
const EVENT_PLATFORMS = [
  'lu.ma', 'luma.com', 'cvent.com', 'eventbrite.com', 'eventbrite.ca', 'goldcast.io', 'swoogo.com', 'zoom.us', 'zoom.com',
  'hubspot.com', 'hs-sites.com', 'hsforms.com', 'splashthat.com', 'bizzabo.com', 'accelevents.com', 'hopin.com', 'on24.com',
  'linkedin.com', 'google.com', 'forms.gle', 'typeform.com', 'whova.com', 'regfox.com', 'wufoo.com', 'mailchimp.com',
  'list-manage.com', 'constantcontact.com', 'ticketleap.com', 'ticketmaster.com', 'wildapricot.org', 'memberclicks.net',
  'ymaws.com', 'eventscloud.com', 'eventsair.com', 'webex.com', 'gotowebinar.com', 'goto.com', 'meetup.com', 'eventbrite.co.uk',
  'humanitix.com', 'tito.io', 'airmeet.com', 'brazenconnect.com', 'eventleaf.com', 'glueup.com', 'personifygo.com', 'blackbaud.com',
  'fundopshq.com',
]

const TWO_LEVEL_SUFFIX = /^(?:co|com|org|net|gov|ac|edu|ltd|plc)\.[a-z]{2}$/

/** "app.100women.org" → "100women.org", "www.foo.co.uk" → "foo.co.uk". */
export function registrableDomain(value: string | null | undefined): string {
  const d = bareDomain(value)
  const parts = d.split('.').filter(Boolean)
  if (parts.length <= 2) return parts.join('.')
  const last2 = parts.slice(-2).join('.')
  return TWO_LEVEL_SUFFIX.test(last2) ? parts.slice(-3).join('.') : last2
}

export const isEventPlatform = (domain: string): boolean => EVENT_PLATFORMS.some((p) => domainsAgree(domain, p))

/** A domain on a country's own suffix other than the US's (.ca, .lu, .co.uk): its people are not in the US. Generic two-letter suffixes kept. */
const GENERIC_TWO_LETTER = new Set(['us', 'io', 'co', 'ai', 'tv', 'fm', 'me', 'ly', 'vc', 'gg'])
export function isForeignDomain(domain: string): boolean {
  const tld = domain.split('.').at(-1) ?? ''
  return tld.length === 2 && !GENERIC_TWO_LETTER.has(tld)
}

const isGovernment = (domain: string) => /\.(?:gov|mil)$/i.test(domain) || /\.gov\.[a-z]{2}$/i.test(domain)

/** The organizer's own domains, best first (the event's page, its registration page, then the source it was found on). */
export function organizerDomains(e: Pick<OrganizerEventRow, 'event_url' | 'registration_url' | 'source_url'>): string[] {
  const out: string[] = []
  for (const u of [e.event_url, e.registration_url, e.source_url]) {
    const d = registrableDomain(u)
    if (d && d.includes('.') && !isEventPlatform(d) && !out.includes(d)) out.push(d)
  }
  return out
}

/** The organizer's name without its bracketed part: "Institutional Limited Partners Association (ILPA)" → "Institutional Limited Partners Association". */
const plainName = (organizer: string) => organizer.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim() || organizer.trim()

/** What Apollo is searched for: the plain name, and of "A / B" only A ("NYCPA / Foundation for Accounting Education" → "NYCPA"). */
export function searchNameOf(organizer: string): string {
  return plainName(organizer).split(/\s+\/\s+/)[0].trim()
}

/** The names an organizer goes by: without its brackets, what is in them, and each half of "A & B" or "A / B". */
export function organizerNames(organizer: string): string[] {
  const out = new Set<string>()
  const plain = plainName(organizer)
  out.add(plain)
  for (const m of organizer.matchAll(/\(([^)]*)\)/g)) {
    const inner = m[1].trim()
    if (inner && !/^with\b/i.test(inner) && !/\bchapters?\b/i.test(inner)) out.add(inner)
  }
  for (const part of plain.split(/\s+(?:&|\/)\s+/)) if (part.trim()) out.add(part.trim())
  return [...out].filter((n) => normalizeFirmName(n).length >= 3)
}

/** Apollo's company name is the organizer: the same name, or one starts with the other's whole name (six letters or more). */
export function organizerNameMatches(apolloOrg: string | null | undefined, organizer: string): boolean {
  const org = (apolloOrg ?? '').trim()
  if (!org) return false
  const o = normalizeFirmName(org)
  return organizerNames(organizer).some((n) => {
    if (sameFirm(org, n)) return true
    const v = normalizeFirmName(n)
    const [short, long] = v.length <= o.length ? [v, o] : [o, v]
    return short.length >= 6 && long.startsWith(short)
  })
}

const addDaysIso = (date: string, n: number) => new Date(Date.parse(`${date}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

/** The event's page on fundopshq.com. */
export const eventPageUrl = (slug: string) => `${SITE}/events/${encodeURIComponent(slug)}`

/** True when an organizer with these domains or this name already had a note (in `noted`). */
export function alreadyNoted(domains: string[], organizer: string, noted: NotedOrganizer[]): boolean {
  return noted.some((n) => {
    const theirs = [registrableDomain(n.domain), registrableDomain(n.sourceUrl)].filter(Boolean)
    if (theirs.some((t) => domains.some((d) => domainsAgree(d, t)))) return true
    return !!n.company && normalizeFirmName(n.company) === normalizeFirmName(organizer)
  })
}

/**
 * The events a note could be about, best first: published North American
 * in-person (or hybrid) events on the board, starting ORGANIZER_EVENT_MIN_DAYS
 * to ORGANIZER_EVENT_MAX_DAYS after `today`, one per organizer (by domain and
 * by name), never an excluded organizer or one already noted (`noted`). Ops-
 * focused events first, then by organizer type (ORGANIZER_TYPES order), then
 * the soonest.
 */
export function pickOrganizerEvents(
  rows: OrganizerEventRow[],
  today: string,
  noted: NotedOrganizer[] = [],
): { picked: OrganizerCandidate[]; dropped: { organizer: string; event: string; reason: string }[] } {
  const dropped: { organizer: string; event: string; reason: string }[] = []
  const from = addDaysIso(today, ORGANIZER_EVENT_MIN_DAYS)
  const to = addDaysIso(today, ORGANIZER_EVENT_MAX_DAYS)
  const typeRank = (t: string) => {
    const i = (ORGANIZER_TYPES as readonly string[]).indexOf(t)
    return i < 0 ? ORGANIZER_TYPES.length : i
  }
  const ordered = [...rows].sort((a, b) =>
    (OPS_RANK[a.ops_relevance ?? ''] ?? 3) - (OPS_RANK[b.ops_relevance ?? ''] ?? 3)
    || typeRank(a.organizer_type) - typeRank(b.organizer_type)
    || a.start_date.localeCompare(b.start_date)
    || a.name.localeCompare(b.name))
  const picked: OrganizerCandidate[] = []
  for (const event of ordered) {
    const organizer = (event.organizer_name ?? '').trim()
    const drop = (reason: string) => dropped.push({ organizer: organizer || '(none)', event: event.name, reason })
    if (!organizer) { drop('no organizer named'); continue }
    if (event.status !== 'published') { drop('not published'); continue }
    if (event.region !== 'north_america') { drop('not North American'); continue }
    if (!['in_person', 'hybrid'].includes(event.event_format ?? '')) { drop('not on the board (virtual)'); continue }
    if (event.is_submitted) { drop('the organizer sent it in'); continue }
    const start = event.start_date.slice(0, 10)
    if (start < from || start > to) { drop(`starts ${start}, outside ${ORGANIZER_EVENT_MIN_DAYS} to ${ORGANIZER_EVENT_MAX_DAYS} days`); continue }
    if (event.organizer_type === 'fund_admin' || event.source_organizer_type === 'fund_admin') { drop('fund administrator'); continue }
    if (!(ORGANIZER_TYPES as readonly string[]).includes(event.organizer_type)) { drop(`organizer type ${event.organizer_type}`); continue }
    if (isExcludedFirm(organizer)) { drop('fund administrator / IQ-EQ competitor'); continue }
    const domains = organizerDomains(event)
    if (!domains.length) { drop('no organizer domain (event platform only)'); continue }
    if (domains.some(isGovernment)) { drop('government'); continue }
    if (isForeignDomain(domains[0])) { drop(`organizer outside the US (${domains[0]})`); continue }
    if (alreadyNoted(domains, organizer, noted)) { drop(`had a note in the last ${ORGANIZER_NOTE_DAYS} days`); continue }
    if (picked.some((p) => p.domains.some((d) => domains.includes(d)) || normalizeFirmName(p.organizer) === normalizeFirmName(organizer))) { drop('organizer already picked'); continue }
    picked.push({ event, organizer, searchName: searchNameOf(organizer), domains, url: eventPageUrl(event.slug) })
  }
  return { picked, dropped }
}

export interface OrganizerContact {
  personId: string
  email: string
  firstName: string
  lastName: string
  title: string
  orgName: string
  domain: string
  country: string
}

/** The best search hit at this organizer: its company is the organizer, and the title runs events or marketing. */
export function bestOrganizerHit(c: Pick<OrganizerCandidate, 'organizer' | 'event'>, hits: ApolloSearchPerson[]): ApolloSearchPerson | null {
  const ranked = hits
    .filter((h) => h.id && h.has_email !== false && organizerNameMatches(h.organization?.name, c.organizer))
    .filter((h) => !isExcludedFirm(h.organization?.name, h.title))
    .map((h) => ({ h, rank: organizerTitleRank(h.title, c.event.organizer_type) }))
    .filter((x): x is { h: ApolloSearchPerson; rank: number } => x.rank != null)
    .sort((a, b) => a.rank - b.rank)
  return ranked[0]?.h ?? null
}

/**
 * Every check on the revealed person: a verified email at the organizer's own
 * domain (one of `c.domains`), a first name, the US, the organizer by name, a
 * title that handles events or marketing, never a competitor or IQ-EQ.
 */
export function checkOrganizerMatch(c: Pick<OrganizerCandidate, 'organizer' | 'event' | 'domains'>, p: ApolloMatchPerson | null): { ok: true; contact: OrganizerContact } | { ok: false; reason: string } {
  if (!p) return { ok: false, reason: 'apollo returned nobody' }
  if (p.email_status !== 'verified' || !p.email) return { ok: false, reason: 'no verified email' }
  if (!p.first_name?.trim()) return { ok: false, reason: 'no first name' }
  if (!isUsCountry(p.country)) return { ok: false, reason: `not in the US (${p.country ?? 'unknown'})` }
  if (organizerTitleRank(p.title, c.event.organizer_type) == null) return { ok: false, reason: `title not an events / marketing contact (${p.title ?? 'none'})` }
  const org = p.organization?.name ?? ''
  if (!organizerNameMatches(org, c.organizer)) return { ok: false, reason: `different organization (${org || 'none'})` }
  if (isExcludedFirm(org, p.title)) return { ok: false, reason: 'fund administrator / IQ-EQ competitor' }
  const domain = bareDomain(p.organization?.primary_domain)
  if (!domain) return { ok: false, reason: 'no organization domain' }
  if (!c.domains.some((d) => domainsAgree(domain, d) || registrableDomain(domain) === d)) return { ok: false, reason: `organization domain ${domain} is not the organizer's (${c.domains.join(', ')})` }
  const emailDomain = p.email.split('@')[1]?.toLowerCase() ?? ''
  if (!c.domains.some((d) => emailDomain === d || emailDomain.endsWith(`.${d}`))) return { ok: false, reason: `email not at the organizer's domain (${emailDomain})` }
  if (isIqeqEmail(p.email)) return { ok: false, reason: 'iqeq.com' }
  return {
    ok: true,
    contact: {
      personId: p.id,
      email: p.email.toLowerCase(),
      firstName: p.first_name.trim(),
      lastName: (p.last_name ?? '').trim(),
      title: p.title ?? '',
      orgName: org,
      domain: registrableDomain(emailDomain),
      country: p.country ?? 'United States',
    },
  }
}

export interface OrganizerRunResult {
  ok: boolean
  mode: Mode
  skipped?: string
  creditsUsed?: number
  created?: { organizer: string; event: string; email: string; status: string; reused: boolean }[]
  passed?: { organizer: string; reason: string }[]
  error?: string
}

export interface CollectOrganizerDeps {
  apollo: OrganizerApolloPort
  /** A contact revealed for this organizer before (an earlier preview), to use again without a credit; or null. */
  cached?(c: OrganizerCandidate): Promise<OrganizerContact | null>
  /** Why this address may not be written to, or null. */
  screen(email: string): Promise<string | null>
  /** Stores the note; returns an error message or null. */
  store(c: OrganizerCandidate, contact: OrganizerContact): Promise<string | null>
}

/**
 * Walk the candidates, best first, until `caps.notes` notes are made or
 * `caps.credits` credits are spent: a contact from an earlier preview first
 * (free), else one free search and at most one paid reveal per organizer. A
 * credit is counted the moment it is spent, whatever the reveal turns up. A
 * second organizer that turns out to share a contact domain with one already
 * written to in this run is passed over.
 */
export async function collectOrganizerNotes(
  candidates: OrganizerCandidate[],
  deps: CollectOrganizerDeps,
  caps: { notes: number; credits: number },
  status: string,
): Promise<{ credits: number; created: NonNullable<OrganizerRunResult['created']>; passed: { organizer: string; reason: string }[] }> {
  let credits = 0
  const created: NonNullable<OrganizerRunResult['created']> = []
  const passed: { organizer: string; reason: string }[] = []
  const usedDomains = new Set<string>()
  for (const c of candidates) {
    if (created.length >= caps.notes) break
    const pass = (reason: string) => passed.push({ organizer: c.organizer, reason })
    let contact: OrganizerContact | null = null
    let reused = false
    try {
      const prior = deps.cached ? await deps.cached(c) : null
      if (prior && c.domains.some((d) => domainsAgree(prior.domain, d))) { contact = prior; reused = true }
    } catch {
      // No cache: look the organizer up.
    }
    if (!contact) {
      if (credits >= caps.credits) continue // a cached contact further down may still be free
      let hit: ApolloSearchPerson | null
      try {
        hit = bestOrganizerHit(c, await deps.apollo.search(c.searchName, c.event.organizer_type))
      } catch (err) {
        pass(`search failed: ${err instanceof Error ? err.message : String(err)}`)
        continue
      }
      if (!hit) { pass('no events / marketing contact found'); continue }
      credits++
      let person: ApolloMatchPerson | null
      try {
        person = await deps.apollo.match(hit.id)
      } catch (err) {
        pass(`match failed: ${err instanceof Error ? err.message : String(err)}`)
        continue
      }
      const checked = checkOrganizerMatch(c, person)
      if (!checked.ok) { pass(checked.reason); continue }
      contact = checked.contact
    }
    if (usedDomains.has(contact.domain)) { pass(`${contact.domain} already written to in this run`); continue }
    try {
      const reason = await deps.screen(contact.email)
      if (reason) { pass(reason); continue }
      const failed = await deps.store(c, contact)
      if (failed) { pass(failed); continue }
    } catch (err) {
      // Never lose count of a credit already spent: record the failure and go on.
      pass(`check failed: ${err instanceof Error ? err.message : String(err)}`)
      continue
    }
    usedDomains.add(contact.domain)
    created.push({ organizer: c.organizer, event: c.event.name, email: contact.email, status, reused })
  }
  return { credits, created, passed }
}

/** How many notes and credits are left today, given what was made and spent. Never below zero, never above the caps. */
export function organizerCapsLeft(madeToday: number, creditsToday: number, asked: { noteCap?: number; creditCap?: number } = {}): { notes: number; credits: number } {
  return {
    notes: Math.max(0, Math.min(asked.noteCap ?? ORGANIZER_NOTES_PER_DAY, ORGANIZER_NOTES_PER_DAY) - madeToday),
    credits: Math.max(0, Math.min(asked.creditCap ?? ORGANIZER_APOLLO_CREDITS_PER_DAY, ORGANIZER_APOLLO_CREDITS_PER_DAY) - creditsToday),
  }
}

const isWeekday = (day: string) => {
  const wd = new Date(`${day}T12:00:00Z`).getUTCDay()
  return wd !== 0 && wd !== 6
}

const EVENT_COLUMNS = 'id, slug, name, start_date, end_date, organizer_name, organizer_type, ops_relevance, status, region, event_format, is_submitted, event_url, registration_url, event_source_id'

/**
 * Organizers that had a note inside ORGANIZER_NOTE_DAYS (sent or waiting to
 * send), plus any previewed today, so a second run the same day does not pick
 * it again. A preview from an earlier day blocks nothing (its contact is used
 * again for free instead).
 */
async function recentOrganizers(db: DbClient, now: Date, batch: string): Promise<NotedOrganizer[]> {
  const since = new Date(now.getTime() - ORGANIZER_NOTE_DAYS * 86_400_000).toISOString()
  const { data, error } = await db
    .from('outreach_v2_messages')
    .select('company, domain, source_url, status, batch')
    .eq('program', 'organizer_note')
    .gte('created_at', since)
    .in('status', ['sent', 'queued', 'sending', 'preview'])
  if (error) throw new Error(`recent organizers: ${error.message}`)
  return (data ?? [])
    .filter((r) => r.status !== 'preview' || r.batch === batch)
    .map((r) => ({ domain: (r.domain as string | null) ?? null, sourceUrl: (r.source_url as string | null) ?? null, company: (r.company as string | null) ?? null }))
}

/** How long a previewed contact is trusted for (people change jobs). */
const CACHE_DAYS = 60

export async function runOrganizerNotes(db: DbClient, apollo: OrganizerApolloPort, now: Date = new Date(), opts: { creditCap?: number; noteCap?: number } = {}): Promise<OrganizerRunResult> {
  const shared = await effectiveMode(db)
  const halted = shared.halted
  const mode = organizerMode(shared.mode)
  if (mode === 'off') return { ok: true, mode, skipped: halted ? `halted: ${halted.halted_reason}` : 'mode off' }

  // The table must take an organizer note (supabase/migrations/20261022_outreach_v2_organizer_note.sql) before any
  // credit is spent on one: a note that cannot be stored wastes the credit that found its contact.
  const { error: schemaErr } = await db.from('outreach_v2_messages').select('event_id').limit(1)
  if (schemaErr) return { ok: false, mode, error: `outreach_v2_messages has no event_id column (apply 20261022_outreach_v2_organizer_note.sql): ${schemaErr.message}` }

  const today = nyDay(now)
  if (!isWeekday(today)) return { ok: true, mode, skipped: 'weekend: organizer notes are made on weekdays' }
  const batch = `organizer-${today}`

  const { count: madeToday, error: countErr } = await db.from('outreach_v2_messages').select('id', { count: 'exact', head: true }).eq('batch', batch).in('status', ['preview', 'queued', 'sending', 'sent'])
  if (countErr) return { ok: false, mode, error: countErr.message }
  const caps = organizerCapsLeft(madeToday ?? 0, await creditsUsedToday(db, 'organizer_note', now), opts)
  if (caps.notes <= 0) return { ok: true, mode, skipped: `${ORGANIZER_NOTES_PER_DAY} organizer notes already made today` }

  const { data: events, error: evErr } = await db
    .from('industry_events')
    .select(EVENT_COLUMNS)
    .eq('status', 'published')
    .eq('region', 'north_america')
    .gte('start_date', addDaysIso(today, ORGANIZER_EVENT_MIN_DAYS))
    .lte('start_date', addDaysIso(today, ORGANIZER_EVENT_MAX_DAYS))
    .order('start_date', { ascending: true })
    .limit(1000)
  if (evErr) return { ok: false, mode, error: `events: ${evErr.message}` }
  const sourceIds = [...new Set((events ?? []).map((e) => e.event_source_id).filter(Boolean))] as string[]
  const sources = new Map<string, { url: string | null; organizer_type: string | null }>()
  if (sourceIds.length) {
    const { data: srcRows, error: srcErr } = await db.from('event_sources').select('id, url, organizer_type').in('id', sourceIds)
    if (srcErr) return { ok: false, mode, error: `event sources: ${srcErr.message}` }
    for (const s of srcRows ?? []) sources.set(String(s.id), { url: (s.url as string | null) ?? null, organizer_type: (s.organizer_type as string | null) ?? null })
  }
  const rows: OrganizerEventRow[] = (events ?? []).map((e) => {
    const s = e.event_source_id ? sources.get(String(e.event_source_id)) : undefined
    return { ...(e as unknown as OrganizerEventRow), source_url: s?.url ?? null, source_organizer_type: s?.organizer_type ?? null }
  })

  const noted = await recentOrganizers(db, now, batch)
  const { picked, dropped } = pickOrganizerEvents(rows, today, noted)
  const passed: { organizer: string; reason: string }[] = dropped.map((d) => ({ organizer: `${d.organizer}: ${d.event}`, reason: d.reason }))

  const status = statusForMode(mode)
  const todayYear = Number(today.slice(0, 4))
  const cacheSince = new Date(now.getTime() - CACHE_DAYS * 86_400_000).toISOString()
  const outcome = await collectOrganizerNotes(picked, {
    apollo,
    cached: async (c) => {
      const { data } = await db
        .from('outreach_v2_messages')
        .select('email, first_name, last_name, title, company, domain, apollo_person_id, country')
        .eq('program', 'organizer_note')
        .eq('company', c.organizer)
        .in('status', ['preview', 'cancelled'])
        .gte('created_at', cacheSince)
        .order('created_at', { ascending: false })
        .limit(1)
      const r = data?.[0]
      if (!r?.email || !r.first_name || !r.domain) return null
      return {
        personId: String(r.apollo_person_id ?? ''),
        email: String(r.email).toLowerCase(),
        firstName: String(r.first_name),
        lastName: String(r.last_name ?? ''),
        title: String(r.title ?? ''),
        orgName: String(r.company),
        domain: String(r.domain),
        country: String(r.country ?? 'United States'),
      }
    },
    screen: async (email) => (await screenEmails(db, [email], { program: 'organizer_note', now })).get(email) ?? null,
    store: async (c, contact) => {
      const unsubToken = newToken()
      const r = renderOrganizerNote({
        firstName: contact.firstName,
        unsubToken,
        eventName: c.event.name,
        dateLabel: eventDateLabel(c.event.start_date, c.event.end_date, todayYear),
        eventUrl: c.url,
      })
      const { error } = await db.from('outreach_v2_messages').insert({
        program: 'organizer_note',
        kind: 'initial',
        batch,
        email: contact.email,
        first_name: contact.firstName,
        last_name: contact.lastName,
        title: contact.title,
        company: c.organizer,
        domain: contact.domain,
        apollo_person_id: contact.personId || null,
        country: contact.country,
        event_id: c.event.id,
        source_url: c.event.event_url,
        story_url: c.url,
        story_headline: c.event.name,
        subject: r.subject,
        body_text: r.text,
        body_html: r.html,
        unsub_token: unsubToken,
        status,
        queued_at: status === 'queued' ? new Date().toISOString() : null,
      })
      if (error) return `store failed: ${error.message}`
      return null
    },
  }, caps, status)
  passed.push(...outcome.passed)
  await logRun(db, 'organizer_note', mode, outcome.credits, { created: outcome.created, passed: passed.slice(0, 120) }, now)
  return { ok: true, mode, creditsUsed: outcome.credits, created: outcome.created, passed }
}
