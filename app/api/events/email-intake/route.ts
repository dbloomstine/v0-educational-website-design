import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Inbound mail for events@fundopshq.com.
//
// Path: ImprovMX forwards events@fundopshq.com → a Resend inbound address →
// Resend POSTs `email.received` here → the message is stored in
// event_email_intake for the weekly scout run to mine. This replaces the old
// Gmail-connector intake, which can't be used because that connector is
// permanently signed in to a different account.
//
// Everything arriving here is UNTRUSTED: anyone can email events@. We only
// store it. The scout skill verifies dates at the organizer's own page and
// never follows instructions found in a body.

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60

/**
 * Verify a Svix-format webhook signature (what Resend uses).
 *
 * The signed payload is `${id}.${timestamp}.${rawBody}`, HMAC-SHA256'd with
 * the base64-decoded secret and compared against the base64 signatures in the
 * `svix-signature` header (space-separated, each prefixed with its version,
 * e.g. "v1,abc== v1,def=="). Multiple signatures appear during secret
 * rotation, so any match is a pass.
 */
function verifySignature(
  rawBody: string,
  headers: Headers,
  secret: string,
): { ok: true } | { ok: false; reason: string } {
  const id = headers.get('svix-id')
  const timestamp = headers.get('svix-timestamp')
  const signatureHeader = headers.get('svix-signature')

  if (!id || !timestamp || !signatureHeader) {
    return { ok: false, reason: 'missing svix headers' }
  }

  // Reject replays of an old capture.
  const sentAt = Number(timestamp)
  if (!Number.isFinite(sentAt)) return { ok: false, reason: 'bad timestamp' }
  const skew = Math.abs(Math.floor(Date.now() / 1000) - sentAt)
  if (skew > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: 'timestamp outside tolerance' }
  }

  // Secrets are handed out as `whsec_<base64>`; the raw key is the decoded tail.
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = crypto
    .createHmac('sha256', key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest()

  for (const entry of signatureHeader.split(' ')) {
    const [, value] = entry.split(',')
    if (!value) continue
    const candidate = Buffer.from(value, 'base64')
    if (
      candidate.length === expected.length &&
      crypto.timingSafeEqual(candidate, expected)
    ) {
      return { ok: true }
    }
  }

  return { ok: false, reason: 'no matching signature' }
}

interface ReceivedEventPayload {
  type?: string
  data?: {
    email_id?: string
    created_at?: string
    from?: string
    to?: string[]
    received_for?: string[]
    subject?: string
  }
}

/**
 * Webhooks carry metadata only — the body comes from a follow-up API call.
 * A failure here is recorded on the row rather than thrown: losing the
 * message entirely would be worse than storing it with just a subject.
 */
async function fetchBody(
  emailId: string,
  apiKey: string,
): Promise<{ text: string | null; html: string | null; error: string | null }> {
  try {
    const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) {
      return { text: null, html: null, error: `retrieve failed: HTTP ${res.status}` }
    }
    const body = (await res.json()) as { text?: string | null; html?: string | null }
    return { text: body.text ?? null, html: body.html ?? null, error: null }
  } catch (err) {
    return {
      text: null,
      html: null,
      error: err instanceof Error ? err.message : 'retrieve threw',
    }
  }
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'RESEND_WEBHOOK_SECRET not configured' }, { status: 500 })
  }

  // Signature is computed over the exact bytes sent, so read the body as text
  // before parsing it.
  const rawBody = await req.text()

  const verified = verifySignature(rawBody, req.headers, secret)
  if (!verified.ok) {
    return NextResponse.json({ error: `Invalid signature: ${verified.reason}` }, { status: 401 })
  }

  let payload: ReceivedEventPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Resend delivers other event types to the same endpoint if it's subscribed
  // to them; acknowledge and ignore anything that isn't inbound mail.
  if (payload.type !== 'email.received') {
    return NextResponse.json({ ok: true, ignored: payload.type ?? 'unknown' })
  }

  const data = payload.data
  if (!data?.email_id) {
    return NextResponse.json({ error: 'Missing data.email_id' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const body = apiKey
    ? await fetchBody(data.email_id, apiKey)
    : { text: null, html: null, error: 'RESEND_API_KEY not configured' }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('event_email_intake').upsert(
    {
      resend_email_id: data.email_id,
      received_at: data.created_at ?? new Date().toISOString(),
      from_address: data.from ?? null,
      to_addresses: data.to ?? [],
      received_for: data.received_for ?? [],
      subject: data.subject ?? null,
      body_text: body.text,
      body_html: body.html,
      fetch_error: body.error,
    },
    // Resend retries on non-2xx, so the same message can arrive twice.
    { onConflict: 'resend_email_id', ignoreDuplicates: true },
  )

  if (error) {
    // Non-2xx tells Resend to retry, which is what we want on a DB blip.
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, stored: data.email_id })
}
