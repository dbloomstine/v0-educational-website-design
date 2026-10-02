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
import { entityKey } from '@/lib/newsletter/story-links'
import { buildStories, type Story } from './stories'
import { firmSlug, type FundClose } from './league'
import { loadLeague, LEAGUE_COLUMNS } from './league-data'
import { firmLookup, isFirmInStory, lookupFilter, searchFilter, startsAWord } from './firm-lookup'

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
const MENTIONS_TIMEOUT_MS = 4000

async function computeFirm(slug: string): Promise<FirmPage | null> {
  const key = slug.replace(/-/g, ' ')
  const since = new Date(Date.now() - FIRM_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
  // Every way the reports may have written the name: "hig" is also "H.I.G.",
  // "ao shearman" is "A&O Shearman" (lib/news/firm-lookup.ts). The key is
  // [a-z0-9 ] only (SLUG_RE), so what is built from it is safe inside a filter.
  const lookup = firmLookup(key)
  if (!lookup) return null
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
  // Two lookups, not one OR: the reports about the firm, and the headlines
  // that name it in someone else's story. In one limited result the second
  // would crowd out the first.
  // No retry on failure. A lookup fails when the database is overloaded, and a
  // retry is one more query in its queue; the page errors instead (uncached),
  // and the next visitor asks again.
  const [named, inHeadline] = await Promise.all([
    base().or(lookupFilter('extracted_data->>firm_name', lookup)).limit(600),
    // The mentions are an extra: given a few seconds and not asked twice. A
    // common word ("One", "Man") is in thousands of headlines, and checking
    // them on a busy database must not hold the firm's own stories up.
    base().or(lookupFilter('title', lookup)).limit(300).abortSignal(AbortSignal.timeout(MENTIONS_TIMEOUT_MS)),
  ])
  // Nothing under the name as words, and no headline that uses it: it may be
  // a name whose words an accent joins ("Värde" is the key "v rde"). Ask for
  // the letters in order instead. Not when a headline matched: then this is a
  // company that is named in stories but is never their subject — most of
  // what a crawler asks for — and the extra query would find nothing.
  const inHeadlines = !inHeadline.error && (inHeadline.data ?? []).length > 0
  const asSubject =
    !named.error && (named.data ?? []).length === 0 && lookup.loose && !inHeadlines
      ? await base().or(lookupFilter('extracted_data->>firm_name', lookup, { loose: true })).limit(600)
      : named
  if (asSubject.error) throw new Error(`firm query failed: ${asSubject.error.message}`)
  const seen = new Set<string>()
  const data = [...(asSubject.data ?? []), ...(inHeadline.data ?? [])].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))

  const all = buildStories(data).filter((s) => !s.roundup)
  const stories = all.filter((s) => isFirmInStory(s.firmName, key, s.headline))
  const taken = new Set(stories.map((s) => s.id))
  const mentions = all.filter((s) => !taken.has(s.id) && s.firms.some((e) => isFirmInStory(e, key, s.headline)))
  if (stories.length === 0 && mentions.length === 0) return null

  // The name as the reports most often write it.
  const names = new Map<string, number>()
  for (const s of stories) if (s.firmName) names.set(s.firmName, (names.get(s.firmName) ?? 0) + 1)
  for (const s of mentions) for (const e of s.firms) if (isFirmInStory(e, key, s.headline)) names.set(e, (names.get(e) ?? 0) + 0.5)
  const byUse = Array.from(names.entries()).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
  // The page is named for the firm at this address, not for a division with a
  // longer one: /firm/goldman-sachs also carries Goldman Sachs Alternatives'
  // stories, and must not take its name from them.
  const own = byUse.filter(([n]) => firmSlug(n) === slug)
  const ranked = own.length > 0 ? own : byUse
  // Prefer the fuller form when it is common too: "Ares Management" over "Ares".
  const top = ranked[0]
  const fuller = top && ranked.find(([n, c]) => n.length > top[0].length && c >= top[1] / 3 && n.toLowerCase().startsWith(top[0].toLowerCase()))
  const name = (fuller ?? top)?.[0]
  if (!name) return null

  const byDate = (a: Story, b: Story) => (b.publishedDate ?? '').localeCompare(a.publishedDate ?? '') || b.firstSeen.localeCompare(a.firstSeen)
  return { slug, name, stories: stories.sort(byDate), mentions: mentions.sort(byDate).slice(0, 40), closes: [] }
}

