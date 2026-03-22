import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return htmlResponse('Missing unsubscribe token', 400)
  }

  const supabase = getSupabaseAdmin()

  const { data: subscriber } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('unsubscribe_token', token)
    .single()

  if (!subscriber) {
    return htmlResponse('Invalid unsubscribe link', 404)
  }

  if (subscriber.status === 'unsubscribed') {
    return htmlResponse('You have already been unsubscribed.')
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriber.id)

  if (error) {
    console.error('Failed to unsubscribe:', error)
    return htmlResponse('Something went wrong. Please try again.', 500)
  }

  return htmlResponse("You've been unsubscribed from FundOps Daily. You won't receive any more emails.")
}

function htmlResponse(message: string, status: number = 200): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FundOps Daily — Unsubscribe</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:Arial,Helvetica,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;padding:40px;max-width:400px;">
    <h1 style="color:#f8fafc;font-size:20px;margin:0 0 12px;">
      <span style="color:#f8fafc;">FundOps</span><span style="color:#3b82f6;">Daily</span>
    </h1>
    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;">${message}</p>
    <a href="https://fundopshq.com/news" style="color:#3b82f6;font-size:14px;text-decoration:none;">Back to FundOpsHQ</a>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
