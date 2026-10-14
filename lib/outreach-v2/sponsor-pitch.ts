/**
 * The sponsor-pitch program: load a hand-built list, render every pitch for
 * Danny to read, release it to the dispatcher, and follow up once.
 *
 * THE LIST FILE (written by the list agent, e.g.
 * ~/fundopshq-workspace/docs/outreach/sponsor-batch-1.json):
 *
 *   {
 *     "batch": "sponsor-batch-1",
 *     "leads": [{
 *       "company": "ToltIQ",                       // as it should appear, <= 40 characters
 *       "domain": "toltiq.com",                    // the company's own website
 *       "first_name": "Jane", "last_name": "Doe",
 *       "title": "Head of Marketing",
 *       "email": "jane@toltiq.com",                // at the company's domain
 *       "apollo_person_id": "64a...",              // or null
 *       "country": "United States",                // optional
 *       "hook": "Research note: what happened and when.",
 *       "hook_clause": "Congrats on the Series A.",  // optional: one short clause about THEM, used as written
 *       "hook_date": "2026-10-08",                 // the hook's date; older than 60 days → no clause
 *       "source_url": "https://...",               // where the hook was checked
 *       "logo_url": "https://toltiq.com/logo.svg", // optional: a file on the company's own site
 *       "ad_line": "One sentence for their mock ad." // optional, <= 60 words
 *     }]
 *   }
 *
 * A bare array of leads is accepted too, and so are the list agent's own
 * field names (batch 1, 2026-10-14): contact_first_name, contact_last_name,
 * contact_title, contact_email, contact_location ("Austin, TX, US"),
 * hook_source_url and email_status. `email_domain_ok` names a second mail
 * domain the company really uses. `what_they_sell` is never used as ad copy.
 *
 * The hook clause (Danny, 2026-10-14) goes in only when it is dated within
 * HOOK_FRESH_DAYS and reads as one short clause about them; otherwise the
 * email simply leaves it out. Never "I saw…".
 */
import { LIMITS } from '@/lib/sponsor/packages'
import { readerFirmDomains } from '@/lib/sponsor/reader-firms'
import { FOLLOWUP_BUSINESS_DAYS, followupDue, nyDay } from './config'
import { audienceLine, mockupShortUrl, mockupUrl, pitchMonth, readerWords, renderSponsorFollowup, renderSponsorPitch, wordCount } from './compose'
import { isExcludedFirm, isIqeqEmail, isUsCountry } from './exclusions'
import { effectiveMode, newToken, screenEmails, type DbClient, type MessageRow } from './store'

export interface SponsorLead {
  company: string
  domain: string
  first_name: string
  last_name: string
  title: string
  email: string
  apollo_person_id: string | null
  country: string | null
  hook: string
  hook_clause: string | null
  hook_date: string | null
  source_url: string
  logo_url: string | null
  ad_line: string | null
  /** A second mail domain the company really uses (Nasdaq Private Market: npm.com), checked by whoever built the list. */
  email_domain_ok: string | null
}

