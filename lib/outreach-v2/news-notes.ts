/**
 * The daily news-note program: after the morning edition has gone, up to ten
 * short notes to the marketing / communications / IR contact at US firms named
 * in it ("we covered your news today; feel free to share it; the email is
 * free"). Server only.
 *
 * Credit discipline: the Apollo people search is free; revealing the person
 * (people/match) costs one credit and is done at most once per firm, never
 * past APOLLO_CREDITS_PER_DAY in a New York day (counted in outreach_v2_runs,
 * so a second run the same day only has what is left).
 */
import type { ApolloMatchPerson, ApolloSearchPerson } from '@/lib/outreach/apollo-client'
import { STORY_COLUMNS } from '@/lib/news/story-columns'
import { buildStories, type Story } from '@/lib/news/stories'
import { storyPath } from '@/lib/news/story-path'
import { isDescriptiveFirmName } from '@/lib/newsletter/query-articles'
import { APOLLO_CREDITS_PER_DAY, FIRM_NEWS_NOTE_DAYS, NEWS_NOTES_PER_DAY, SITE, nyDay, type Mode } from './config'
import { renderNewsNote } from './compose'
import { isBadNews, isExcludedFirm, isIqeqEmail, isUsCountry, noteTitleRank, sameFirm } from './exclusions'
import { creditsUsedToday, effectiveMode, logRun, newToken, screenEmails, statusForMode, type DbClient } from './store'

export interface ApolloPort {
  search(firmName: string): Promise<ApolloSearchPerson[]>
  /** One credit. */
  match(personId: string): Promise<ApolloMatchPerson | null>
}

export interface NoteCandidate {
  firm: string
  story: Story
  url: string
}

const northAmerican = (s: Story) => s.geography.some((g) => /north america|united states|\bus\b/i.test(g))

/** The firm is what the headline is about ("Savory closes…"), not a party named further on ("WCAS sells… to BlackRock's HPS"). */
export function headlineLeadsWith(headline: string, firm: string): boolean {
  const first = firm.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!first) return false
  const opening = headline.toLowerCase().split(/\s+/).slice(0, 3).map((w) => w.replace(/[^a-z0-9]/g, ''))
  return opening.some((w) => w === first || w === `${first}s`)
}

/**
 * The firms a note could go to, best first: one per firm, the subject firm of
 * each story, never a roundup, a described firm ("a Texas PE firm"), bad news
 * or an excluded firm. North American stories first, then those whose
 * headline is about the firm, then by weight.
 */
export function pickCandidates(stories: Story[]): { picked: NoteCandidate[]; dropped: { firm: string | null; headline: string; reason: string }[] } {
  const dropped: { firm: string | null; headline: string; reason: string }[] = []
  const leads = (s: Story) => Number(headlineLeadsWith(s.headline, s.firmName ?? ''))
  const ordered = [...stories].sort((a, b) => Number(northAmerican(b)) - Number(northAmerican(a)) || leads(b) - leads(a) || b.weight - a.weight)
  const picked: NoteCandidate[] = []
  for (const story of ordered) {
    const firm = (story.firmName ?? '').trim()
    const drop = (reason: string) => dropped.push({ firm: firm || null, headline: story.headline, reason })
    if (!firm) { drop('no firm named'); continue }
    if (story.roundup) { drop('roundup'); continue }
    if (isDescriptiveFirmName(firm)) { drop('firm is a description'); continue }
    if (isBadNews({ eventType: story.eventType, headline: story.headline, summary: story.summary })) { drop('bad news'); continue }
    if (isExcludedFirm(firm)) { drop('fund administrator / IQ-EQ competitor'); continue }
    if (picked.some((p) => sameFirm(p.firm, firm))) { drop('firm already picked'); continue }
    picked.push({ firm, story, url: `${SITE}${storyPath(story)}` })
  }
  return { picked, dropped }
}

const money = (m: number) => (m >= 1000 ? `$${(Math.round(m / 100) / 10).toString()}bn` : `$${Math.round(m)}M`)

