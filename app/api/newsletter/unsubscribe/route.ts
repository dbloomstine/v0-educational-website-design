import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return htmlResponse({
      eyebrow: 'Unsubscribe',
      headline: 'This link looks broken',
      body: "We couldn't read an unsubscribe token from this link. If you meant to unsubscribe, try clicking the link in the most recent edition of FundOps Daily.",
      status: 400,
    })
  }

  const supabase = getSupabaseAdmin()

  const { data: subscriber } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('unsubscribe_token', token)
    .single()

  if (!subscriber) {
    return htmlResponse({
      eyebrow: 'Unsubscribe',
      headline: "We can't find that subscription",
      body: "We couldn't match this link to a subscriber. It may have already been used, or the link may be malformed.",
      status: 404,
    })
  }

  if (subscriber.status === 'unsubscribed') {
    return htmlResponse({
      eyebrow: 'Already unsubscribed',
      headline: "You're off the list",
      body: 'This email address is already unsubscribed from FundOps Daily. No further action is needed.',
      showResubscribe: true,
    })
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
    return htmlResponse({
      eyebrow: 'Unsubscribe',
      headline: 'Something went wrong',
      body: 'We hit an error on our end. Please try the link again in a minute, or reply to any FundOps Daily edition and we will remove you manually.',
      status: 500,
    })
  }

  return htmlResponse({
    eyebrow: 'Unsubscribed',
    headline: "You're off the list",
    body: "You won't receive any more FundOps Daily emails. The daily feed, show, and archive stay open at fundopshq.com whenever you want to check back in.",
    showResubscribe: true,
  })
}

interface PageContent {
  eyebrow: string
  headline: string
  body: string
  status?: number
  showResubscribe?: boolean
}

function htmlResponse({ eyebrow, headline, body, status = 200, showResubscribe = false }: PageContent): NextResponse {
  // Brand palette mirrored from app/brand/page.tsx and lib/newsletter/email-template.ts.
  const NAVY = '#1E3A5F'
  const CREAM = '#F8F5EC'
  const AMBER = '#E6B045'
  const INK = '#1E3A5F'
  const INK_MUTED = '#5A6B82'
  const HAIRLINE = '#D8D0BC'
  const FONT_SERIF = `Georgia, 'Times New Roman', Times, serif`
  const FONT_MONO = `ui-monospace, Menlo, Consolas, 'Courier New', monospace`
  const FONT_SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif`

  const resubscribeLink = showResubscribe
    ? `<a class="resubscribe" href="https://fundopshq.com/#subscribe">Changed your mind? Resubscribe &rarr;</a>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>FundOpsHQ — ${escapeHtml(headline)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      background-color: ${CREAM};
      color: ${INK};
      font-family: ${FONT_SANS};
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; }
    .masthead {
      background-color: ${NAVY};
      color: ${CREAM};
      border-bottom: 4px solid ${AMBER};
    }
    .masthead-inner {
      max-width: 720px;
      margin: 0 auto;
      padding: 22px 28px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .wordmark {
      font-family: ${FONT_SERIF};
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.01em;
      margin: 0;
    }
    .wordmark em {
      color: ${AMBER};
      font-style: italic;
      font-weight: 400;
    }
    .masthead-meta {
      font-family: ${FONT_MONO};
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(248, 245, 236, 0.7);
    }
    main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 72px 28px;
    }
    .card {
      max-width: 560px;
      width: 100%;
      text-align: center;
    }
    .eyebrow {
      font-family: ${FONT_MONO};
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: ${INK_MUTED};
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .eyebrow::before,
    .eyebrow::after {
      content: "";
      display: inline-block;
      width: 28px;
      height: 1px;
      background-color: ${HAIRLINE};
    }
    h1 {
      font-family: ${FONT_SERIF};
      font-size: 44px;
      line-height: 1.1;
      font-weight: 700;
      color: ${INK};
      margin: 20px 0 20px;
      letter-spacing: -0.02em;
    }
    h1 .amber-bar {
      display: block;
      width: 56px;
      height: 3px;
      background-color: ${AMBER};
      margin: 22px auto 0;
    }
    .body {
      font-family: ${FONT_SERIF};
      font-size: 18px;
      line-height: 1.65;
      color: ${INK_MUTED};
      margin: 0 0 36px;
    }
    .cta {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 14px 26px;
      background-color: ${INK};
      color: ${CREAM};
      font-family: ${FONT_MONO};
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      text-decoration: none;
      border-radius: 2px;
      transition: background-color 0.15s ease;
    }
    .cta:hover { background-color: #0F1E33; }
    .cta-arrow { font-size: 14px; line-height: 1; }
    .resubscribe {
      display: block;
      margin-top: 22px;
      font-family: ${FONT_MONO};
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${INK_MUTED};
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .resubscribe:hover { color: ${AMBER}; }
    footer {
      border-top: 1px solid ${HAIRLINE};
      padding: 20px 28px;
      font-family: ${FONT_MONO};
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${INK_MUTED};
      text-align: center;
    }
    footer a { text-decoration: none; color: ${INK}; }
    footer a:hover { color: ${AMBER}; }
    @media (max-width: 560px) {
      h1 { font-size: 34px; }
      .body { font-size: 16px; }
      .masthead-inner { padding: 18px 20px; }
      main { padding: 56px 20px; }
    }
  </style>
</head>
<body>
  <header class="masthead">
    <div class="masthead-inner">
      <p class="wordmark">FundOps<em>HQ</em></p>
      <span class="masthead-meta">FundOps Daily &middot; Unsubscribe</span>
    </div>
  </header>
  <main>
    <div class="card">
      <span class="eyebrow">${escapeHtml(eyebrow)}</span>
      <h1>
        ${escapeHtml(headline)}
        <span class="amber-bar" aria-hidden="true"></span>
      </h1>
      <p class="body">${escapeHtml(body)}</p>
      <a class="cta" href="https://fundopshq.com/">
        Back to FundOpsHQ
        <span class="cta-arrow" aria-hidden="true">&rarr;</span>
      </a>
      ${resubscribeLink}
    </div>
  </main>
  <footer>
    <a href="https://fundopshq.com/">fundopshq.com</a>
  </footer>
</body>
</html>`

  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
