import { NextResponse } from 'next/server'
import { socialGate } from '@/lib/social/auth'
import { isIsoDate, parseAll, parseMetricRow, parsePostRow, parseUpdateRow } from '@/lib/social/records'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// `caption` and `media_urls` are here so the job can release a held post: it schedules the same words and files
// (social repo, engine/release.mjs).
const COLUMNS = 'id, post_date, slug, format, kind, channel, story_ids, caption, media_urls, status, hold_reason, scheduled_for, buffer_post_id, permalink, error, created_at, updated_at'

/**
 * The record of what the social job made: one row per post per channel.
 *
 * GET ?since=YYYY-MM-DD   the rows from that edition on (default: 21 days).
 * POST { posts: [...] }   write whole rows. A post already recorded (same
 *                         edition, slug and channel) is replaced, so a re-run
 *                         of a night does not duplicate it.
 * POST { updates: [...] } change rows by id: what the scheduler said happened
 *                         ("posted", its link, or the error). Only the fields
 *                         sent are changed.
 * POST { metrics: [...] } add a reading of a post's numbers.
 */
export async function GET(req: Request) {
  const refused = socialGate(req)
  if (refused) return refused

  const param = new URL(req.url).searchParams.get('since')
  const since = isIsoDate(param) ? param : new Date(Date.now() - 21 * 86_400_000).toISOString().slice(0, 10)
  const { data, error } = await getSupabaseAdmin()
    .from('social_posts')
    .select(COLUMNS)
    .gte('post_date', since)
    .order('post_date', { ascending: false })
    .order('slug', { ascending: true })
    .limit(2000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ since, posts: data ?? [] })
}

export async function POST(req: Request) {
  const refused = socialGate(req)
  if (refused) return refused

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || (body.posts == null && body.updates == null && body.metrics == null)) {
    return NextResponse.json({ error: 'send { posts: [...] }, { updates: [...] } or { metrics: [...] }' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const done: { posts?: unknown[]; updated?: number; metrics?: number } = {}

  if (body.posts != null) {
    const parsed = parseAll(body.posts, 200, parsePostRow)
    if ('error' in parsed) return NextResponse.json({ error: `posts: ${parsed.error}` }, { status: 400 })
    const now = new Date().toISOString()
    const { data, error } = await db
      .from('social_posts')
      .upsert(parsed.rows.map((r) => ({ ...r, updated_at: now })), { onConflict: 'post_date,slug,channel' })
      .select('id, post_date, slug, channel, status')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    done.posts = data ?? []
  }

  if (body.updates != null) {
    const parsed = parseAll(body.updates, 200, parseUpdateRow)
    if ('error' in parsed) return NextResponse.json({ error: `updates: ${parsed.error}` }, { status: 400 })
    const now = new Date().toISOString()
    let updated = 0
    for (const { id, ...change } of parsed.rows) {
      const { data, error } = await db.from('social_posts').update({ ...change, updated_at: now }).eq('id', id).select('id')
      if (error) return NextResponse.json({ error: error.message, updated }, { status: 500 })
      updated += data?.length ?? 0
    }
    done.updated = updated
  }

  if (body.metrics != null) {
    const parsed = parseAll(body.metrics, 500, parseMetricRow)
    if ('error' in parsed) return NextResponse.json({ error: `metrics: ${parsed.error}` }, { status: 400 })
    const { error } = await db.from('social_metrics').insert(parsed.rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    done.metrics = parsed.rows.length
  }

  return NextResponse.json(done)
}
