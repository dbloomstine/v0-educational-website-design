import { NextResponse } from 'next/server'
import { socialGate } from '@/lib/social/auth'
import { DEFAULT_KEEP_DAYS, MIN_KEEP_DAYS, SOCIAL_BUCKET, oldDateFolders } from '@/lib/social/records'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** How many days' folders one call removes: each is a few dozen requests to storage, and the job calls once a day. */
const MAX_DAYS_PER_CALL = 4

type Bucket = ReturnType<ReturnType<typeof getSupabaseAdmin>['storage']['from']>

/** Every file under a folder, however deep (a day's folder is three levels at most). A folder comes back from storage with no id. */
async function filesUnder(storage: Bucket, prefix: string, depth = 0): Promise<string[]> {
  if (depth > 4) return []
  const out: string[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.list(prefix, { limit: 1000, offset })
    if (error) throw new Error(`list ${prefix}: ${error.message}`)
    for (const entry of data ?? []) {
      if (entry.id === null) out.push(...(await filesUnder(storage, `${prefix}/${entry.name}`, depth + 1)))
      else out.push(`${prefix}/${entry.name}`)
    }
    if (!data || data.length < 1000) break
  }
  return out
}

/**
 * Removes the finished slides and videos of days long past.
 *
 * The files are in public storage only so that the scheduler can fetch them
 * when a post goes out. A post goes out on the day of its folder; a held draft
 * nobody released is taken out of the scheduler two days after its time. So a
 * day's folder is safe to remove once it is a week old (never less than three
 * days, whatever is asked for). The record of each post stays in
 * `social_posts`; its `media_urls` then point at files that are gone, which
 * nothing reads.
 *
 * Body: `{ keepDays?: number }`. Answers with the days and the number of files
 * removed, and how many old days are still left for the next call.
 */
export async function POST(req: Request) {
  const refused = socialGate(req)
  if (refused) return refused

  const body = await req.json().catch(() => null)
  const asked = Number(body?.keepDays)
  const keepDays = Number.isInteger(asked) && asked >= MIN_KEEP_DAYS ? asked : DEFAULT_KEEP_DAYS
  const today = new Date().toISOString().slice(0, 10)

  try {
    const storage = getSupabaseAdmin().storage.from(SOCIAL_BUCKET)
    const top = await storage.list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
    if (top.error) throw new Error(`list: ${top.error.message}`)
    const old = oldDateFolders((top.data ?? []).map((e) => e.name), today, keepDays)
    const days: string[] = []
    let files = 0
    for (const day of old.slice(0, MAX_DAYS_PER_CALL)) {
      const paths = await filesUnder(storage, day)
      for (let i = 0; i < paths.length; i += 100) {
        const { error } = await storage.remove(paths.slice(i, i + 100))
        if (error) throw new Error(`remove ${day}: ${error.message}`)
      }
      days.push(day)
      files += paths.length
    }
    return NextResponse.json({ keepDays, removed: { days, files }, left: old.length - days.length })
  } catch (err) {
    console.error('[social] cleanup failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'cleanup failed' }, { status: 500 })
  }
}
