/**
 * Firm pages — everything we have carried about one manager, investor or
 * service provider over the past year.
 *
 * A firm is identified by the same normalised key the story clustering uses
 * (entityKey: "Ares Management" → "ares"), so a firm's page address, its
 * stories and its league-table rows all agree on who it is. There is no firm
 * table to maintain: a page exists for any name the stories carry, and stops
 * existing when they stop.
 */
import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { ALL_NEWSLETTER_TYPES } from '@/lib/newsletter/query-articles'
import { entityKey, keysMatch } from '@/lib/newsletter/story-links'
import { buildStories, type Story } from './stories'
import { acronymOf, type FundClose } from './league'
import { getLeagueSafe, LEAGUE_COLUMNS } from './league-data'

export const FIRM_WINDOW_DAYS = 365

export interface FirmPage {
  slug: string
  name: string
  /** Stories where the firm is the subject. */
  stories: Story[]
  /** Stories that name it alongside someone else (the other side of a deal, a new hire's old shop). */
  mentions: Story[]
  closes: FundClose[]
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+){0,7}$/

/** True when `name` is this firm: the same key, a longer form of it, or the name whose initials it is. */
function isFirm(name: string | null | undefined, key: string): boolean {
  if (!name) return false
  const k = entityKey(name)
  if (!k) return false
  return keysMatch(k, key) || acronymOf(name) === key.replace(/ /g, '')
}

async function computeFirm(slug: string): Promise<FirmPage | null> {
  const key = slug.replace(/-/g, ' ')
  const since = new Date(Date.now() - FIRM_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
  // Tokens are [a-z0-9] only (SLUG_RE), so they are safe inside the filter string.
  // "and" is dropped: the key for "Kirkland & Ellis" says "and", the reports say "&".
  const like = `%${key.split(' ').filter((t) => t !== 'and').join('%')}%`
  // Two lookups, not one OR: a short name ("ares") is inside thousands of
  // headlines ("shares"), and those would crowd the firm's own rows out of a
  // single limited result.
  const base = () =>
    getSupabaseAdmin()
      .from('news_items')
      .select(LEAGUE_COLUMNS)
      .eq('classification_status', 'complete')
      .eq('is_duplicate', false)
      .gte('published_date', since)
      .or('is_high_signal.eq.true,relevance_score.gte.0.3')
      .in('article_type', ALL_NEWSLETTER_TYPES)
      .order('published_date', { ascending: false })
  const [asSubject, inHeadline] = await Promise.all([
    base().ilike('extracted_data->>firm_name', like).limit(600),
    base().ilike('title', like).limit(300),
  ])
  if (asSubject.error) throw new Error(`firm query failed: ${asSubject.error.message}`)
  const seen = new Set<string>()
  const data = [...(asSubject.data ?? []), ...(inHeadline.data ?? [])].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))

  const all = buildStories(data).filter((s) => !s.roundup)
  const stories = all.filter((s) => isFirm(s.firmName, key))
  const taken = new Set(stories.map((s) => s.id))
  const mentions = all.filter((s) => !taken.has(s.id) && s.entities.some((e) => isFirm(e, key)))
  if (stories.length === 0 && mentions.length === 0) return null

  // The name as the reports most often write it.
  const names = new Map<string, number>()
  for (const s of stories) if (s.firmName) names.set(s.firmName, (names.get(s.firmName) ?? 0) + 1)
  for (const s of mentions) for (const e of s.entities) if (isFirm(e, key)) names.set(e, (names.get(e) ?? 0) + 0.5)
  const ranked = Array.from(names.entries()).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
  // Prefer the fuller form when it is common too: "Ares Management" over "Ares".
  const top = ranked[0]
  const fuller = top && ranked.find(([n, c]) => n.length > top[0].length && c >= top[1] / 3 && n.toLowerCase().startsWith(top[0].toLowerCase()))
  const name = (fuller ?? top)?.[0]
  if (!name) return null

  const byDate = (a: Story, b: Story) => (b.publishedDate ?? '').localeCompare(a.publishedDate ?? '') || b.firstSeen.localeCompare(a.firstSeen)
  return { slug, name, stories: stories.sort(byDate), mentions: mentions.sort(byDate).slice(0, 40), closes: [] }
}

const cached = unstable_cache(computeFirm, ['firm-page-v2'], { revalidate: 1800, tags: ['stories'] })

/** Never throws; null means "no such firm in the past year". */
export async function getFirmSafe(slug: string): Promise<FirmPage | null> {
  if (!SLUG_RE.test(slug) || slug.length > 60) return null
  try {
    // The league is fetched here, beside the firm, not inside its cached
    // function: a cache call nested in another is not shared, so every new
    // firm page rebuilt the whole league table (ten seconds a page).
    const [firm, league] = await Promise.all([cached(slug), getLeagueSafe()])
    if (!firm) return null
    const key = slug.replace(/-/g, ' ')
    const closes = league.filter((c) => c.firmSlug === slug || isFirm(c.firm, key)).sort((a, b) => b.date.localeCompare(a.date))
    return { ...firm, closes }
  } catch (err) {
    console.error('[firm] fetch failed:', err)
    return null
  }
}
