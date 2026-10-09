/**
 * What a sponsor can buy, and for how much (2026-10-09).
 *
 * Danny: "think through all the different sponsorship options we should
 * offer... keep it simple... someone able to read it, digest it, understand
 * it, nod their head and say yes... assume some pricing... pretty self-serve."
 *
 * A FULL TAKEOVER (Danny, 2026-10-09: "to keep it simple it should be a full takeover: if someone
 * sponsors the platform for a week, they get the website sponsorship and the newsletter
 * sponsorship"). There is no newsletter-only or site-only option and never a second sponsor: the
 * buyer chooses how long, and nothing else.
 *
 * ONE PRODUCT, THREE LENGTHS. There is one sponsor slot (the email, top and
 * foot, and the site: lib/sponsor/bookings.ts), so the offer is that slot for
 * a week, four weeks or a quarter. A run starts on a Monday. Everything a
 * buyer has to weigh is the length. Left out on purpose, for now: featured
 * events (each needs its date verified first), sponsored posts on social
 * (TikTok wants paid promotion labelled and our scheduler cannot set the
 * label), and sponsored articles (we do not sell coverage).
 *
 * THE PRICES are flat fees for a young list, set on 2026-10-09 from what small
 * newsletters publish (research: a survey of 321 newsletters put the middle
 * price of a main slot on a list under 5,000 at $150 an issue; small lists
 * are priced flat, not per subscriber; bundles run 12 to 25% off; nobody
 * offers more than four products). A week of seven editions plus the site at
 * $400 sits under that per issue because the list is small; four weeks is a
 * quarter off. No comparable B2B finance list of this size publishes a price,
 * so these are a judgement. They are the only figures typed anywhere in the
 * sponsorship pages; the audience numbers beside them
 * are counted (lib/sponsor/stats.ts). Change a price here and the page, the
 * form, the emails and the stored request all follow.
 *
 * Browser-safe: no server imports.
 */

export interface SponsorPackage {
  id: 'week' | 'month' | 'quarter'
  name: string
  /** Days in the run, starting on a Monday. */
  days: number
  /** Editions of the daily email in the run (it goes out seven mornings a week). */
  editions: number
  priceUsd: number
  /** One line under the price. */
  line: string
}

export const PACKAGES: SponsorPackage[] = [
  { id: 'week', name: 'One week', days: 7, editions: 7, priceUsd: 400, line: 'The whole of FundOpsHQ for a week. For a launch, a hire or an event.' },
  { id: 'month', name: 'Four weeks', days: 28, editions: 28, priceUsd: 1200, line: 'A month of mornings, at a quarter off the weekly rate. Where most sponsors should start.' },
  { id: 'quarter', name: 'A quarter', days: 91, editions: 91, priceUsd: 3000, line: 'Thirteen weeks: yours for a season, at the lowest rate.' },
]

export const packageOf = (id: unknown): SponsorPackage | undefined => PACKAGES.find((p) => p.id === id)

export const usd = (n: number) => `$${n.toLocaleString('en-US')}`

/** Creative has to be in hand two days before the first send, and someone has to say yes: the soonest Monday is at least this far off. */
export const LEAD_DAYS = 3
/** How many Mondays the form offers. */
export const WEEKS_OFFERED = 10

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const isMonday = (iso: string) => /^\d{4}-\d\d-\d\d$/.test(iso) && new Date(`${iso}T12:00:00Z`).getUTCDay() === 1

/** The last day of a run that starts on `startIso`. */
export const runEnd = (startIso: string, pkg: SponsorPackage) => addDays(startIso, pkg.days - 1)

export interface Taken {
  starts_on: string
  ends_on: string
}
const overlaps = (aStart: string, aEnd: string, b: Taken) => aStart <= b.ends_on.slice(0, 10) && b.starts_on.slice(0, 10) <= aEnd

/** True when nothing booked shares a day with the run. */
export function runIsFree(startIso: string, pkg: SponsorPackage, taken: Taken[]): boolean {
  const end = runEnd(startIso, pkg)
  return !taken.some((t) => overlaps(startIso, end, t))
}

/**
 * The Mondays a run could start on, soonest first: far enough off for the
 * creative, and with at least their own week free. (A longer run is checked
 * in full when it is asked for, and again when it is approved.)
 */
