import { NextResponse } from 'next/server'
import { decideRequest } from '@/lib/sponsor/requests'

// The owner's yes or no, from the page his email links to. A POST on purpose:
// mail scanners follow links, and a link alone must never book a sponsor.
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const action = body.action === 'approve' || body.action === 'decline' ? body.action : null
  if (typeof body.token !== 'string' || !action) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const result = await decideRequest(body.token, action)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ success: true, status: result.status })
}