const str = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '')
const optional = (v: unknown) => str(v) || null
const EMAIL = /^[^\s@]+@([^\s@]+\.[^\s@]{2,})$/
const bareDomain = (d: string) => d.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
const sameOrSub = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`)

/** "Austin, TX, US" → "United States"; any other last part is returned as it is; nothing → null. */
export function countryOf(location: string): string | null {
  const last = location.split(',').map((p) => p.trim()).filter(Boolean).pop()
  if (!last) return null
  return isUsCountry(last) ? 'United States' : last
}

export function parseBatchFile(json: unknown): { batch: string | null; leads: unknown[] } {
  if (Array.isArray(json)) return { batch: null, leads: json }
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>
    return { batch: str(o.batch) || null, leads: Array.isArray(o.leads) ? o.leads : [] }
  }
  return { batch: null, leads: [] }
}

/** Tidies one lead and says what is wrong with it (errors stop it; warnings are shown in the preview). */
export function checkLead(raw: unknown): { lead: SponsorLead; errors: string[]; warnings: string[] } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const pick = (...keys: string[]) => keys.map((k) => str(r[k])).find(Boolean) ?? ''
  const lead: SponsorLead = {
    company: str(r.company),
    domain: bareDomain(str(r.domain)),
    first_name: pick('first_name', 'contact_first_name'),
    last_name: pick('last_name', 'contact_last_name'),
    title: pick('title', 'contact_title'),
    email: pick('email', 'contact_email').toLowerCase(),
    apollo_person_id: optional(r.apollo_person_id),
    country: optional(r.country) ?? countryOf(str(r.contact_location)),
    hook: pick('hook'),
    hook_clause: optional(r.hook_clause),
    hook_date: /^\d{4}-\d\d-\d\d$/.test(str(r.hook_date)) ? str(r.hook_date) : null,
    source_url: pick('source_url', 'hook_source_url'),
    logo_url: optional(r.logo_url),
    // The mock ad's copy is ad_line only: what_they_sell is an analyst's note ("(software only)"), never ad copy.
    ad_line: optional(r.ad_line),
    email_domain_ok: bareDomain(str(r.email_domain_ok)) || null,
  }
  const errors: string[] = []
  const warnings: string[] = []
  const status = str(r.email_status)
  if (status && status !== 'verified') warnings.push(`Apollo email status is ${status}, not verified`)
  if (lead.company.length < 2) errors.push('company is missing')
  if (lead.company.length > LIMITS.company) errors.push(`company is longer than ${LIMITS.company} characters (the ad builder's limit)`)
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(lead.domain)) errors.push('domain is not a web domain')
  if (!lead.first_name) errors.push('first_name is missing')
  const m = lead.email.match(EMAIL)
  if (!m) errors.push('email is not an email address')
  else if (lead.domain && !sameOrSub(m[1], lead.domain) && !(lead.email_domain_ok && sameOrSub(m[1], lead.email_domain_ok))) errors.push(`email is not at ${lead.domain}`)
  if (isIqeqEmail(lead.email)) errors.push('iqeq.com address')
  if (isExcludedFirm(lead.company, lead.title)) errors.push('reads as a fund administrator / IQ-EQ competitor')
  if (lead.hook_clause && /^i\b/i.test(lead.hook_clause)) errors.push('hook_clause must be about them, not "I saw…"')
  if (lead.hook_clause && wordCount(lead.hook_clause) > 14) errors.push('hook_clause is longer than one short clause (14 words)')
  if (lead.hook_clause && !lead.hook_date) warnings.push('hook_clause has no hook_date, so it is left out')
  if (!/^https?:\/\//.test(lead.source_url)) warnings.push('no source_url for the hook')
  if (lead.logo_url) {
    try {
      const u = new URL(lead.logo_url)
      if (u.protocol !== 'https:') errors.push('logo_url must be https')
      else if (!sameOrSub(u.hostname.toLowerCase(), lead.domain)) warnings.push(`logo_url is not on ${lead.domain}: it is used only if the company's homepage links to it`)
    } catch {
      errors.push('logo_url is not a URL')
    }
  } else warnings.push('no logo_url: the mock-up shows the name only')
  if (lead.ad_line && wordCount(lead.ad_line) > LIMITS.blurbWords) errors.push(`ad_line is over ${LIMITS.blurbWords} words`)
  if (!lead.ad_line) warnings.push('no ad_line: the mock-up opens with an empty ad')
  if (lead.country && !isUsCountry(lead.country)) warnings.push(`contact is in ${lead.country}, not the US`)
  return { lead, errors, warnings }
}

/** A hook is used only this long after its date. */
export const HOOK_FRESH_DAYS = 60

/** Off since 2026-10-14 (Danny). */
export const HOOK_LINES = false

/** The clause the email uses, or null: present, dated, no older than HOOK_FRESH_DAYS, about them. */
export function freshClause(lead: Pick<SponsorLead, 'hook_clause' | 'hook_date'>, today: string): string | null {
  // Danny, 2026-10-14, on the first sent pitch ("Congrats on the Q2 Family Office Report"): "that seems weird… not sure
  // we need lines like that". No hook line in any pitch. The rest of this function is kept for the record.
  if (!HOOK_LINES) return null
  const clause = (lead.hook_clause ?? '').trim()
  if (!clause || !lead.hook_date || /^i\b/i.test(clause) || wordCount(clause) > 14) return null
  const age = (Date.parse(`${today}T12:00:00Z`) - Date.parse(`${lead.hook_date}T12:00:00Z`)) / 86_400_000
  if (!(age >= 0 && age <= HOOK_FRESH_DAYS)) return null
  return /[.!?]$/.test(clause) ? clause : `${clause}.`
}

