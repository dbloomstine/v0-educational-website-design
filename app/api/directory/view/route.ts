import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { SESSION_COOKIE, verifySession } from '@/lib/directory/claim'
import { requestTraits, shouldCountView } from '@/lib/directory/views'
import { directoryEnabled } from '@/lib/directory/taxonomy'

export const dynamic = 'force-dynamic'

/**
 * POST { id }: one view of a profile, from the beacon the page sends once it has loaded
 * (components/directory/owner.tsx ViewBeacon). Bots, prefetches, cross-site posts and the owner's own
 * views are not counted (lib/directory/views.ts). One upsert (directory_count_view). Nothing about the
 * viewer is stored. Always 204: the page never waits on it and a bot learns nothing.
 */
export async function POST(req: Request) {
  const done = new Response(null, { status: 204 })
  if (!directoryEnabled()) return done
  let id: unknown
  try {
    id = ((JSON.parse(await req.text()) ?? {}) as { id?: unknown }).id
  } catch {
    return done
  }
  if (typeof id !== 'string') return done
  const sessionPersonId = verifySession((await cookies()).get(SESSION_COOKIE)?.value)
  if (!shouldCountView({ ...requestTraits(req.headers), sessionPersonId, personId: id })) return done
  const { error } = await getSupabaseAdmin().rpc('directory_count_view', { p_person: id })
  if (error && error.code !== '23503') console.error('[directory] view not counted:', error.code, error.message)
  return done
}
