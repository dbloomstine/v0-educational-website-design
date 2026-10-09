import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { isAuthorizedPipelineRequest } from '@/lib/pipeline/auth'
import { reminderMail, send, type RequestRow } from '@/lib/sponsor/mail'

const HOUR = 60 * 60 * 1000

/**
 * Once a day: a sponsor request that has waited twenty hours for the owner's
 * yes or no is put in front of him again (and again a day later, until it is
 * decided). The prospect was promised an answer within one business day.
 */
export async function GET(req: Request) {
  if (!isAuthorizedPipelineRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('sponsor_requests').select('*').eq('status', 'pending').lt('created_at', new Date(Date.now() - 20 * HOUR).toISOString()).order('created_at').limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const due = ((data ?? []) as RequestRow[]).filter((r) => !r.reminded_at || Date.now() - new Date(r.reminded_at).getTime() > 20 * HOUR)
  if (!due.length) return NextResponse.json({ ok: true, waiting: 0 })
  const sent = await send(reminderMail(due))
  if (sent) await db.from('sponsor_requests').update({ reminded_at: new Date().toISOString() }).in('id', due.map((r) => r.id))
  return NextResponse.json({ ok: true, waiting: due.length, sent })
}
