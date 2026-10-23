/**
 * Google AdSense (2026-10-23). Danny: "until we have a formal paid advertiser…
 * integrate the google ads system into the site and just have google post ads."
 *
 * OFF until the publisher ID is set. Two build-time variables decide it:
 *
 *   NEXT_PUBLIC_ADSENSE_CLIENT  ca-pub-XXXXXXXXXXXXXXXX (from AdSense > Account)
 *   NEXT_PUBLIC_ADSENSE_MODE    off | verify | live (default off)
 *
 *   off     nothing: no tag, no script, no ads.txt, no slots.
 *   verify  what Google needs to review the site: the google-adsense-account
 *           meta tag, the adsbygoogle script and /ads.txt. No ad slots.
 *   live    the above, and the manual ad units render where a slot ID is set:
 *           NEXT_PUBLIC_ADSENSE_SLOT_STORY / _FRONT / _EVENTS. A placement
 *           without its ID renders nothing.
 *
 * Manual units only, never Auto ads (AdSense > Ads > By site: Auto ads stays
 * OFF), so the ads go where the page says and nowhere else. Both are
 * NEXT_PUBLIC_, inlined at build: a change needs a redeploy.
 *
 * The script is a plain async tag in app/layout.tsx <head> (server-rendered, so
 * Google's crawler sees it on every page); the meta tag is in its metadata.
 *
 * Runbook for Danny: ~/fundopshq-workspace/docs/ads/ADSENSE.md.
 */

export type AdsMode = 'off' | 'verify' | 'live'
export type AdPlacement = 'story' | 'front' | 'events'

export interface AdsEnv {
  client?: string
  mode?: string
  slots?: Partial<Record<AdPlacement, string | undefined>>
}

/** The build's own values. Each read is literal, so Next inlines it into the browser bundle. */
export const BUILD_ADS_ENV: AdsEnv = {
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
  mode: process.env.NEXT_PUBLIC_ADSENSE_MODE,
  slots: {
    story: process.env.NEXT_PUBLIC_ADSENSE_SLOT_STORY,
    front: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FRONT,
    events: process.env.NEXT_PUBLIC_ADSENSE_SLOT_EVENTS,
  },
}

const CLIENT_RE = /^ca-pub-\d{10,20}$/
const SLOT_RE = /^\d{6,20}$/

/** The publisher's client ID, trimmed, or null when it is missing or malformed. */
export function adsClient(env: AdsEnv = BUILD_ADS_ENV): string | null {
  const c = env.client?.trim()
  return c && CLIENT_RE.test(c) ? c : null
}

/** off unless the mode says verify or live AND a well-formed client ID is set. */
export function adsMode(env: AdsEnv = BUILD_ADS_ENV): AdsMode {
  const m = env.mode?.trim().toLowerCase()
  if (m !== 'verify' && m !== 'live') return 'off'
  return adsClient(env) ? m : 'off'
}

/** The ad unit ID for a placement, only in live mode and only when it is set. */
export function adSlotId(placement: AdPlacement, env: AdsEnv = BUILD_ADS_ENV): string | null {
  if (adsMode(env) !== 'live') return null
  const s = env.slots?.[placement]?.trim()
  return s && SLOT_RE.test(s) ? s : null
}

/** The script URL Google gives in its "AdSense code" snippet. */
export function adsScriptSrc(env: AdsEnv = BUILD_ADS_ENV): string | null {
  const c = adsMode(env) === 'off' ? null : adsClient(env)
  return c ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${c}` : null
}

/** Google's certification authority ID for its ads.txt line (fixed, from Google's ads.txt guide). */
export const GOOGLE_ADS_TXT_CERT = 'f08c47fec0942fa0'

/** The body of /ads.txt, or null (the route 404s) when ads are off. */
export function adsTxt(env: AdsEnv = BUILD_ADS_ENV): string | null {
  if (adsMode(env) === 'off') return null
  const client = adsClient(env)
  if (!client) return null
  const pub = client.replace(/^ca-/, '')
  return `google.com, ${pub}, DIRECT, ${GOOGLE_ADS_TXT_CERT}\n`
}

/**
 * Pages that never carry an ad, whatever a component asks: the business pages
 * (sponsoring, submitting, joining), the reader's own settings and mail
 * links, the legal pages, and the private ones. Mirrors the takeover's list
 * (lib/newsletter/takeover-rules.ts) plus the private areas.
 */
const NO_ADS = [
  /^\/sponsor/,
  /^\/join(\/|$)/,
  /^\/submit/,
  /^\/events\/submit/,
  /^\/preferences(\/|$)/,
  /^\/unsubscribe(\/|$)/,
  /^\/newsletter\/(unsubscribe|confirm)/,
  /\/confirm(ed)?(\/|$)/,
  /^\/privacy(\/|$)/,
  /^\/terms(\/|$)/,
  /^\/desk(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/brand(\/|$)/,
  /^\/api\//,
]

export function adsAllowedOn(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return !NO_ADS.some((re) => re.test(pathname))
}

/**
 * The hosts AdSense and its consent message load from. The site sets no
 * Content-Security-Policy today (next.config.mjs sets nosniff, frame and
 * referrer headers only); if one is added, these go in script-src, img-src,
 * frame-src and connect-src while the mode is not off.
 */
export const ADSENSE_CSP_HOSTS = [
  'https://pagead2.googlesyndication.com',
  'https://googleads.g.doubleclick.net',
  'https://tpc.googlesyndication.com',
  'https://adservice.google.com',
  'https://www.google.com',
  'https://fundingchoicesmessages.google.com',
] as const