const cached = unstable_cache(computeFirm, ['firm-page-v7'], { revalidate: 1800, tags: ['stories'] })

/**
 * Null means "no such firm in the past year". A lookup that FAILS throws
 * instead: the page then errors, which is not cached, rather than telling the
 * reader — and the cache, for the next half hour — that the firm does not
 * exist.
 */
export async function getFirm(slug: string): Promise<FirmPage | null> {
  if (!SLUG_RE.test(slug) || slug.length > 60) return null
  // The league is fetched here, beside the firm, not inside its cached
  // function: a cache call nested in another is not shared, so every new
  // firm page rebuilt the whole league table (ten seconds a page).
  const [firm, league] = await Promise.all([cached(slug), loadLeague()])
  if (!firm) return null
  const key = slug.replace(/-/g, ' ')
  const closes = league.filter((c) => c.firmSlug === slug || isFirmInStory(c.firm, key, c.headline)).sort((a, b) => b.date.localeCompare(a.date))
  return { ...firm, closes }
}

export interface FirmHit { slug: string; name: string; reports: number }

/**
 * Firms whose name contains the query, most reported first — for the firm
 * directory's search box and for the "firm pages" line above a news search.
 * It reads only the firm name of each matching report (a year back, on the
 * trigram index), then groups the spellings the reports used under one page.
 */
export async function searchFirms(query: string, limit = 24): Promise<FirmHit[]> {
  const q = query.replace(/[^\p{L}\p{N}\s&'.+-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
  const filter = searchFilter('extracted_data->>firm_name', q)
  if (!filter) return []
  const since = new Date(Date.now() - FIRM_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
  const { data, error } = await getSupabaseAdmin()
    .from('news_items')
    .select('firm:extracted_data->>firm_name')
    .eq('classification_status', 'complete')
    .eq('is_duplicate', false)
    .gte('published_date', since)
    .or('is_high_signal.eq.true,relevance_score.gte.0.3')
    .in('article_type', ALL_NEWSLETTER_TYPES)
    // "hig" also finds H.I.G.; "mg" also finds M&G.
    .or(filter)
    .order('published_date', { ascending: false })
    .limit(1000)
  // A search that fails is an error, not "no firms match": the page is kept
  // at the edge, and the empty answer would be kept with it.
  if (error) throw new Error(`firm search failed: ${error.message}`)

  const bySlug = new Map<string, { names: Map<string, number>; reports: number }>()
  for (const r of (data ?? []) as { firm: string | null }[]) {
    const name = r.firm?.trim()
    const slug = firmSlug(name)
    if (!name || !SLUG_RE.test(slug) || slug.length > 60) continue
    const hit = bySlug.get(slug) ?? { names: new Map<string, number>(), reports: 0 }
    hit.reports++
    hit.names.set(name, (hit.names.get(name) ?? 0) + 1)
    bySlug.set(slug, hit)
  }
  const needle = q.toLowerCase()
  const all = Array.from(bySlug.entries())
    .map(([slug, h]) => ({
      slug,
      reports: h.reports,
      name: Array.from(h.names.entries()).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0][0],
    }))
  // "ares" is inside Antares, Mutares and "Nawy Shares". A name counts when
  // one of its words starts with what was typed; only if none does are the
  // looser matches offered.
  const wordHits = all.filter((f) => startsAWord(f.name, needle.split(' ')[0]))
  const opens = (name: string) => name.toLowerCase().startsWith(needle) || entityKey(name).startsWith(needle)
  return (wordHits.length > 0 ? wordHits : all)
    // A name that starts with what was typed comes before one that merely contains it.
    .sort((a, b) => Number(opens(b.name)) - Number(opens(a.name)) || b.reports - a.reports)
    .slice(0, limit)
}
