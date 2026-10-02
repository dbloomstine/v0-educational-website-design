/**
 * Live numbers for the sponsor page.
 *
 * THE RULE (Danny, 2026-10-01: "write a rule so that it all stays up to date"):
 * the sponsor page prints no number that is typed into a file. Every figure
 * is computed here from the subscriber table, the editions table and Resend's
 * delivery records, cached for twelve hours. The page had said "98 confirmed
 * readers" for weeks while the list was at 145.
 *
 * Each figure is independently nullable. If Resend is unreachable the page
 * shows the numbers it can stand behind and omits the rest — it never falls
 * back to a remembered value.
 */
import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { currentReaderFirms, isPersonalDomain, type ReaderGroup } from './reader-firms'

export interface SponsorStats {
  /** Confirmed subscribers. */
  subscribers: number | null
  /** Distinct firm (non-personal) email domains among them. */
  firms: number | null
  /** Named firms with a confirmed reader today, by group. */
  readerFirms: { group: ReaderGroup; firms: string[] }[]
  editionsSent: number | null
  /** ISO date of the first edition. */
  firstEdition: string | null
  /** Average stories per edition, last 30 editions. */
  storiesPerEdition: number | null
  /** Share of delivered emails opened, over the editions measured. 0–100. */
  openRate: number | null
  /** Share of delivered emails with a click. 0–100. */
  clickRate: number | null
  /** Share of readers who opened at least one of the editions measured. 0–100. */
  weeklyReach: number | null
  /** How many editions the engagement figures cover. */
  editionsMeasured: number
  /** ISO timestamp the figures were computed. */
  asOf: string
}

const OPENED = new Set(['opened', 'clicked'])
const DELIVERED = new Set(['delivered', 'opened', 'clicked'])
/** Editions the engagement figures are measured over. */
const ENGAGEMENT_EDITIONS = 7

interface ResendRow { id: string; last_event: string | null; created_at: string }

/** Page Resend's email list back to `untilMs`, collecting the last event per email id. */
async function resendEvents(apiKey: string, wanted: Set<string>, untilMs: number): Promise<Map<string, string>> {
  const events = new Map<string, string>()
  let after: string | null = null
  for (let page = 0; page < 30; page++) {
    const url = `https://api.resend.com/emails?limit=100${after ? `&after=${after}` : ''}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' })
    if (!res.ok) throw new Error(`Resend list ${res.status}`)
    const body = (await res.json()) as { data?: ResendRow[]; has_more?: boolean }
    const rows = body.data ?? []
    for (const r of rows) if (wanted.has(r.id) && r.last_event) events.set(r.id, r.last_event)
    const last = rows[rows.length - 1]
    if (!last || !body.has_more) break
    if (events.size >= wanted.size || new Date(last.created_at).getTime() < untilMs) break
    after = last.id
    // Resend allows two requests a second.
    await new Promise((r) => setTimeout(r, 600))
  }
  return events
}

export interface SponsorAudience {
  subscribers: number | null
  firms: number | null
  readerFirms: { group: ReaderGroup; firms: string[] }[]
}

/** Who reads it: confirmed subscribers and the firms they read from. One small query. */
export async function computeAudience(): Promise<SponsorAudience> {
  const { data: subs } = await getSupabaseAdmin().from('newsletter_subscribers').select('email').eq('status', 'confirmed').limit(10000)
  if (!subs) return { subscribers: null, firms: null, readerFirms: [] }
  const domains = subs.map((s) => String(s.email).toLowerCase().split('@')[1] ?? '').filter(Boolean)
  // Our own domain is not a reader firm.
  const firmDomains = new Set(domains.filter((d) => !isPersonalDomain(d) && d !== 'fundopshq.com'))
  return { subscribers: subs.length, firms: firmDomains.size, readerFirms: currentReaderFirms(firmDomains) }
}

/**
 * The audience alone, for the house ad that runs on news pages. It does not
 * wait on the delivery records the full stats need, so a cold cache costs one
 * quick query rather than a dozen calls to the mail platform.
 */
export const getSponsorAudience = unstable_cache(computeAudience, ['sponsor-audience-v1'], {
  revalidate: 43_200,
  tags: ['sponsor-stats'],
})

export async function computeSponsorStats(): Promise<SponsorStats> {
  const supabase = getSupabaseAdmin()
  const stats: SponsorStats = {
    subscribers: null, firms: null, readerFirms: [], editionsSent: null, firstEdition: null,
    storiesPerEdition: null, openRate: null, clickRate: null, weeklyReach: null,
    editionsMeasured: 0, asOf: new Date().toISOString(),
  }

  // ── Subscribers and the firms they read from ──
  // The raw function, not its cached wrapper: a cache call nested inside
  // another cached function is not shared.
  const audience = await computeAudience()
  stats.subscribers = audience.subscribers
  stats.firms = audience.firms
  stats.readerFirms = audience.readerFirms

  // ── Editions ──
  const { data: editions } = await supabase
    .from('newsletter_editions')
    .select('edition_date, article_count, sent_at, resend_email_ids')
    .eq('status', 'sent')
    .order('edition_date', { ascending: false })
    .limit(30)
  const { count } = await supabase.from('newsletter_editions').select('id', { count: 'exact', head: true }).eq('status', 'sent')
  const { data: first } = await supabase.from('newsletter_editions').select('edition_date').eq('status', 'sent').order('edition_date', { ascending: true }).limit(1)
  stats.editionsSent = count ?? null
  stats.firstEdition = first?.[0]?.edition_date ?? null
  if (editions?.length) {
    stats.storiesPerEdition = Math.round(editions.reduce((sum, e) => sum + (e.article_count ?? 0), 0) / editions.length)
  }

  // ── Engagement: the last seven editions that have had a day to be read ──
  const apiKey = process.env.RESEND_API_KEY
  const settled = (editions ?? [])
    .filter((e) => e.sent_at && Date.now() - new Date(e.sent_at).getTime() > 20 * 3_600_000)
    .slice(0, ENGAGEMENT_EDITIONS)
  if (apiKey && settled.length > 0) {
    try {
      const idToEmail = new Map<string, string>()
      for (const e of settled) {
        for (const [email, id] of Object.entries((e.resend_email_ids ?? {}) as Record<string, string>)) idToEmail.set(id, email)
      }
      const oldest = Math.min(...settled.map((e) => new Date(e.sent_at as string).getTime()))
      const events = await resendEvents(apiKey, new Set(idToEmail.keys()), oldest - 3_600_000)
      let delivered = 0, opened = 0, clicked = 0
      const readers = new Set<string>(), openers = new Set<string>()
      for (const [id, event] of events) {
        if (!DELIVERED.has(event)) continue
        const email = idToEmail.get(id) as string
        delivered++
        readers.add(email)
        if (OPENED.has(event)) { opened++; openers.add(email) }
        if (event === 'clicked') clicked++
      }
      // Too few records to mean anything → say nothing rather than a noisy number.
      if (delivered >= 100) {
        stats.openRate = Math.round((opened / delivered) * 100)
        stats.clickRate = Math.round((clicked / delivered) * 100)
        stats.weeklyReach = Math.round((openers.size / readers.size) * 100)
        stats.editionsMeasured = settled.length
      }
    } catch (err) {
      console.error('[sponsor-stats] engagement unavailable:', err)
    }
  }

  return stats
}

export const getSponsorStats = unstable_cache(computeSponsorStats, ['sponsor-stats-v1'], {
  revalidate: 43_200,
  tags: ['sponsor-stats'],
})
