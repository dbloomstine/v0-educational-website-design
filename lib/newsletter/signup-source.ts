/**
 * Where a subscriber came from (2026-10-08).
 *
 * On a visitor's first page view in a session the browser works out a short
 * label for how they arrived (`captureSignupSource`, called from
 * components/signup-source-capture.tsx), keeps it in sessionStorage, and the
 * three subscribe forms send it with the signup. The server checks it again
 * (`sanitizeSignupSource`) and stores it on the subscriber's row the first
 * time that address signs up. No cookie, no third-party script, nothing sent
 * anywhere but our own subscribe route.
 *
 * Browser-safe: no server imports. Everything that stores or sends a value
 * passes it through the same pattern, so a value that is not short,
 * lower-case and made of letters, digits, dot, dash and underscore is dropped.
 */

export interface SignupSource {
  /** utm_source, else a label for the referrer: tiktok, google, direct, a bare host. */
  source?: string
  /** utm_medium: bio, video, email... */
  medium?: string
  /** utm_campaign */
  campaign?: string
  /** The first path the visitor landed on, without query or hash. */
  path?: string
}

const TOKEN = /^[a-z0-9._-]{1,40}$/
const PATH = /^\/[a-z0-9._/-]{0,119}$/

const STORAGE_KEY = 'fops_signup_src'

/** Our own address: a referrer from it says nothing about where the visitor came from. */
const OWN_DOMAIN = 'fundopshq.com'

/** Old links already in inboxes carry ?ref=fwd (forwarded edition) or ?ref=share (the share buttons). */
const REF_ALIASES: Record<string, SignupSource> = {
  fwd: { source: 'newsletter', medium: 'email', campaign: 'forward' },
  share: { source: 'newsletter', medium: 'share' },
}

function clean(value: unknown, pattern: RegExp): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim().toLowerCase()
  return pattern.test(v) ? v : undefined
}

/** Keeps only the values that pass the pattern. Used on the server for whatever the request carried. */
export function sanitizeSignupSource(raw: unknown): SignupSource {
  if (!raw || typeof raw !== 'object') return {}
  const r = raw as Record<string, unknown>
  const out: SignupSource = {}
  const source = clean(r.source, TOKEN)
  const medium = clean(r.medium, TOKEN)
  const campaign = clean(r.campaign, TOKEN)
  const path = clean(r.path, PATH)
  if (source) out.source = source
  if (medium) out.medium = medium
  if (campaign) out.campaign = campaign
  if (path) out.path = path
  return out
}

function hostIs(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

/**
 * A referrer URL reduced to a short label. `direct` when there is none (or it
 * is our own site); undefined when the host is not something we can store.
 */
export function referrerLabel(referrer: string, ownHost = ''): string | undefined {
  if (!referrer) return 'direct'
  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return undefined
  }
  if (!host) return 'direct'
  const own = ownHost.toLowerCase().replace(/^www\./, '')
  if (hostIs(host, OWN_DOMAIN) || (own && host === own)) return 'direct'

  if (hostIs(host, 'tiktok.com')) return 'tiktok'
  if (hostIs(host, 'linkedin.com') || host === 'lnkd.in') return 'linkedin'
  if (hostIs(host, 'instagram.com')) return 'instagram'
  if (hostIs(host, 'facebook.com') || hostIs(host, 'fb.com') || host === 'fb.me') return 'facebook'
  if (hostIs(host, 'x.com') || hostIs(host, 'twitter.com') || host === 't.co') return 'x'
  // google.com, google.co.uk, google.de... but not mail.google.com (a click from Gmail is not a search).
  if (/^google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host)) return 'google'
  if (hostIs(host, 'bing.com')) return 'bing'
  if (hostIs(host, 'duckduckgo.com')) return 'duckduckgo'
  return clean(host, TOKEN)
}

/** Works out the source of a page view from its address and referrer. UTM values win over the referrer. */
export function computeSignupSource(page: { href: string; referrer?: string; ownHost?: string }): SignupSource {
  let url: URL
  try {
    url = new URL(page.href)
  } catch {
    return {}
  }
  const q = url.searchParams
  const out: SignupSource = {}

  const source = clean(q.get('utm_source'), TOKEN)
  const medium = clean(q.get('utm_medium'), TOKEN)
  const campaign = clean(q.get('utm_campaign'), TOKEN)
  const alias = REF_ALIASES[clean(q.get('ref'), TOKEN) ?? '']

  if (source) {
    out.source = source
  } else if (alias) {
    Object.assign(out, alias)
  } else if (q.has('e')) {
    // The outreach emails' subscribe link (?e=<encoded address>). Only that it is
    // there matters; the value is the visitor's address and is never read here.
    out.source = 'outreach'
    out.medium = 'email'
  } else {
    const label = referrerLabel(page.referrer ?? '', page.ownHost)
    if (label) out.source = label
  }
  if (medium) out.medium = medium
  if (campaign) out.campaign = campaign

  const path = clean(url.pathname, PATH)
  if (path) out.path = path
  return out
}

let remembered: SignupSource | undefined

/**
 * The visitor's first touch in this session. The first call computes it from
 * the current page and keeps it (sessionStorage, and in memory in case storage
 * is blocked); every later call, on any page, returns the same thing.
 */
export function captureSignupSource(): SignupSource {
  if (remembered) return remembered
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return (remembered = sanitizeSignupSource(parsed))
    }
  } catch {
    // storage blocked or holding something else: work it out again
  }
  remembered = computeSignupSource({
    href: window.location.href,
    referrer: document.referrer,
    ownHost: window.location.hostname,
  })
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(remembered))
  } catch {
    // private window: the in-memory copy still holds for client-side navigation
  }
  return remembered
}

/** What a subscribe form sends along with the address (undefined when there is nothing to say). */
export function signupSourceForRequest(): SignupSource | undefined {
  const s = captureSignupSource()
  return Object.keys(s).length ? s : undefined
}

/** The subscriber-row columns for a source. Only values that exist, so an empty one adds nothing to the insert. */
export function signupColumns(s: SignupSource): Record<string, string> {
  const cols: Record<string, string> = {}
  if (s.source) cols.signup_source = s.source
  if (s.medium) cols.signup_medium = s.medium
  if (s.campaign) cols.signup_campaign = s.campaign
  if (s.path) cols.signup_landing_path = s.path
  return cols
}