/**
 * "Savory Fund III" under "Savory's …" reads twice: the fund's name loses the firm's name (or its first word) when it
 * starts with it. A fund name that is nothing but the firm's name is dropped.
 */
export function withoutFirm(fund: string, firm: string): string {
  const f = fund.trim()
  const words = firm.trim().split(/\s+/).filter(Boolean)
  for (const prefix of [firm.trim(), words[0] ?? '']) {
    if (prefix.length < 2) continue
    const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:'s)?\\b\\s*`, 'i')
    if (re.test(f)) return f.replace(re, '').trim()
  }
  return f
}

/** A few words for what we covered, read after "We covered <Firm>'s …": "$200M Fund III close", "latest deal". */
export function newsPhrase(s: Pick<Story, 'eventType' | 'kind' | 'fundName' | 'sizeUsdM' | 'closeType'>, firm?: string | null): string {
  const size = s.sizeUsdM ? `${money(s.sizeUsdM)} ` : ''
  const fund = withoutFirm(s.fundName?.trim() ?? '', firm ?? '') || undefined
  switch (s.eventType) {
    case 'fund_close':
      return `${size}${fund ?? 'fund'} ${s.closeType && /first|interim|second/i.test(s.closeType) ? `${s.closeType.toLowerCase()} close` : 'close'}`.replace(/\s+/g, ' ')
    case 'fund_launch':
      return `${size}${fund ?? 'new fund'} launch`
    case 'capital_raise':
      return size ? `${size}raise` : 'latest raise'
    case 'acquisition':
      return 'latest deal'
    case 'executive_hire':
      return 'new hire'
    case 'executive_change':
      return 'promotions'
    default:
      return s.kind === 'deals' ? 'latest deal' : s.kind === 'people' ? 'people news' : 'news'
  }
}

export interface FoundContact {
  personId: string
  email: string
  firstName: string
  lastName: string
  title: string
  orgName: string
  domain: string
  country: string
}

const normDomain = (d: string) => d.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim()

/** The best search hit at this firm: its name matches, and the title is someone who handles the firm's news. */
export function bestHit(firm: string, hits: ApolloSearchPerson[]): ApolloSearchPerson | null {
  const ranked = hits
    .filter((h) => h.id && h.has_email !== false && h.organization?.name && sameFirm(h.organization.name, firm))
    .filter((h) => !isExcludedFirm(h.organization?.name, h.title))
    .map((h) => ({ h, rank: noteTitleRank(h.title) }))
    .filter((x): x is { h: ApolloSearchPerson; rank: number } => x.rank != null)
    .sort((a, b) => a.rank - b.rank)
  return ranked[0]?.h ?? null
}

/** Every check on the revealed person: verified email at the firm's own domain, a first name, the right firm, the US. */
export function checkMatch(firm: string, p: ApolloMatchPerson | null): { ok: true; contact: FoundContact } | { ok: false; reason: string } {
  if (!p) return { ok: false, reason: 'apollo returned nobody' }
  if (p.email_status !== 'verified' || !p.email) return { ok: false, reason: 'no verified email' }
  if (!p.first_name?.trim()) return { ok: false, reason: 'no first name' }
  if (!isUsCountry(p.country)) return { ok: false, reason: `not in the US (${p.country ?? 'unknown'})` }
  if (noteTitleRank(p.title) == null) return { ok: false, reason: `title not a news contact (${p.title ?? 'none'})` }
  const org = p.organization?.name ?? ''
  if (!org || !sameFirm(org, firm)) return { ok: false, reason: `different firm (${org || 'none'})` }
  if (isExcludedFirm(org, p.title)) return { ok: false, reason: 'fund administrator / IQ-EQ competitor' }
  const domain = p.organization?.primary_domain ? normDomain(p.organization.primary_domain) : ''
  if (!domain) return { ok: false, reason: 'no firm domain' }
  const emailDomain = p.email.split('@')[1]?.toLowerCase() ?? ''
  if (emailDomain !== domain && !emailDomain.endsWith(`.${domain}`)) return { ok: false, reason: 'email not at the firm domain' }
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
      domain,
      country: p.country ?? 'United States',
    },
  }
}

