import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { withoutEventTags } from '@/lib/newsletter/interests'

export const dynamic = 'force-dynamic'

/**
 * Stop the Monday events email, and only that (lib/events/weekly-send.ts). The token is the subscriber's
 * `unsubscribe_token`, the same proof of who is asking as the daily's unsubscribe and preferences links.
 * It takes the event tags (`events`, `city:<slug>`) off the reader's interests; the daily keeps coming.
 *
 * POST does it at once: the one-click request a mail app sends from the List-Unsubscribe header (RFC 8058),
 * and the button on the GET page. GET only shows the button, so a link scanner that opens every URL in an
 * email cannot take anyone off.
 */

const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function page(title: string, body: string, status = 200): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;background:#F8F5EC;color:#1E3A5F;margin:0;padding:48px 16px}main{max-width:460px;margin:0 auto}h1{font-size:22px;margin:0 0 12px}p{font-size:16px;line-height:1.5}button{font:inherit;font-weight:700;background:#1E3A5F;color:#fff;border:0;border-radius:3px;padding:10px 18px;cursor:pointer}a{color:#1E3A5F}</style></head>
<body><main>${body}</main></body></html>`
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

const NOT_FOUND = '<h1>This link was not recognised.</h1><p>To stop the Monday events email, reply to it with the word “unsubscribe” and we will take you off by hand.</p>'

async function lookup(token: string | null): Promise<{ id: string; interests: unknown } | null> {
  if (!token || !TOKEN.test(token)) return null
  const { data } = await getSupabaseAdmin().from('newsletter_subscribers').select('id, interests').eq('unsubscribe_token', token).maybeSingle()
  return (data as { id: string; interests: unknown } | null) ?? null
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  const row = await lookup(token)
  if (!row) return page('Link not recognised', NOT_FOUND, 404)
  return page(
    'Stop the Monday events email',
    `<h1>Stop the Monday events email?</h1><p>You will keep getting FundOps Daily every morning, with the week’s events at the foot.</p>
<form method="post" action="/api/newsletter/events-unsubscribe?token=${encodeURIComponent(token as string)}"><button type="submit">Stop the Monday email</button></form>`,
  )
}

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  const row = await lookup(token)
  if (!row) return page('Link not recognised', NOT_FOUND, 404)
  const { error } = await getSupabaseAdmin()
    .from('newsletter_subscribers')
    .update({ interests: withoutEventTags(row.interests), updated_at: new Date().toISOString() })
    .eq('id', row.id)
  if (error) {
    console.error('[events-unsubscribe] update failed:', error)
    return page('Something went wrong', '<h1>Something went wrong.</h1><p>Please try again in a minute, or reply to the email and we will take you off by hand.</p>', 500)
  }
  return page(
    'Done',
    '<h1>Done. No more Monday events email.</h1><p>FundOps Daily still comes every morning, with the week’s events at the foot. The full calendar is at <a href="https://fundopshq.com/events">fundopshq.com/events</a>.</p>',
  )
}
