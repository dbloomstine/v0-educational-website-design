import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { suppress } from '@/lib/outreach-v2/store'

export const dynamic = 'force-dynamic'

/**
 * Unsubscribe from FundOpsHQ outreach (lib/outreach-v2). Every outreach email
 * carries its own token in a visible link and in the List-Unsubscribe header.
 *
 * POST unsubscribes at once: that is the one-click request a mail app sends
 * (RFC 8058), and the button on the GET page. GET only shows the button, so a
 * link scanner that opens every URL in an email cannot unsubscribe anyone.
 */

const TOKEN = /^[a-f0-9]{32}$/

function page(title: string, body: string, status = 200): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;background:#f6f1e7;color:#14213d;margin:0;padding:48px 16px}main{max-width:460px;margin:0 auto}h1{font-size:22px;margin:0 0 12px}p{font-size:16px;line-height:1.5}button{font:inherit;font-weight:700;background:#14213d;color:#fff;border:0;border-radius:3px;padding:10px 18px;cursor:pointer}a{color:#14213d}</style></head>
<body><main>${body}</main></body></html>`
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

async function lookup(token: string | null): Promise<{ id: string; email: string } | null> {
  if (!token || !TOKEN.test(token)) return null
  const { data } = await getSupabaseAdmin().from('outreach_v2_messages').select('id, email').eq('unsub_token', token).maybeSingle()
  return (data as { id: string; email: string } | null) ?? null
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('t')
  const row = await lookup(token)
  if (!row) return page('Link not recognised', '<h1>This link was not recognised.</h1><p>To stop all email from FundOpsHQ, reply to any of our emails with the word “unsubscribe”.</p>', 404)
  return page(
    'Unsubscribe',
    `<h1>Stop emails from FundOpsHQ?</h1><p>No more outreach emails from Danny Bloomstine at FundOpsHQ will go to this address.</p>
<form method="post" action="/api/outreach/unsubscribe?t=${token}"><button type="submit">Unsubscribe</button></form>`,
  )
}

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get('t')
  const row = await lookup(token)
  if (!row) return page('Link not recognised', '<h1>This link was not recognised.</h1>', 404)
  const db = getSupabaseAdmin()
  await suppress(db, row.email, 'unsubscribed', row.id)
  await db.from('outreach_v2_messages').update({ unsubscribed_at: new Date().toISOString() }).eq('email', row.email).eq('status', 'sent').is('unsubscribed_at', null)
  return page('Unsubscribed', '<h1>You are unsubscribed.</h1><p>FundOpsHQ will not send outreach email to this address again. Sorry for the bother.</p><p><a href="https://fundopshq.com">fundopshq.com</a></p>')
}
