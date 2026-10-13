/**
 * Where a story lives: `/story/<slug>-<short id>` (2026-10-12, on Danny's leave).
 *
 * The slug is the headline, made into a path; the short id is the first eight
 * hex characters of the news_items uuid. The slug is for people and search
 * results; the short id is what the lookup uses. Any `/story/<uuid>` link ever
 * minted (emails, social posts, search results) still resolves, and the page
 * answers it with a permanent redirect to the slug address, as it does a stale
 * slug — the headline is read from the row, never from the address.
 *
 * Eight hex characters are 32 bits. Measured on 2026-10-12: 67,902 rows, no two
 * sharing a prefix. A lookup by prefix is a range scan on the primary key
 * (`shortIdRange`), so when two rows do share one some day, both come back and
 * the slug picks between them; nothing needs a new index.
 *
 * Pure, and imports nothing from the server: the chart bundles it for the browser.
 */

export const SHORT_ID_LENGTH = 8
export const SLUG_MAX_LENGTH = 70

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUGGED_RE = /^(?:(.*)-)?([0-9a-f]{8})$/

/** A headline as a path segment: lower-case ASCII words joined by hyphens, at most SLUG_MAX_LENGTH, cut on a word. */
export function storySlug(headline: string | null | undefined, max: number = SLUG_MAX_LENGTH): string {
  const ascii = (headline ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (ascii.length <= max) return ascii
  const cut = ascii.slice(0, max + 1)
  const atWord = cut.lastIndexOf('-')
  return (atWord > max / 2 ? cut.slice(0, atWord) : ascii.slice(0, max)).replace(/-+$/, '')
}

/** The first eight hex characters of a row's id. */
export function shortId(id: string): string {
  return id.slice(0, SHORT_ID_LENGTH).toLowerCase()
}

/** The path for a story whose slug is already made (the chart sends slugs, not headlines). */
export function storyPathOf(id: string, slug: string): string {
  const short = shortId(id)
  return slug ? `/story/${slug}-${short}` : `/story/${short}`
}

/** The canonical path of a story: `/story/<slug>-<short id>`. Everything that links to a story uses this. */
export function storyPath(story: { id: string; headline: string | null | undefined }): string {
  return storyPathOf(story.id, storySlug(story.headline))
}

/** What a `/story/<param>` address asks for: a whole uuid (the old form, any member row), or a short id with the slug it came with. */
export type StoryRef = { kind: 'uuid'; id: string } | { kind: 'short'; short: string; slug: string }

export function parseStoryParam(param: string): StoryRef | null {
  const p = (param ?? '').trim()
  if (UUID_RE.test(p)) return { kind: 'uuid', id: p.toLowerCase() }
  const m = SLUGGED_RE.exec(p)
  if (!m) return null
  return { kind: 'short', short: m[2], slug: m[1] ?? '' }
}

/** The uuids a short id covers, for an indexed range scan on the primary key: `id >= lo and id <= hi`. */
export function shortIdRange(short: string): { lo: string; hi: string } {
  const s = short.toLowerCase().padEnd(SHORT_ID_LENGTH, '0').slice(0, SHORT_ID_LENGTH)
  return { lo: `${s}-0000-0000-0000-000000000000`, hi: `${s}-ffff-ffff-ffff-ffffffffffff` }
}

/** True when `id` (a row id) is what `ref` asks for. */
export function refMatchesId(ref: StoryRef, id: string): boolean {
  return ref.kind === 'uuid' ? id.toLowerCase() === ref.id : id.toLowerCase().startsWith(ref.short)
}

/**
 * The story a reference names, among stories already in hand. A story matches
 * by its own id or any member row's. Should two stories answer one short id,
 * the one whose headline makes the slug in the address wins; otherwise the first.
 */
export function findStoryByRef<S extends { id: string; memberIds?: string[]; headline: string }>(ref: StoryRef, stories: S[]): S | undefined {
  const hits = stories.filter((s) => refMatchesId(ref, s.id) || (s.memberIds ?? []).some((m) => refMatchesId(ref, m)))
  if (hits.length <= 1 || ref.kind !== 'short') return hits[0]
  return hits.find((s) => storySlug(s.headline) === ref.slug) ?? hits[0]
}

/** Among rows that share a short id, the one the slug in the address was made from; else the first. */
export function pickBySlug<R extends { id: string; headline: string }>(rows: R[], slug: string): R | undefined {
  if (rows.length <= 1) return rows[0]
  return rows.find((r) => storySlug(r.headline) === slug) ?? rows[0]
}

/** True when a request's param is already the story's canonical address: no redirect needed. */
export function isCanonicalStoryParam(param: string, story: { id: string; headline: string }): boolean {
  return `/story/${param}` === storyPath(story)
}
