/**
 * The sponsorship desk's server side (2026-10-09): a request comes in from
 * the builder on /sponsor, waits for the owner's yes or no, and on a yes
 * becomes a booking (lib/sponsor/bookings.ts), which is what the email and
 * the site read.
 *
 * WHY THE OWNER APPROVES EACH ONE. Danny floated a bot that approves by
 * itself. It does everything else by itself; the yes stays his, in one click,
 * because an ad runs under his name in front of his readers, and because
 * whether a firm is a fit (a competitor of his employer, say) is a judgement
 * no rule here can make.
 */
import { revalidateTag } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { fetchBookingRows } from './bookings'
import { LOGO_RULES, NO_LOGO, checkBooking, emailLogoWidth, packageOf, runEnd, runIsFree, type BookingInput } from './packages'
import { approvedMail, decideMail, declinedMail, receivedMail, send, type RequestRow } from './mail'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any>

export const LOGO_BUCKET = 'sponsors'
export const LOGO_MAX_BYTES = LOGO_RULES.maxBytes
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v)

export const todayET = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

/** A picture's size in pixels, read from its own header: a PNG's first chunk, a JPEG's frame marker. Null when it cannot be read. */
export function imageSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50) return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) return null
      const marker = bytes[i + 1]
      // The frame headers (SOF0 to SOF15) carry the size; C4, C8 and CC are other tables.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) }
      i += 2 + bytes.readUInt16BE(i + 2)
    }
  }
  return null
}

export type Logo = { bytes: Buffer; ext: 'png' | 'jpg'; type: string; width: number; height: number }

/** A logo sent with the form: a PNG or JPEG of a sensible size, read from its own first bytes, not from what the browser called it. */
export function readLogo(dataUrl: unknown): Logo | { error: string } | null {
  if (typeof dataUrl !== 'string' || !dataUrl) return null
  const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!m) return { error: 'The logo must be a PNG or JPEG file.' }
  const bytes = Buffer.from(m[2], 'base64')
  if (bytes.length > LOGO_RULES.maxBytes) return { error: 'The logo is too large: keep it under 400 KB.' }
  const png = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const jpg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (!png && !jpg) return { error: 'The logo must be a PNG or JPEG file.' }
  const size = imageSize(bytes)
  if (!size || size.width < 1 || size.height < 1) return { error: 'That logo file could not be read. Try saving it again as a PNG.' }
  if (size.width < LOGO_RULES.minWidth) return { error: `That logo is only ${size.width} pixels wide. Use one at least ${LOGO_RULES.minWidth} pixels wide so it stays sharp.` }
  if (size.width > LOGO_RULES.maxSide || size.height > LOGO_RULES.maxSide) return { error: `That logo is very large. Use one under ${LOGO_RULES.maxSide} pixels a side.` }
  return { bytes, ...size, ...(png ? { ext: 'png' as const, type: 'image/png' } : { ext: 'jpg' as const, type: 'image/jpeg' }) }
}

export type SubmitResult = { ok: true; id: string } | { ok: false; status: number; error: string; errors?: Record<string, string> }

/** Checks a request, files it, and writes to the prospect and to the owner. */
export async function submitRequest(raw: Record<string, unknown>, db: Db = getSupabaseAdmin()): Promise<SubmitResult> {
  const today = todayET()
  const { input, errors } = checkBooking(raw, today)
  if (Object.keys(errors).length) return { ok: false, status: 400, error: 'Some fields need another look.', errors }
  const pkg = packageOf(input.packageId)!

  const logo = readLogo(raw.logoData)
  if (logo && 'error' in logo) return { ok: false, status: 400, error: logo.error, errors: { logo: logo.error } }
  // An ad has its logo (Danny, 2026-10-09: "the logo should be in the ads. The image of their logo").
  if (!logo) return { ok: false, status: 400, error: NO_LOGO, errors: { logo: NO_LOGO } }

  const booked = await fetchBookingRows(db)
  if (!runIsFree(input.startsOn, pkg, booked)) {
    return { ok: false, status: 409, error: 'Part of that run is already booked. Choose a later start or a shorter length.', errors: { startsOn: 'Part of that run is already booked.' } }
  }

  // One firm filling the queue is a mistake or a nuisance, never a customer.
  const { count } = await db.from('sponsor_requests').select('id', { count: 'exact', head: true }).eq('email', input.email).eq('status', 'pending')
  if ((count ?? 0) >= 3) return { ok: false, status: 429, error: 'You already have requests waiting with us. Reply to the email we sent and we will sort it out.' }

  let logoLink: string | null = null
  if (logo) {
    const path = `requests/${crypto.randomUUID()}.${logo.ext}`
    const store = db.storage.from(LOGO_BUCKET)
    const { error } = await store.upload(path, logo.bytes, { contentType: logo.type, upsert: false })
    if (error) console.error('[sponsor] logo upload failed, request filed without it:', error.message)
    else logoLink = store.getPublicUrl(path).data.publicUrl
  }

  const { data, error } = await db
    .from('sponsor_requests')
    .insert({
      package: pkg.id,
      price_usd: pkg.priceUsd,
      starts_on: input.startsOn,
      ends_on: runEnd(input.startsOn, pkg),
      company: input.company,
      contact_name: input.contactName,
      email: input.email,
      website: input.website,
      tagline: input.tagline || null,
      blurb: input.blurb,
      cta_url: input.ctaUrl,
      cta_text: input.ctaText || null,
      logo_link: logoLink ?? (input.logoLink || null),
      // How wide the email draws it, from the file's own shape; kept so the booking draws it as the preview did.
      logo_width: logo && logoLink ? emailLogoWidth(logo.width, logo.height) : null,
      notes: input.notes || null,
      arrived_from: typeof raw.arrivedFrom === 'string' ? raw.arrivedFrom.slice(0, 120) : null,
    })
    .select('*')
    .single()
  if (error || !data) {
    console.error('[sponsor] request could not be filed:', error?.code, error?.message)
    return { ok: false, status: 500, error: 'We could not file that. Please try again, or write to sponsor@fundopshq.com.' }
  }
  const row = data as RequestRow
  await Promise.all([send(receivedMail(row)), send(decideMail(row))])
  return { ok: true, id: row.id }
}

