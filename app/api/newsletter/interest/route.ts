import { getSupabaseAdmin } from '@/lib/supabase/client'
import { ALL_INTERESTS, interestWords, sanitizeInterests } from '@/lib/newsletter/interests'
import { readInterestToken } from '@/lib/newsletter/interest-link'

export const dynamic = 'force-dynamic'

/**
 * The one-click "follow" links in the daily email (lib/newsletter/interest-link.ts).
 *
 * GET ?t=<token>&i=<interest> shows a small page that names the interest and
 * asks once; the page's button POSTs the same two values and the choice is
 * saved. Nothing is saved on the GET: link scanners open every link in a
 * message, and a link that saved on being opened would tick boxes for readers
 * who never tapped. No login: the token is signed by the server and names the
 * reader; an address alone opens nothing.
 */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · FundOps Daily</title>
<style>body{margin:0;background:#F8F5EC;color:#1E3A5F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}main{max-width:520px;margin:0 auto;padding:48px 20px}.eyebrow{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#5A6B82;margin:0 0 12px}h1{font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;margin:0 0 14px}p{font-size:16px;line-height:1.5;margin:0 0 14px}button{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;background:#1E3A5F;color:#F8F5EC;border:0;border-radius:2px;padding:14px 26px;cursor:pointer}a{color:#1E3A5F}.muted{color:#5A6B82;font-size:14px}</style></head>
<body><main><p class="eyebrow">FundOps Daily</p>${body}</main></body></html>`
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

const invalid = () => page('This link is not valid', `<h1>This link is not valid.</h1><p>Open it from your latest FundOps Daily, or use <b>Choose what you follow</b> at the foot of any edition.</p>`, 400)

function parse(t: unknown, i: unknown): { id: string; interest: string; label: string } | null {
  const id = readInterestToken(t)
  const interest = typeof i === 'string' ? sanitizeInterests([i])[0] : undefined
  if (!id || !interest) return null
  return { id, interest, label: interestWords([interest]) }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const p = parse(url.searchParams.get('t'), url.searchParams.get('i'))
  if (!p) return invalid()
  const name = ALL_INTERESTS.find((x) => x.id === p.interest)?.label ?? p.label
  return page(
    `Follow ${name}?`,
    `<h1>Follow ${esc(p.label)} in FundOps Daily?</h1>
<p>From the next edition, ${esc(p.label)} stories are grouped under <b>What you follow</b>, straight after the top stories. Nothing else changes.</p>
<form method="post" action="/api/newsletter/interest"><input type="hidden" name="t" value="${esc(String(url.searchParams.get('t')))}"><input type="hidden" name="i" value="${esc(p.interest)}"><button type="submit">Yes, follow ${esc(p.label)}</button></form>
<p class="muted" style="margin-top:18px;">One tap. You can add more or change your mind from the foot of any edition.</p>`,
  )
}

export async function POST(req: Request) {
  let t: unknown, i: unknown
  const type = req.headers.get('content-type') ?? ''
  try {
    if (type.includes('application/json')) ({ t, i } = (await req.json()) as { t?: unknown; i?: unknown })
    else {
      const form = await req.formData()
      t = form.get('t')
      i = form.get('i')
    }
  } catch {
    return invalid()
  }
  const p = parse(t, i)
  if (!p) return invalid()

  const db = getSupabaseAdmin()
  const { data: row, error } = await db.from('newsletter_subscribers').select('id, status, interests, unsubscribe_token').eq('id', p.id).maybeSingle()
  if (error || !row || row.status !== 'confirmed') return page('No live subscription', `<h1>We could not find a live subscription.</h1><p>Subscribe again at <a href="https://fundopshq.com">fundopshq.com</a> and choose what you follow there.</p>`, 404)
  const interests = sanitizeInterests([...((row.interests as string[] | null) ?? []), p.interest])
  const { error: upErr } = await db.from('newsletter_subscribers').update({ interests, updated_at: new Date().toISOString() }).eq('id', p.id)
  if (upErr) return page('Could not save', `<h1>Could not save just now.</h1><p>Please try the link again in a moment.</p>`, 500)
  const prefs = `https://fundopshq.com/preferences?token=${encodeURIComponent(String(row.unsubscribe_token))}`
  return page(
    'Done',
    `<h1>Done. You follow ${esc(interestWords(interests))}.</h1>
<p>From the next edition those stories lead, under <b>What you follow</b>.</p>
<p class="muted"><a href="${esc(prefs)}">Add more, or change your mind</a> · <a href="https://fundopshq.com/news">Read the full feed</a></p>`,
  )
}