export function openMondays(todayIso: string, taken: Taken[], count = WEEKS_OFFERED): string[] {
  let day = addDays(todayIso, LEAD_DAYS)
  while (!isMonday(day)) day = addDays(day, 1)
  const out: string[] = []
  for (let i = 0; i < 40 && out.length < count; i++, day = addDays(day, 7)) {
    if (runIsFree(day, PACKAGES[0], taken)) out.push(day)
  }
  return out
}

export const longDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
export const shortDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/* ───────── what a booking request must look like ───────── */

// The firm's name is set large and never wraps, so it is held to what fits a phone's width.
export const LIMITS = { company: 40, contact: 80, tagline: 110, blurbWords: 60, blurbChars: 560, ctaText: 28, notes: 600 } as const

/** What a logo file must be: small enough to send, large enough to be sharp, not absurd. */
export const LOGO_RULES = { maxBytes: 400_000, minWidth: 120, maxSide: 4000 } as const

/**
 * How wide a logo is drawn in the email, from its own shape, so that a wide wordmark and a square
 * mark both come out about the same height (the email sets a width and lets the height follow).
 */
export function emailLogoWidth(width: number, height: number): number {
  if (!(width > 0) || !(height > 0)) return 160
  return Math.max(70, Math.min(220, Math.round((44 * width) / height)))
}

export interface BookingInput {
  packageId: string
  startsOn: string
  company: string
  contactName: string
  email: string
  website: string
  tagline: string
  blurb: string
  ctaUrl: string
  ctaText: string
  logoLink: string
  notes: string
}

const HTTPS = /^https:\/\/[^\s"'<>]{4,300}$/
/** A real web address: https, a host with a dot in it, no user name or password tucked inside, nothing that is not a web page. */
export function isWebUrl(value: string): boolean {
  if (!HTTPS.test(value)) return false
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && !u.username && !u.password && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname)
  } catch {
    return false
  }
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const text = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '')
/** "acme.com" → "https://acme.com": people type a site the way they say it. */
export const asUrl = (v: unknown) => {
  const t = text(v)
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t.replace(/^http:\/\//i, 'https://') : `https://${t}`
}

/** Tidies what the form sent and says, field by field, what is wrong with it. Used in the browser and again on the server. */
export function checkBooking(raw: Record<string, unknown>, todayIso: string): { input: BookingInput; errors: Record<string, string> } {
  const input: BookingInput = {
    packageId: text(raw.packageId),
    startsOn: text(raw.startsOn),
    company: text(raw.company),
    contactName: text(raw.contactName),
    email: text(raw.email).toLowerCase(),
    website: asUrl(raw.website),
    tagline: text(raw.tagline),
    blurb: text(raw.blurb),
    ctaUrl: asUrl(raw.ctaUrl),
    ctaText: text(raw.ctaText),
    logoLink: asUrl(raw.logoLink),
    notes: typeof raw.notes === 'string' ? raw.notes.trim().slice(0, LIMITS.notes) : '',
  }
  const errors: Record<string, string> = {}
  if (!packageOf(input.packageId)) errors.packageId = 'Choose a length.'
  if (!isMonday(input.startsOn) || input.startsOn < addDays(todayIso, LEAD_DAYS)) errors.startsOn = 'Choose a start date from the list.'
  if (input.company.length < 2 || input.company.length > LIMITS.company) errors.company = 'Your firm’s name, as it should appear.'
  if (input.contactName.length < 2 || input.contactName.length > LIMITS.contact) errors.contactName = 'Your name.'
  if (!EMAIL.test(input.email) || input.email.length > 120) errors.email = 'A work email we can reply to.'
  if (!isWebUrl(input.website)) errors.website = 'Your firm’s website.'
  if (input.tagline && (input.tagline.length < 10 || input.tagline.length > LIMITS.tagline)) errors.tagline = `One line, 10 to ${LIMITS.tagline} characters, or leave it empty.`
  if (input.blurb.length < 20) errors.blurb = 'A sentence or two about what you are promoting.'
  else if (words(input.blurb) > LIMITS.blurbWords || input.blurb.length > LIMITS.blurbChars) errors.blurb = `Up to ${LIMITS.blurbWords} words.`
  if (!isWebUrl(input.ctaUrl)) errors.ctaUrl = 'The page your link should open.'
  if (input.ctaText && (input.ctaText.length < 2 || input.ctaText.length > LIMITS.ctaText)) errors.ctaText = `Up to ${LIMITS.ctaText} characters, or leave it empty.`
  if (input.logoLink && !isWebUrl(input.logoLink)) errors.logoLink = 'A link to your logo, or leave it empty and email it.'
  return { input, errors }
}

export const wordCount = words