export async function requestByToken(token: string, db: Db = getSupabaseAdmin()): Promise<RequestRow | null> {
  if (!isUuid(token)) return null
  const { data } = await db.from('sponsor_requests').select('*').eq('action_token', token).maybeSingle()
  return (data as RequestRow | null) ?? null
}

/** A logo we host ourselves can go straight into the booking; one that is only a link somewhere else waits to be placed by hand. */
export function hostedLogo(link: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return link && base && link.startsWith(`${base}/storage/v1/object/public/${LOGO_BUCKET}/`) ? link : null
}

export type DecideResult = { ok: true; status: 'approved' | 'declined'; row: RequestRow } | { ok: false; status: number; error: string }

/** The owner's yes or no. A yes books the run (the table refuses a run that overlaps another) and tells the sponsor. */
export async function decideRequest(token: string, action: 'approve' | 'decline', db: Db = getSupabaseAdmin()): Promise<DecideResult> {
  const row = await requestByToken(token, db)
  if (!row) return { ok: false, status: 404, error: 'That request could not be found.' }
  if (row.status !== 'pending') return { ok: false, status: 409, error: `This request was already ${row.status}.` }
  const now = new Date().toISOString()

  if (action === 'decline') {
    const { error } = await db.from('sponsor_requests').update({ status: 'declined', decided_at: now }).eq('id', row.id).eq('status', 'pending')
    if (error) return { ok: false, status: 500, error: 'Could not be saved. Try again.' }
    await send(declinedMail(row))
    return { ok: true, status: 'declined', row: { ...row, status: 'declined' } }
  }

  const logo = hostedLogo(row.logo_link)
  const { data: booking, error: bookError } = await db
    .from('sponsor_bookings')
    .insert({
      name: row.company,
      blurb: row.blurb,
      tagline: row.tagline,
      cta_url: row.cta_url,
      cta_text: row.cta_text,
      logo_url: logo,
      logo_width: logo ? row.logo_width ?? 160 : null,
      starts_on: row.starts_on,
      ends_on: row.ends_on,
      status: 'booked',
      note: `From sponsor request ${row.id} (${row.contact_name} <${row.email}>), ${row.package}, $${row.price_usd}`,
    })
    .select('id')
    .single()
  if (bookError || !booking) {
    // 23P01: the exclusion constraint. Someone else holds a day of this run.
    const taken = bookError?.code === '23P01'
    console.error('[sponsor] booking failed:', bookError?.code, bookError?.message)
    return { ok: false, status: taken ? 409 : 500, error: taken ? 'Those dates are no longer free: another sponsor is booked for part of the run. Decline, or reply to them with other dates.' : `The booking could not be made (${bookError?.message ?? 'unknown'}).` }
  }
  await db.from('sponsor_requests').update({ status: 'approved', decided_at: now, booking_id: booking.id }).eq('id', row.id)
  // The site shows the new sponsor on its next request, not in ten minutes.
  revalidateTag('sponsors', { expire: 0 })
  const approved = { ...row, status: 'approved', booking_id: booking.id as string }
  await send(approvedMail(approved))
  return { ok: true, status: 'approved', row: approved }
}

export type { BookingInput }