/**
 * Firms that had a note inside FIRM_NEWS_NOTE_DAYS (sent or waiting to send),
 * plus any firm already previewed today, so a second run the same day does
 * not pick it again. A preview from an earlier day blocks nothing.
 */
async function recentNoteFirms(db: DbClient, now: Date, batch: string): Promise<string[]> {
  const since = new Date(now.getTime() - FIRM_NEWS_NOTE_DAYS * 86_400_000).toISOString()
  const { data, error } = await db
    .from('outreach_v2_messages')
    .select('company, status, batch')
    .eq('program', 'news_note')
    .gte('created_at', since)
    .in('status', ['sent', 'queued', 'sending', 'preview'])
  if (error) throw new Error(`recent note firms: ${error.message}`)
  return (data ?? []).filter((r) => r.status !== 'preview' || r.batch === batch).map((r) => String(r.company))
}

export interface NewsRunResult {
  ok: boolean
  mode: Mode
  skipped?: string
  edition?: string
  creditsUsed?: number
  created?: { firm: string; email: string; status: string; headline: string }[]
  passed?: { firm: string; reason: string }[]
  error?: string
}

export interface CollectDeps {
  apollo: ApolloPort
  recentFirm(firm: string): boolean
  /** Why this address may not be written to, or null. */
  screen(email: string): Promise<string | null>
  /** Stores the note; returns an error message or null. */
  store(candidate: NoteCandidate, contact: FoundContact): Promise<string | null>
}

/**
 * Walk the candidates, best first, until `caps.notes` notes are made or
 * `caps.credits` credits are spent: one free search and at most one paid
 * reveal per firm. The credit is counted the moment it is spent, whatever
 * the reveal turns up.
 */
export async function collectNotes(
  candidates: NoteCandidate[],
  deps: CollectDeps,
  caps: { notes: number; credits: number },
  status: string,
): Promise<{ credits: number; created: NonNullable<NewsRunResult['created']>; passed: { firm: string; reason: string }[] }> {
  let credits = 0
  const created: NonNullable<NewsRunResult['created']> = []
  const passed: { firm: string; reason: string }[] = []
  for (const c of candidates) {
    if (created.length >= caps.notes || credits >= caps.credits) break
    if (deps.recentFirm(c.firm)) { passed.push({ firm: c.firm, reason: `had a note in the last ${FIRM_NEWS_NOTE_DAYS} days` }); continue }
    let hit: ApolloSearchPerson | null
    try {
      hit = bestHit(c.firm, await deps.apollo.search(c.firm))
    } catch (err) {
      passed.push({ firm: c.firm, reason: `search failed: ${err instanceof Error ? err.message : String(err)}` })
      continue
    }
    if (!hit) { passed.push({ firm: c.firm, reason: 'no marketing / communications / IR contact found' }); continue }
    credits++
    let person: ApolloMatchPerson | null
    try {
      person = await deps.apollo.match(hit.id)
    } catch (err) {
      passed.push({ firm: c.firm, reason: `match failed: ${err instanceof Error ? err.message : String(err)}` })
      continue
    }
    const checked = checkMatch(c.firm, person)
    if (!checked.ok) { passed.push({ firm: c.firm, reason: checked.reason }); continue }
    try {
      const reason = await deps.screen(checked.contact.email)
      if (reason) { passed.push({ firm: c.firm, reason }); continue }
      const failed = await deps.store(c, checked.contact)
      if (failed) { passed.push({ firm: c.firm, reason: failed }); continue }
    } catch (err) {
      // Never lose count of a credit already spent: record the failure and go on.
      passed.push({ firm: c.firm, reason: `check failed: ${err instanceof Error ? err.message : String(err)}` })
      continue
    }
    created.push({ firm: c.firm, email: checked.contact.email, status, headline: c.story.headline })
  }
  return { credits, created, passed }
}

