/**
 * One build at a time, site-wide.
 *
 * The site's pages share a few expensive datasets — ten days of stories,
 * thirty days of stories, the league table. Next's data cache keeps each for
 * some minutes, and that cache has no turnstile: when an entry goes stale,
 * EVERY request that notices rebuilds it for itself. Normally that is one or
 * two rebuilds. On 2026-10-02 a crawler opened fifty firm pages in a minute
 * just as the league table went stale; fifty servers each ran its four-second
 * build against a very small database, the database stopped answering, the
 * builds failed, nothing was cached, and the next fifty tried again. Pages
 * hung for twelve minutes — the second time that day.
 *
 * buildOnce() is the turnstile. To build, a server must first move the
 * dataset's `claimed_until` in the `site_cache` table into the future: an
 * UPDATE that only one server can win. The winner builds and stores the
 * result there. Everyone else takes the stored copy — waiting a few seconds
 * for the winner if it is still at work. A claim is not released early, so a
 * dataset is built at most once per `lockSeconds` however many servers ask,
 * and a build that FAILS is not retried until its claim lapses: the database
 * gets room to recover instead of a retry storm.
 *
 * It wraps the function handed to unstable_cache; the data cache stays the
 * way pages read. If the table cannot be reached at all, the build simply
 * runs, as it did before this existed.
 */
import { getSupabaseAdmin } from '@/lib/supabase/client'

const TABLE = 'site_cache'
const POLL_MS = 1500
const FIRST_BUILD_WAIT_MS = 30_000

interface Options {
  /** How long one claim holds: the least time between two builds of this key, and the back-off after a failed one. */
  lockSeconds?: number
  /** How long to wait for another server's build before settling for the stored copy. */
  waitMs?: number
}

interface Row {
  payload: string | null
  computed_at: string | null
  claimed_until: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Take the claim. True for exactly one caller per `lockSeconds`. */
async function claim(key: string, lockSeconds: number): Promise<boolean> {
  const db = getSupabaseAdmin()
  const now = Date.now()
  const until = new Date(now + lockSeconds * 1000).toISOString()
  const taken = await db.from(TABLE).update({ claimed_until: until }).eq('key', key).lt('claimed_until', new Date(now).toISOString()).select('key')
  if (taken.error) throw new Error(taken.error.message)
  if ((taken.data ?? []).length === 1) return true
  // Nothing moved: the claim is held — or the row has never existed. Creating it is the claim.
  const created = await db.from(TABLE).upsert({ key, claimed_until: until }, { onConflict: 'key', ignoreDuplicates: true }).select('key')
  if (created.error) throw new Error(created.error.message)
  return (created.data ?? []).length === 1
}

async function read(key: string, columns: string): Promise<Row | null> {
  const { data, error } = await getSupabaseAdmin().from(TABLE).select(columns).eq('key', key).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Row | null) ?? null
}

async function store(key: string, value: unknown): Promise<void> {
  const { error } = await getSupabaseAdmin().from(TABLE).update({ payload: JSON.stringify(value), computed_at: new Date().toISOString() }).eq('key', key)
  if (error) console.error(`[build-once] ${key}: built, but could not store the copy:`, error.message)
}

/** The stored copy, or undefined when there is none (or it cannot be read). */
async function lastGood<T>(key: string): Promise<T | undefined> {
  try {
    const row = await read(key, 'payload')
    return row?.payload ? (JSON.parse(row.payload) as T) : undefined
  } catch {
    return undefined
  }
}

/**
 * Someone else holds the claim. Their result if it is in, or arrives within
 * `waitMs`; otherwise whatever was stored before; undefined if nothing ever was.
 */
async function fromTheBuilder<T>(key: string, lockSeconds: number, waitMs: number): Promise<T | undefined> {
  const started = Date.now()
  let seen: string | null | undefined
  for (;;) {
    const row = await read(key, 'computed_at, claimed_until')
    if (!row) return undefined
    if (seen === undefined) seen = row.computed_at
    const claimStarted = new Date(row.claimed_until).getTime() - lockSeconds * 1000
    const builtAt = row.computed_at ? new Date(row.computed_at).getTime() : null
    // Built under the claim now in force, or the claim has lapsed: this is the newest there is.
    const settled = (builtAt !== null && builtAt >= claimStarted) || new Date(row.claimed_until).getTime() <= Date.now()
    if (settled || row.computed_at !== seen) break
    // With nothing stored yet there is no copy to settle for: give the first build longer.
    const patience = seen === null ? Math.max(waitMs, FIRST_BUILD_WAIT_MS) : waitMs
    if (Date.now() - started + POLL_MS > patience) break
    await sleep(POLL_MS)
  }
  return lastGood<T>(key)
}

export async function buildOnce<T>(key: string, build: () => Promise<T>, opts: Options = {}): Promise<T> {
  const lockSeconds = opts.lockSeconds ?? 120
  const waitMs = opts.waitMs ?? 15_000

  let mine: boolean
  try {
    mine = await claim(key, lockSeconds)
  } catch (err) {
    console.error(`[build-once] ${key}: turnstile unreachable, building anyway:`, err instanceof Error ? err.message : err)
    return build()
  }

  if (mine) {
    try {
      const value = await build()
      await store(key, value)
      return value
    } catch (err) {
      // The claim stays in force: nobody retries until it lapses.
      const last = await lastGood<T>(key)
      if (last !== undefined) {
        console.error(`[build-once] ${key}: build failed, serving the last good copy:`, err instanceof Error ? err.message : err)
        return last
      }
      throw err
    }
  }

  const theirs = await fromTheBuilder<T>(key, lockSeconds, waitMs).catch(() => undefined)
  if (theirs !== undefined) return theirs
  // Never built, and whoever is building has not finished (or failed): nothing to serve but our own.
  return build()
}
