import { NextResponse } from 'next/server'
import { renderNewsletterEmail } from '@/lib/newsletter/email-template'
import { getSampleContent } from '@/lib/newsletter/sample-content'
import { SPONSOR_LABEL } from '@/lib/sponsor/label'
import { LIMITS, emailLogoWidth } from '@/lib/sponsor/packages'
import { readLogo } from '@/lib/sponsor/requests'

/**
 * Today's edition with a prospect's own ad in it, for the builder on /sponsor
 * ("see it in today's email"). Nothing is stored and nothing is sent: the
 * page that comes back is a picture of what would be.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')
  const name = text(body.company, LIMITS.company) || 'Your firm'
  const blurb = text(body.blurb, LIMITS.blurbChars) || 'Your copy appears here, under the masthead and again at the foot of the edition.'
  const ctaText = text(body.ctaText, LIMITS.ctaText) || 'Learn more'
  // Only a logo we have checked is a picture goes in; anything else and the firm's name is set as a wordmark.
  const logo = readLogo(body.logoData)
  const ok = logo && !('error' in logo) ? logo : null
  const logoUrl = ok && typeof body.logoData === 'string' ? body.logoData : undefined

  try {
    const sample = await getSampleContent()
    if (sample.totalArticles === 0) return NextResponse.json({ error: 'No edition to show right now.' }, { status: 503 })
    const email = renderNewsletterEmail({
      ...sample,
      unsubscribeUrl: 'https://fundopshq.com/sponsor',
      sponsorSlate: { label: SPONSOR_LABEL.toUpperCase(), sponsors: [{ name, blurb, ctaUrl: 'https://fundopshq.com/sponsor', ctaText, logoUrl, logoWidth: ok ? emailLogoWidth(ok.width, ok.height) : undefined }], sample: true },
    })
    return new Response(email, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
  } catch (err) {
    console.error('[sponsor preview]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'The preview could not be made.' }, { status: 500 })
  }
}
