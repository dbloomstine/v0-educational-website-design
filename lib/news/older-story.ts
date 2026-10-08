/**
 * A story that has left the ten-day window.
 *
 * The front pages are built from ten days of rows (front-page.ts). A permalink
 * older than that used to open one row: its summary, its source, no other
 * outlets, and a "More in section" rail of today's unrelated stories. Search
 * engines land on exactly these pages, so they are now built whole:
 *
 *  1. the row itself, by primary key;
 *  2. the same firm's rows a few days either side, in ONE query on the firm
 *     name (the trigram index of firm pages — lib/news/firm-lookup.ts says what
 *     keeps it indexable), inside a nine-day published_date range and with a
 *     LIMIT, so it cannot read more than a few dozen rows;
 *  3. all of them clustered by buildStories, the site's own same-story test.
 *
 * The result is kept for a day: an old report does not change, and crawlers ask
 * for hundreds of old stories a minute. A lookup that FAILS throws and is not
 * kept (CLAUDE.md, "Speed, caching and the database").
 *
 * The rails of an old page are about the story, never about today: the same
 * firm's stories from these rows, then the same section on the story's own day
 * (one more query, shared by every story of that day — `fetchDayStories`).
 *
 * The functions that take `db` hold the logic and are tested with a stub; the
 * cached loaders at the foot are what the site calls.
 */
import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { ALL_NEWSLETTER_TYPES } from '@/lib/newsletter/query-articles'
import { entityKey, keysMatch } from '@/lib/newsletter/story-links'
import { firmHref } from './league'
import { firmLookup, lookupFilter } from './firm-lookup'
import { storyInSection, type SectionDef } from './sections'
import { buildStories, rankSection, type Story } from './stories'
import { STORY_COLUMNS } from './story-columns'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

/**
 * Days either side of the story that the same firm's rows are read. Four is the
 * widest gap at which the site's own rules still use their looser same-story
 * test (stories.ts), so a story's other outlets are all inside it.
 */
export const OLDER_DAYS_EITHER_SIDE = 4
/** The most rows the firm lookup may return. A firm with more than this in nine days is a wire, not a story. */
export const OLDER_ROW_LIMIT = 80
/** The most rows read for a day's section rail. The day's rows come most relevant first. */
export const DAY_ROW_LIMIT = 250
/** Siblings kept with the story (the page shows five). */
const SIBLINGS_KEPT = 8
const RAIL_STORIES = 6

/** What an old story's page is given beside the story. */
export interface OlderContext {
  /** Other stories of the same firm from the days around it, nearest in time first. */
  siblings: Story[]
}

export interface OlderStory extends OlderContext {
  story: Story
}

const DAY_MS = 86_400_000

/** 'YYYY-MM-DD' shifted by whole days. Null for anything that is not a date. */
export function shiftDay(day: string | null | undefined, days: number): string | null {
  if (!day || !/^\d{4}-\d{2}-\d{2}/.test(day)) return null
  const t = Date.parse(`${day.slice(0, 10)}T12:00:00Z`)
  return Number.isNaN(t) ? null : new Date(t + days * DAY_MS).toISOString().slice(0, 10)
}

/** The lookup for a firm's other reports around a date, or null when the row names no usable firm. */
export function firmWindow(firmName: unknown, day: string | null | undefined): { filter: string; from: string; before: string; key: string } | null {
  if (typeof firmName !== 'string') return null
  const href = firmHref(firmName)
  const from = shiftDay(day, -OLDER_DAYS_EITHER_SIDE)
  const before = shiftDay(day, OLDER_DAYS_EITHER_SIDE + 1)
  if (!href || !from || !before) return null
  // The slug is [a-z0-9-] only (firmHref), so what is built from it is safe inside a filter.
  const key = href.slice('/firm/'.length).replace(/-/g, ' ')
  // A one-letter key is every name that starts with it.
  if (key.length < 2) return null
  const lookup = firmLookup(key)
  if (!lookup) return null
  return { filter: lookupFilter('extracted_data->>firm_name', lookup), from, before, key }
}

/**
 * The story an old row belongs to, with the same firm's other stories of the
 * days around it. Null when there is no such row, or the site would not show it.
 */
