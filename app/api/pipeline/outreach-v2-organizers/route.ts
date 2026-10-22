import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { matchPersonById, searchPeopleAtFirmByTitles } from '@/lib/outreach/apollo-client'
import { organizerTitles } from '@/lib/outreach-v2/exclusions'
import { runOrganizerNotes } from '@/lib/outreach-v2/organizer-notes'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Cron (15:30 UTC, weekdays): the day's "your event is on the FundOpsHQ
 * events board" notes to event organizers (lib/outreach-v2/organizer-notes.ts),
 * half an hour after the news notes. Off unless OUTREACH_V2_MODE is preview or
 * live; OUTREACH_V2_ORGANIZER_MODE can only lower that, and unset it keeps the
 * organizer notes in preview (stored, never sent). Set it to `live` to queue
 * them for the dispatcher. At most five notes and six Apollo credits a New
 * York weekday, whatever is asked. `?credits=N` lowers the credit cap for a
 * manual run (0 spends nothing and runs nothing).
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const creditsParam = url.searchParams.get('credits')
  const creditCap = creditsParam == null ? undefined : Math.max(0, Math.floor(Number(creditsParam)) || 0)
  if (creditCap === 0) return NextResponse.json({ ok: true, skipped: 'credits=0: nothing spent, nothing run' })
  try {
    const result = await runOrganizerNotes(
      getSupabaseAdmin(),
      { search: (organizer, type) => searchPeopleAtFirmByTitles(organizer, organizerTitles(type)), match: (id) => matchPersonById(id) },
      new Date(),
      { creditCap },
    )
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
