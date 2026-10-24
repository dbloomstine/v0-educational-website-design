/**
 * Firm logos for the directory (2026-10-24 night, Danny: "there should be company logos").
 *
 * Each mark comes ONLY from the firm's own website (the logo in its header, an inline SVG drawn to PNG, or its
 * apple-touch-icon) or Wikimedia Commons: the social desk's rule and its lookup (social/engine/logos.mjs
 * lookupSite), keyed by the domain on file. Cropped to the mark and kept as static files under
 * public/logos/directory/, listed in lib/directory/logos.json with where each came from and when. A firm with no
 * mark on file gets a monogram, never a guess.
 *
 * How a mark is drawn (`mode`, set when it was fetched from its own pixels):
 *   ink    one colour (or one colour on clear): drawn as a single-ink silhouette, so a page of logos reads as print;
 *   plate  light and dark parts on clear (a white wordmark beside a coloured symbol): in greys on an ink plate;
 *   own    the file has its own background (an app icon): in greys, as it is.
 */
import manifest from './logos.json'

export type LogoMode = 'ink' | 'plate' | 'own'

export interface FirmLogo {
  src: string
  width: number
  height: number
  mode: LogoMode
}

interface Entry {
  name: string
  file: string | null
  width?: number
  height?: number
  mode?: string
}

const FIRMS = (manifest as { firms: Record<string, Entry> }).firms

const bare = (domain: string) => domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')

/** The firm's mark by its domain, or null. */
export function logoFor(domain: string | null | undefined): FirmLogo | null {
  const e = domain ? FIRMS[bare(domain)] : undefined
  if (!e?.file || !e.width || !e.height) return null
  const mode: LogoMode = e.mode === 'plate' || e.mode === 'own' ? e.mode : 'ink'
  return { src: e.file, width: e.width, height: e.height, mode }
}

const SKIP = new Set(['and', 'the', 'of', 'llp', 'llc', 'lp', 'inc', 'co', 'company', 'pc', 'pllc', 'ltd', 'group', 'partners', 'associates', 'capital', 'advisors', 'advisers'])

/**
 * A firm with no mark gets letters: an all-capitals first word of two to four letters as it is, up to three
 * ("EY", "BDO USA" → "BDO", "PJT Park Hill" → "PJT"), else the initials of the first two words that tell firms
 * apart ("Hodes Weill & Associates" → "HW", "Park Madison Partners" → "PM").
 */
export function monogram(name: string): string {
  const clean = name.replace(/\(.*?\)/g, ' ').replace(/[^\p{L}\p{N}&' ]+/gu, ' ').trim()
  const words = clean.split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  if (/^[A-Z0-9]{2,4}$/.test(words[0])) return words[0].slice(0, 3)
  const telling = words.filter((w) => w !== '&' && !SKIP.has(w.toLowerCase()))
  const pick = (telling.length ? telling : words).slice(0, 2)
  return pick.map((w) => w[0]!.toUpperCase()).join('')
}