export async function fetchOlderStory(db: DbClient, id: string): Promise<OlderStory | null> {
  const own = await db.from('news_items').select(STORY_COLUMNS).eq('id', id).eq('classification_status', 'complete').maybeSingle()
  if (own.error) throw new Error(`story lookup failed: ${own.error.message}`)
  if (!own.data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = own.data

  const around = firmWindow(row.extracted_data?.firm_name, String(row.published_date ?? ''))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows: any[] = [row]
  if (around) {
    // The same filters as the fronts, so the same rows are stories: the pool
    // index (published_date, relevance_score, where complete and not a
    // duplicate) serves the range, the firm-name trigram index the name.
    const near = await db
      .from('news_items')
      .select(STORY_COLUMNS)
      .eq('classification_status', 'complete')
      .eq('is_duplicate', false)
      .gte('published_date', around.from)
      .lt('published_date', around.before)
      .or('is_high_signal.eq.true,relevance_score.gte.0.3')
      .in('article_type', ALL_NEWSLETTER_TYPES)
      .or(around.filter)
      .order('published_date', { ascending: false })
      .order('id', { ascending: true })
      .limit(OLDER_ROW_LIMIT)
    // No retry: a lookup fails because the database is overloaded.
    if (near.error) throw new Error(`neighbouring stories lookup failed: ${near.error.message}`)
    const seen = new Set<string>([row.id])
    rows = [row, ...(near.data ?? []).filter((r: { id: string }) => (seen.has(r.id) ? false : (seen.add(r.id), true)))]
  }

  const stories = buildStories(rows)
  const story = stories.find((s) => s.id === id || s.memberIds.includes(id))
  if (!story) return null
  const firmKey = entityKey(story.firmName)
  const at = new Date(story.firstSeen).getTime()
  const siblings = stories
    .filter((s) => s !== story && !s.roundup && firmKey && keysMatch(entityKey(s.firmName), firmKey))
    .sort((a, b) => Math.abs(new Date(a.firstSeen).getTime() - at) - Math.abs(new Date(b.firstSeen).getTime() - at))
    .slice(0, SIBLINGS_KEPT)
  return { story, siblings }
}

/**
 * The stories of one day, for a section rail: that day's rows (most relevant
 * first, at most DAY_ROW_LIMIT) built into stories. One query, on the pool
 * index, however many old stories of that day are asked for.
 */
export async function fetchDayStories(db: DbClient, day: string): Promise<Story[]> {
  const from = shiftDay(day, 0)
  const before = shiftDay(day, 1)
  if (!from || !before) return []
  const { data, error } = await db
    .from('news_items')
    .select(STORY_COLUMNS)
    .eq('classification_status', 'complete')
    .eq('is_duplicate', false)
    .gte('published_date', from)
    .lt('published_date', before)
    .or('is_high_signal.eq.true,relevance_score.gte.0.3')
    .in('article_type', ALL_NEWSLETTER_TYPES)
    .order('published_date', { ascending: false })
    .order('relevance_score', { ascending: false })
    .limit(DAY_ROW_LIMIT)
  if (error) throw new Error(`day stories lookup failed: ${error.message}`)
  return buildStories(data ?? [])
}

/**
 * The two rails under an old story, about the story itself:
 * the same firm's stories from around then, and the same section on its day.
 * Either is empty when there is nothing related; the page then leaves it out.
 */
export function olderRails(
  story: Story,
  siblings: Story[],
  day: Story[],
  section: SectionDef | undefined,
): { sameFirm: Story[]; moreInSection: Story[] } {
  const firmKey = entityKey(story.firmName)
  const sameFirm = firmKey
    ? siblings.filter((s) => s.id !== story.id && !story.memberIds.includes(s.id) && keysMatch(entityKey(s.firmName), firmKey)).slice(0, 5)
    : []
  const taken = new Set([story.id, ...story.memberIds, ...sameFirm.flatMap((s) => [s.id, ...s.memberIds])])
  const moreInSection = section
    ? rankSection(
        day.filter((s) => !taken.has(s.id) && !s.memberIds.some((m) => taken.has(m)) && storyInSection(s, section) && !s.roundup),
        // Ranked as of the story's own time, not today's.
        new Date(story.firstSeen).getTime(),
      ).slice(0, RAIL_STORIES)
    : []
  return { sameFirm, moreInSection }
}

// ─── What the site calls ────────────────────────────────────────────────────

/**
 * An old report does not change, so the answer — the story, or that there is
 * none — is kept for a day. Bump the version when the Story shape changes.
 */
export const loadOlderStory = unstable_cache(
  (id: string): Promise<OlderStory | null> => fetchOlderStory(getSupabaseAdmin(), id),
  ['older-story-v2'],
  { revalidate: 86_400, tags: ['stories'] },
)

/** A day's stories, shared by every old story of that day; kept a day. */
export const loadDayStories = unstable_cache(
  (day: string): Promise<Story[]> => fetchDayStories(getSupabaseAdmin(), day),
  ['day-stories-v1'],
  { revalidate: 86_400, tags: ['stories'] },
)