/** Confirmed subscribers and the firms they read at (the same counts /sponsor shows), or nulls. */
export async function audienceFigures(db: DbClient): Promise<{ subscribers: number | null; firms: number | null }> {
  const { data, error } = await db.from('newsletter_subscribers').select('email').eq('status', 'confirmed').limit(10000)
  if (error || !data) return { subscribers: null, firms: null }
  const emails = data.map((r) => String(r.email))
  return { subscribers: emails.length, firms: readerFirmDomains(emails).size }
}

export interface PreparedLead {
  lead: SponsorLead
  errors: string[]
  warnings: string[]
  skipReason: string | null
  row: MessageRow | null
}

/**
 * Store every lead as a rendered `preview` message (or `skipped`, with why).
 * Re-running re-renders the rows still in preview; a row already released or
 * sent is left as it is.
 */
export async function prepareSponsorBatch(db: DbClient, batch: string, rawLeads: unknown[], now: Date = new Date()): Promise<PreparedLead[]> {
  const { subscribers, firms } = await audienceFigures(db)
  const audience = audienceLine(subscribers, firms)
  const today = nyDay(now)
  const month = pitchMonth(today)
  const checked = rawLeads.map(checkLead)
  const seen = new Set<string>()
  const screen = await screenEmails(db, checked.map((c) => c.lead.email).filter(Boolean), { program: 'sponsor_pitch', now })

  const { data: existing, error } = await db.from('outreach_v2_messages').select('*').eq('batch', batch).eq('kind', 'initial')
  if (error) throw new Error(`existing batch rows: ${error.message}`)
  const byEmail = new Map(((existing ?? []) as MessageRow[]).map((r) => [r.email, r]))

  // A lead taken out of the file since the last run is taken out of the batch too (only while still unsent).
  const inFile = new Set(checked.map((c) => c.lead.email).filter(Boolean))
  const dropped = [...byEmail.values()].filter((r) => !inFile.has(r.email) && ['preview', 'queued'].includes(r.status))
  if (dropped.length) {
    const { error: dropErr } = await db.from('outreach_v2_messages').update({ status: 'cancelled', skip_reason: 'removed from the list' }).in('id', dropped.map((r) => r.id))
    if (dropErr) throw new Error(`drop removed leads: ${dropErr.message}`)
  }

  const out: PreparedLead[] = []
  for (const c of checked) {
    const { lead } = c
    let skipReason: string | null = c.errors.length ? `invalid: ${c.errors.join('; ')}` : null
    if (!skipReason && seen.has(lead.email)) skipReason = 'duplicate in this file'
    if (!skipReason && screen.get(lead.email)) skipReason = screen.get(lead.email)!
    seen.add(lead.email)

    const prior = byEmail.get(lead.email)
    if (prior && !['preview', 'skipped'].includes(prior.status)) {
      out.push({ ...c, skipReason: `already ${prior.status}`, row: prior })
      continue
    }
    if (!lead.email || !EMAIL.test(lead.email)) {
      out.push({ ...c, skipReason, row: null })
      continue
    }

    // The logo is not in the link: /api/sponsor/logo serves the one resolved from the company's own header (resolve-logos.ts).
    const mockup = mockupUrl({ company: lead.company, domain: lead.domain, adLine: lead.ad_line })
    const fields = {
      program: 'sponsor_pitch',
      kind: 'initial',
      batch,
      email: lead.email,
      first_name: lead.first_name,
      last_name: lead.last_name,
      title: lead.title,
      company: lead.company,
      domain: lead.domain,
      apollo_person_id: lead.apollo_person_id,
      country: lead.country,
      hook: lead.hook,
      hook_date: lead.hook_date,
      source_url: lead.source_url,
      logo_url: lead.logo_url,
      ad_line: lead.ad_line,
      mockup_url: mockup,
      status: skipReason ? 'skipped' : 'preview',
      skip_reason: skipReason,
    }
    const unsubToken = prior?.unsub_token ?? newToken()
    const id = prior?.id ?? crypto.randomUUID()
    const clause = freshClause(lead, today)
    const rendered = renderSponsorPitch({ firstName: lead.first_name, company: lead.company, unsubToken, hookClause: clause, audience, month, mockup: mockupShortUrl(id) })
    const full = { ...fields, unsub_token: unsubToken, subject: rendered.subject, body_text: rendered.text, body_html: rendered.html }
    const saved = prior
      ? await db.from('outreach_v2_messages').update(full).eq('id', prior.id).select('*').single()
      : await db.from('outreach_v2_messages').insert({ id, ...full }).select('*').single()
    if (saved.error) throw new Error(`save ${lead.email}: ${saved.error.message}`)
    const words = readerWords(rendered)
    const warnings = [...c.warnings]
    if (lead.hook_clause && !clause) warnings.push(`hook clause left out (dated ${lead.hook_date ?? 'never'}: more than ${HOOK_FRESH_DAYS} days old, or not a short clause about them)`)
    if (!audience) warnings.push('audience figures unavailable: the parenthetical is left out')
    if (words > 90) warnings.push(`body is ${words} words (aim: about 85)`)
    out.push({ ...c, warnings, skipReason, row: saved.data as MessageRow })
  }
  return out
}

