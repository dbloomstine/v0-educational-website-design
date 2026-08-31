import { NextResponse } from 'next/server'
import { setWorkState, type WorkState } from '@/lib/crm/queries'

export const runtime = 'nodejs'

const VALID: WorkState[] = ['to_do', 'in_progress', 'done', 'parked']

export async function POST(req: Request) {
  let body: { ids?: unknown; workState?: unknown; logAs?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string') : []
  const workState = body.workState as WorkState

  if (ids.length === 0) return NextResponse.json({ error: 'No rows selected' }, { status: 400 })
  if (!VALID.includes(workState)) return NextResponse.json({ error: 'Invalid state' }, { status: 400 })

  // Marking done writes a contact_log row so the suppression clock starts from
  // real work. Default is `researched` (9mo) — the conservative direction,
  // since under-suppressing is recoverable but over-suppressing hides
  // prospects silently.
  const logAs =
    workState === 'done'
      ? body.logAs === 'contacted'
        ? 'contacted'
        : 'researched'
      : null

  try {
    const result = await setWorkState(ids, workState, logAs)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 }
    )
  }
}