export async function runNewsNotes(db: DbClient, apollo: ApolloPort, now: Date = new Date(), opts: { creditCap?: number; noteCap?: number } = {}): Promise<NewsRunResult> {
  const { mode, halted } = await effectiveMode(db)
  if (mode === 'off') return { ok: true, mode, skipped: halted ? `halted: ${halted.halted_reason}` : 'mode off' }

  const today = nyDay(now)
  const batch = `news-${today}`
  const { data: edition, error: edErr } = await db.from('newsletter_editions').select('edition_date, status, article_ids').eq('edition_date', today).maybeSingle()
  if (edErr) return { ok: false, mode, error: edErr.message }
  if (!edition || edition.status !== 'sent') return { ok: true, mode, skipped: `today's edition (${today}) has not gone out` }
  const ids = (edition.article_ids ?? []) as string[]
  if (!ids.length) return { ok: true, mode, skipped: 'edition has no stories' }

  const { count: madeToday } = await db.from('outreach_v2_messages').select('id', { count: 'exact', head: true }).eq('batch', batch).in('status', ['preview', 'queued', 'sending', 'sent'])
  const noteCap = Math.min(opts.noteCap ?? NEWS_NOTES_PER_DAY, NEWS_NOTES_PER_DAY) - (madeToday ?? 0)
  const creditCap = Math.min(opts.creditCap ?? APOLLO_CREDITS_PER_DAY, APOLLO_CREDITS_PER_DAY) - (await creditsUsedToday(db, 'news_note', now))
  if (noteCap <= 0) return { ok: true, mode, skipped: 'ten notes already made today' }
  if (creditCap <= 0) return { ok: true, mode, skipped: 'Apollo credit cap reached today' }

  const rows: unknown[] = []
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await db.from('news_items').select(STORY_COLUMNS).in('id', ids.slice(i, i + 100))
    if (error) return { ok: false, mode, error: `edition rows: ${error.message}` }
    rows.push(...(data ?? []))
  }
  const { picked, dropped } = pickCandidates(buildStories(rows))
  const passed: { firm: string; reason: string }[] = dropped.map((d) => ({ firm: d.firm ?? d.headline, reason: d.reason }))
  const recent = await recentNoteFirms(db, now, batch)

  const status = statusForMode(mode)
  const outcome = await collectNotes(picked, {
    apollo,
    recentFirm: (firm) => recent.some((f) => sameFirm(f, firm)),
    screen: async (email) => (await screenEmails(db, [email], { program: 'news_note', now })).get(email) ?? null,
    store: async (c, contact) => {
      const unsubToken = newToken()
      const r = renderNewsNote({ firstName: contact.firstName, company: c.firm, unsubToken, news: newsPhrase(c.story, c.firm), storyUrl: c.url })
      const { error } = await db.from('outreach_v2_messages').insert({
        program: 'news_note',
        kind: 'initial',
        batch,
        email: contact.email,
        first_name: contact.firstName,
        last_name: contact.lastName,
        title: contact.title,
        company: c.firm,
        domain: contact.domain,
        apollo_person_id: contact.personId,
        country: contact.country,
        news_item_id: c.story.id,
        story_url: c.url,
        story_headline: c.story.headline,
        subject: r.subject,
        body_text: r.text,
        body_html: r.html,
        unsub_token: unsubToken,
        status,
        queued_at: status === 'queued' ? new Date().toISOString() : null,
      })
      if (error) return `store failed: ${error.message}`
      recent.push(c.firm)
      return null
    },
  }, { notes: noteCap, credits: creditCap }, status)
  passed.push(...outcome.passed)
  await logRun(db, 'news_note', mode, outcome.credits, { edition: today, created: outcome.created, passed: passed.slice(0, 80) }, now)
  const credits = outcome.credits
  const created = outcome.created
  return { ok: true, mode, edition: today, creditsUsed: credits, created, passed }
}
