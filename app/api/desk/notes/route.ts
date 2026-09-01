import { NextResponse } from 'next/server'
import { updateLeadFields } from '@/lib/crm/queries'

export const runtime = 'nodejs'

const MAX = 8000

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const leadId = typeof body.leadId === 'string' ? body.leadId : null
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 })

  const fields: { notes?: string | null; firmNotes?: string | null; blocker?: string | null } = {}
  for (const [k, target] of [['notes', 'notes'], ['firmNotes', 'firmNotes'], ['blocker', 'blocker']] as const) {
    if (k in body) {
      const v = body[k]
      if (v !== null && typeof v !== 'string') {
        return NextResponse.json({ error: `${k} must be text` }, { status: 400 })
      }
      if (typeof v === 'string' && v.length > MAX) {
        return NextResponse.json({ error: `${k} too long` }, { status: 400 })
      }
      fields[target] = v === '' ? null : (v as string | null)
    }
  }

  try {
    await updateLeadFields(leadId, fields)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 }
    )
  }
}
