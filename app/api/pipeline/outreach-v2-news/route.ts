import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { matchPersonById, searchPeopleAtFirmByTitles } from '@/lib/outreach/apollo-client'
import { NOTE_TITLES } from '@/lib/outreach-v2/exclusions'
import { runNewsNotes } from '@/lib/outreach-v2/news-notes'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Cron (15:00 UTC, weekdays): the day's "you were in FundOps Daily" notes
 * (lib/outreach-v2/news-notes.ts). Off unless OUTREACH_V2_MODE is preview
 * (stores the notes, sends nothing) or live (queues them for the dispatcher).
 * At most ten notes and ten Apollo credits a New York day, whatever is asked.
 * `?credits=N` lowers the credit cap for a manual run (0 spends nothing).
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const creditsParam = url.searchParams.get('credits')
  const creditCap = creditsParam == null ? undefined : Math.max(0, Math.floor(Number(creditsParam)) || 0)
  if (creditCap === 0) return NextResponse.json({ ok: true, skipped: 'credits=0: nothing spent, nothing run' })
  try {
    const result = await runNewsNotes(
      getSupabaseAdmin(),
      { search: (firm) => searchPeopleAtFirmByTitles(firm, NOTE_TITLES), match: (id) => matchPersonById(id) },
      new Date(),
      { creditCap },
    )
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