/** Hand a previewed batch to the dispatcher. It sends only in `live` mode, one every five minutes. */
export async function releaseBatch(db: DbClient, batch: string): Promise<number> {
  const { data, error } = await db
    .from('outreach_v2_messages')
    .update({ status: 'queued', queued_at: new Date().toISOString() })
    .eq('batch', batch)
    .eq('kind', 'initial')
    .eq('status', 'preview')
    .select('id')
  if (error) throw new Error(`release: ${error.message}`)
  return data?.length ?? 0
}

/** The pitches whose one follow-up is due today: sent, no reply, no opt-out, no bounce, none sent yet. */
export async function dueFollowups(db: DbClient, now: Date = new Date()): Promise<MessageRow[]> {
  const today = nyDay(now)
  const { data, error } = await db
    .from('outreach_v2_messages')
    .select('*')
    .eq('program', 'sponsor_pitch')
    .eq('kind', 'initial')
    .eq('status', 'sent')
    .is('replied_at', null)
    .is('unsubscribed_at', null)
    .is('bounced_at', null)
    .is('complained_at', null)
    .lt('sent_at', new Date(now.getTime() - FOLLOWUP_BUSINESS_DAYS * 86_400_000).toISOString())
  if (error) throw new Error(`due follow-ups: ${error.message}`)
  const rows = ((data ?? []) as MessageRow[]).filter((r) => r.sent_at && followupDue(new Date(r.sent_at), today))
  if (!rows.length) return []
  const { data: kids, error: kidErr } = await db.from('outreach_v2_messages').select('parent_id').in('parent_id', rows.map((r) => r.id))
  if (kidErr) throw new Error(`existing follow-ups: ${kidErr.message}`)
  const done = new Set((kids ?? []).map((k) => String(k.parent_id)))
  return rows.filter((r) => !done.has(r.id))
}

/** Daily: queue the follow-ups that are due (live), or only count them (preview / off). */
export async function createFollowups(db: DbClient, now: Date = new Date()): Promise<{ mode: string; due: number; queued: number; skipped: { email: string; reason: string }[] }> {
  const { mode } = await effectiveMode(db)
  const due = await dueFollowups(db, now)
  if (mode !== 'live') return { mode, due: due.length, queued: 0, skipped: [] }
  let queued = 0
  const skipped: { email: string; reason: string }[] = []
  for (const parent of due) {
    const reasons = await screenEmails(db, [parent.email], { program: 'sponsor_pitch', threadRootId: parent.id, now })
    const reason = reasons.get(parent.email)
    const base = {
      program: 'sponsor_pitch',
      kind: 'followup',
      parent_id: parent.id,
      batch: parent.batch,
      email: parent.email,
      first_name: parent.first_name,
      last_name: parent.last_name,
      title: parent.title,
      company: parent.company,
      domain: parent.domain,
      mockup_url: parent.mockup_url,
    }
    if (reason) {
      skipped.push({ email: parent.email, reason })
      // Recorded, so it is never considered again.
      await db.from('outreach_v2_messages').insert({ ...base, subject: '(not sent)', body_text: '(not sent)', status: 'skipped', skip_reason: reason })
      continue
    }
    const unsubToken = newToken()
    const r = renderSponsorFollowup({
      firstName: parent.first_name ?? '',
      company: parent.company,
      unsubToken,
      mockup: mockupShortUrl(parent.id),
      original: { subject: parent.subject },
    })
    const ins = await db.from('outreach_v2_messages').insert({ ...base, unsub_token: unsubToken, subject: r.subject, body_text: r.text, body_html: r.html, status: 'queued', queued_at: new Date().toISOString() })
    if (ins.error) {
      skipped.push({ email: parent.email, reason: ins.error.message })
      continue
    }
    queued++
  }
  return { mode, due: due.length, queued, skipped }
}
