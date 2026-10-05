/**
 * What the social job may write: which files it may upload, and what a row in
 * `social_posts` / `social_metrics` must look like. The job is ours, but these
 * routes write with the service key, so everything that arrives is checked.
 */

/** The public storage bucket the finished slides and videos live in. */
export const SOCIAL_BUCKET = 'social'

export const SOCIAL_CHANNELS = ['tiktok', 'instagram', 'linkedin'] as const
export const SOCIAL_KINDS = ['carousel', 'video'] as const
/**
 * draft: in the scheduler, not due to go out (a dry run). scheduled: due to go
 * out. held: bad news about a named firm, waiting for Danny. posted / failed:
 * what the scheduler reported afterwards. skipped: made, but not sent anywhere.
 */
export const SOCIAL_STATUSES = ['draft', 'scheduled', 'held', 'posted', 'failed', 'skipped'] as const

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** `2026-10-05/03-big-number-ares/4x5/slide-01.jpg`: a date folder, one to three lower-case folders, a media file. */
const PATH_RE = /^\d{4}-\d{2}-\d{2}(\/[a-z0-9][a-z0-9-]*){1,3}\/[a-z0-9][a-z0-9-]*\.(jpg|mp4|pdf)$/

export function isIsoDate(v: unknown): v is string {
  return typeof v === 'string' && DATE_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`))
}

/** Finished files are kept this long unless the job asks for longer, and never less than MIN_KEEP_DAYS. */
export const DEFAULT_KEEP_DAYS = 7
export const MIN_KEEP_DAYS = 3

/**
 * Which of the bucket's top-level folders are days old enough to remove: named
 * as a date, and more than `keepDays` days before `today` (YYYY-MM-DD). Anything
 * not named as a date is left alone, as is anything dated in the future.
 */
export function oldDateFolders(names: string[], today: string, keepDays: number): string[] {
  if (!isIsoDate(today)) return []
  const keep = Math.max(MIN_KEEP_DAYS, Number.isInteger(keepDays) ? keepDays : DEFAULT_KEEP_DAYS)
  const cutoff = new Date(Date.parse(`${today}T00:00:00Z`) - keep * 86_400_000).toISOString().slice(0, 10)
  return names.filter((n) => isIsoDate(n) && n < cutoff).sort()
}

export function isUploadPath(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 200 && PATH_RE.test(v)
}

const isHttps = (v: unknown, max = 600): v is string => typeof v === 'string' && v.length <= max && /^https:\/\/[^\s]+$/.test(v)
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max
const optional = <T>(v: unknown, ok: (x: unknown) => x is T): v is T | null | undefined => v == null || ok(v)

export interface SocialPostRow {
  post_date: string
  slug: string
  format: string
  kind: (typeof SOCIAL_KINDS)[number]
  channel: (typeof SOCIAL_CHANNELS)[number]
  story_ids: string[]
  caption: string
  media_urls: string[]
  status: (typeof SOCIAL_STATUSES)[number]
  hold_reason: string | null
  scheduled_for: string | null
  buffer_post_id: string | null
  permalink: string | null
  error: string | null
}

/** One row, or the reason it is not one. */
export function parsePostRow(v: unknown): SocialPostRow | string {
  if (!v || typeof v !== 'object') return 'not an object'
  const r = v as Record<string, unknown>
  if (!isIsoDate(r.post_date)) return 'post_date must be YYYY-MM-DD'
  if (typeof r.slug !== 'string' || !SLUG_RE.test(r.slug)) return 'slug must be lower-case letters, digits and hyphens'
  if (!text(r.format, 40) || !r.format) return 'format is missing'
  if (!SOCIAL_KINDS.includes(r.kind as never)) return `kind must be one of ${SOCIAL_KINDS.join(', ')}`
  if (!SOCIAL_CHANNELS.includes(r.channel as never)) return `channel must be one of ${SOCIAL_CHANNELS.join(', ')}`
  if (!SOCIAL_STATUSES.includes(r.status as never)) return `status must be one of ${SOCIAL_STATUSES.join(', ')}`
  const storyIds = r.story_ids ?? []
  if (!Array.isArray(storyIds) || storyIds.length > 60 || !storyIds.every((id) => typeof id === 'string' && UUID_RE.test(id))) return 'story_ids must be news_items ids'
  if (!text(r.caption, 5000)) return 'caption is missing or too long'
  const media = r.media_urls ?? []
  if (!Array.isArray(media) || media.length > 40 || !media.every((u) => isHttps(u))) return 'media_urls must be https links'
  if (!optional(r.hold_reason, (x): x is string => text(x, 300))) return 'hold_reason is too long'
  if (!optional(r.scheduled_for, (x): x is string => typeof x === 'string' && !Number.isNaN(Date.parse(x)))) return 'scheduled_for must be a timestamp'
  if (!optional(r.buffer_post_id, (x): x is string => text(x, 100))) return 'buffer_post_id is too long'
  if (!optional(r.permalink, (x): x is string => isHttps(x))) return 'permalink must be an https link'
  if (!optional(r.error, (x): x is string => text(x, 1000))) return 'error is too long'
  return {
    post_date: r.post_date,
    slug: r.slug,
    format: r.format,
    kind: r.kind as SocialPostRow['kind'],
    channel: r.channel as SocialPostRow['channel'],
    story_ids: storyIds as string[],
    caption: r.caption,
    media_urls: media as string[],
    status: r.status as SocialPostRow['status'],
    hold_reason: (r.hold_reason as string | null | undefined) ?? null,
    scheduled_for: r.scheduled_for ? new Date(r.scheduled_for as string).toISOString() : null,
    buffer_post_id: (r.buffer_post_id as string | null | undefined) ?? null,
    permalink: (r.permalink as string | null | undefined) ?? null,
    error: (r.error as string | null | undefined) ?? null,
  }
}

export interface SocialPostUpdate {
  id: string
  status?: SocialPostRow['status']
  scheduled_for?: string | null
  buffer_post_id?: string | null
  permalink?: string | null
  error?: string | null
}

/**
 * A change to a row already written: what the scheduler said happened to it.
 * Only the fields sent are changed, so reporting "posted" the next day does
 * not wipe the caption or the files recorded the night before.
 */
export function parseUpdateRow(v: unknown): SocialPostUpdate | string {
  if (!v || typeof v !== 'object') return 'not an object'
  const r = v as Record<string, unknown>
  if (typeof r.id !== 'string' || !UUID_RE.test(r.id)) return 'id must be a social_posts id'
  const out: SocialPostUpdate = { id: r.id }
  if (r.status !== undefined) {
    if (!SOCIAL_STATUSES.includes(r.status as never)) return `status must be one of ${SOCIAL_STATUSES.join(', ')}`
    out.status = r.status as SocialPostRow['status']
  }
  if (r.scheduled_for !== undefined) {
    if (r.scheduled_for !== null && (typeof r.scheduled_for !== 'string' || Number.isNaN(Date.parse(r.scheduled_for)))) return 'scheduled_for must be a timestamp'
    out.scheduled_for = r.scheduled_for === null ? null : new Date(r.scheduled_for as string).toISOString()
  }
  if (r.buffer_post_id !== undefined) {
    if (r.buffer_post_id !== null && !text(r.buffer_post_id, 100)) return 'buffer_post_id is too long'
    out.buffer_post_id = r.buffer_post_id as string | null
  }
  if (r.permalink !== undefined) {
    if (r.permalink !== null && !isHttps(r.permalink)) return 'permalink must be an https link'
    out.permalink = r.permalink as string | null
  }
  if (r.error !== undefined) {
    if (r.error !== null && !text(r.error, 1000)) return 'error is too long'
    out.error = r.error as string | null
  }
  if (Object.keys(out).length === 1) return 'nothing to change'
  return out
}

export interface SocialMetricRow {
  post_id: string
  metrics: Record<string, number>
  source: string
}

/** A reading of one post's numbers. Networks report different things, so the numbers are a bag: `{ views: 412, likes: 9 }`. */
export function parseMetricRow(v: unknown): SocialMetricRow | string {
  if (!v || typeof v !== 'object') return 'not an object'
  const r = v as Record<string, unknown>
  if (typeof r.post_id !== 'string' || !UUID_RE.test(r.post_id)) return 'post_id must be a social_posts id'
  if (!r.metrics || typeof r.metrics !== 'object' || Array.isArray(r.metrics)) return 'metrics must be an object of numbers'
  const entries = Object.entries(r.metrics as Record<string, unknown>)
  if (entries.length === 0 || entries.length > 40) return 'metrics must hold between 1 and 40 numbers'
  if (!entries.every(([k, n]) => /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(k) && typeof n === 'number' && Number.isFinite(n))) return 'metrics must be an object of numbers'
  if (!optional(r.source, (x): x is string => text(x, 40))) return 'source is too long'
  return { post_id: r.post_id, metrics: Object.fromEntries(entries) as Record<string, number>, source: (r.source as string | undefined) ?? 'buffer' }
}

/** Every row of a list, or the first reason one failed (with its position). */
export function parseAll<T>(list: unknown, max: number, parse: (v: unknown) => T | string): { rows: T[] } | { error: string } {
  if (!Array.isArray(list) || list.length === 0) return { error: 'expected a non-empty list' }
  if (list.length > max) return { error: `at most ${max} at a time` }
  const rows: T[] = []
  for (const [i, v] of list.entries()) {
    const row = parse(v)
    if (typeof row === 'string') return { error: `item ${i}: ${row}` }
    rows.push(row)
  }
  return { rows }
}
