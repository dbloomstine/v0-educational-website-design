import { NextResponse } from 'next/server'
import { submitRequest } from '@/lib/sponsor/requests'

// A booking request from the builder on /sponsor. Nothing runs and nothing is
// charged because of it: it waits for the owner's yes (lib/sponsor/requests.ts).
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  // A field no person sees or fills: whatever fills it is not a person. It is told all is well.
  if (typeof body.fax === 'string' && body.fax.trim()) return NextResponse.json({ success: true })

  const result = await submitRequest(body)
  if (!result.ok) return NextResponse.json({ error: result.error, errors: result.errors ?? {} }, { status: result.status })
  return NextResponse.json({ success: true })
}
