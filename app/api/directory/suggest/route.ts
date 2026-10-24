import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sendOwnerAlert, oneLine } from '@/lib/alerts/owner-alert'
import { clientIp, hashIp } from '@/lib/submit/news-submission'
import { SUGGEST_LIMITS, suggestionAlertText, validateSuggestion } from '@/lib/directory/suggest'
import { directoryEnabled } from '@/lib/directory/taxonomy'

export const dynamic = 'force-dynamic'

/**
 * POST: "Suggest a firm / add yourself" (/directory/suggest, plan B9). Queued in directory_suggestions for
 * the desk, which checks the firm's own site before anything is loaded; Danny is alerted. Five a day from
 * one IP address (kept only as a keyed hash).
 */
export async function POST(req: Request) {
  if (!directoryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  let body: Record<string, unknown>
  try {
    const parsed: unknown = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (typeof body.website === 'string' && body.website.trim()) return NextResponse.json({ success: true })
  const checked = validateSuggestion(body)
  if (!checked.ok) return NextResponse.json({ error: checked.error, field: checked.field }, { status: 400 })
  const s = checked.value

  const db = getSupabaseAdmin()
  const ipHash = hashIp(clientIp(req.headers))
  if (ipHash) {
    const { count } = await db
      .from('directory_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - 86_400_000).toISOString())
    if ((count ?? 0) >= SUGGEST_LIMITS.perIpPerDay) return NextResponse.json({ error: 'We already have several suggestions from you today. Write to danny@fundopshq.com.' }, { status: 429 })
  }

  const { data, error } = await db.from('directory_suggestions').insert({ ...s, ip_hash: ipHash }).select('id').maybeSingle()
  if (error) console.error('[directory] suggestion not saved:', error.code, error.message)
  const alerted = await sendOwnerAlert({
    fromName: 'FundOpsHQ Directory',
    subject: `[Directory] Suggestion: ${oneLine(s.full_name ? `${s.full_name} (${s.firm_name})` : s.firm_name, 100)}`,
    text: suggestionAlertText(s, error ? null : (data?.id ?? null)),
    replyTo: s.contact_email,
  })
  if (error && !alerted) return NextResponse.json({ error: 'Something went wrong on our side. Please write to danny@fundopshq.com.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
