/**
 * Booked sponsors — one source for the newsletter and the site.
 *
 * A booking is a row in `sponsor_bookings` with a start and an end date. The
 * daily send asks for the sponsor in force on the edition's date; the site asks
 * for the one in force today. Nothing is deployed to put a sponsor up and
 * nothing has to be remembered to take one down: the dates do both. With no
 * booking in force, the email and the site show the house "Your firm here"
 * notice.
 *
 * One sponsor at a time. The table refuses two booked runs that share a day,
 * and sponsorOn() returns one sponsor whatever the table says.
 *
 * TO BOOK A SPONSOR: insert a row (name, blurb ≤ ~60 words, cta_url https,
 * optional cta_text / tagline / logo_url + logo_width, starts_on, ends_on).
 * The site shows it within ten minutes; the next edition carries it.
 * TO PULL ONE: set status = 'paused' (or 'cancelled').
 */
import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import type { Sponsor, SponsorSlate } from '@/lib/newsletter/sponsors'

export interface BookingRow {
  id: string
  name: string
  blurb: string
  tagline: string | null
  cta_url: string
  cta_text: string | null
  logo_url: string | null
  logo_width: number | null
  starts_on: string
  ends_on: string
  status: string
  created_at: string
}

/** A sponsor whose run covers the date asked about. */
export interface BookedSponsor extends Sponsor {
  id: string
  /** One line for the strip at the top of site pages; the blurb is used when absent. */
  tagline: string | null
  startsOn: string
  endsOn: string
}

import { SPONSOR_LABEL } from './label'
export { SPONSOR_LABEL }

const HTTPS = /^https:\/\/[^\s"'<>]+$/
const RASTER = /^https:\/\/[^\s"'<>]+\.(png|jpe?g|gif)(\?[^\s"'<>]*)?$/i
const day = (v: string) => String(v).slice(0, 10)

/**
 * The sponsor in force on `dateIso`, or null. Pure.
 *
 * The table's own checks should make every row valid; they are checked again
 * here because what this returns is rendered into an email that cannot be
 * recalled. A row that fails is skipped, never half-rendered.
 */
export function sponsorOn(rows: BookingRow[], dateIso: string): BookedSponsor | null {
  const live = rows
    .filter((r) => r.status === 'booked' && day(r.starts_on) <= dateIso && dateIso <= day(r.ends_on))
    .filter((r) => r.name?.trim() && r.blurb?.trim() && HTTPS.test(r.cta_url ?? ''))
    // Should two ever overlap, the one booked first holds the dates.
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
  const r = live[0]
  if (!r) return null
  const logoUrl = r.logo_url && RASTER.test(r.logo_url) ? r.logo_url : undefined
  return {
    id: r.id,
    name: r.name.trim(),
    blurb: r.blurb.trim(),
    tagline: r.tagline?.trim() || null,
    ctaUrl: r.cta_url,
    ctaText: r.cta_text?.trim() || undefined,
    logoUrl,
    logoWidth: logoUrl ? r.logo_width ?? 160 : undefined,
    startsOn: day(r.starts_on),
    endsOn: day(r.ends_on),
  }
}

/**
 * The last day of the run in force on `dateIso`, following back-to-back
 * bookings to their end — "booked through October 31". Null when the slot is
 * open today.
 */
export function bookedThrough(rows: BookingRow[], dateIso: string): string | null {
  const booked = rows.filter((r) => r.status === 'booked').sort((a, b) => day(a.starts_on).localeCompare(day(b.starts_on)))
  let end: string | null = null
  for (const r of booked) {
    const start = day(r.starts_on)
    const stop = day(r.ends_on)
    if (end === null) {
      if (start <= dateIso && dateIso <= stop) end = stop
      continue
    }
    const next = new Date(`${end}T12:00:00Z`)
    next.setUTCDate(next.getUTCDate() + 1)
    if (start <= next.toISOString().slice(0, 10) && stop > end) end = stop
  }
  return end
}

/** The email's sponsor block for a sponsor (or for none: an empty slate renders the house notice). */
export function slateFor(sponsor: BookedSponsor | null): SponsorSlate {
  return { label: SPONSOR_LABEL.toUpperCase(), sponsors: sponsor ? [sponsor] : [] }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

const todayET = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

/** Booked runs that have not ended. A missing table (a fresh environment) is "no sponsors", not an error. */
export async function fetchBookingRows(supabase: DbClient = getSupabaseAdmin()): Promise<BookingRow[]> {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('sponsor_bookings')
    .select('id, name, blurb, tagline, cta_url, cta_text, logo_url, logo_width, starts_on, ends_on, status, created_at')
    .eq('status', 'booked')
    .gte('ends_on', yesterday)
    .order('starts_on', { ascending: true })
    .limit(50)
  if (error) {
    console.error('[sponsors] bookings unavailable:', error.message)
    return []
  }
  return (data ?? []) as BookingRow[]
}

/** For the daily send: the sponsor on the edition's date, read fresh. Never throws. */
export async function sponsorForEdition(supabase: DbClient, editionDate: string): Promise<BookedSponsor | null> {
  try {
    return sponsorOn(await fetchBookingRows(supabase), editionDate)
  } catch (err) {
    console.error('[sponsors] lookup failed, sending with the house notice:', err)
    return null
  }
}

export interface SiteSponsorState {
  sponsor: BookedSponsor | null
  /** Last day of the current run (back-to-back bookings included), or null when the slot is open. */
  bookedThrough: string | null
}

const getSiteState = unstable_cache(
  async (): Promise<SiteSponsorState> => {
    const rows = await fetchBookingRows()
    const today = todayET()
    return { sponsor: sponsorOn(rows, today), bookedThrough: bookedThrough(rows, today) }
  },
  ['site-sponsor-v1'],
  { revalidate: 600, tags: ['sponsors'] },
)

/** For the site: today's sponsor, cached ten minutes. Never throws. */
export async function getSiteSponsorState(): Promise<SiteSponsorState> {
  try {
    return await getSiteState()
  } catch (err) {
    console.error('[sponsors] site lookup failed:', err)
    return { sponsor: null, bookedThrough: null }
  }
}
