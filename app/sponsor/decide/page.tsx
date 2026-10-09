import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { DecideButtons } from '@/components/sponsor/DecideButtons'
import { SponsorCardView, SponsorStripView, type SlotSponsor } from '@/components/sponsor/SponsorViews'
import { renderNewsletterEmail } from '@/lib/newsletter/email-template'
import { getSampleContent } from '@/lib/newsletter/sample-content'
import { SPONSOR_LABEL } from '@/lib/sponsor/label'
import { longDay, packageOf, usd } from '@/lib/sponsor/packages'
import { hostedLogo, requestByToken } from '@/lib/sponsor/requests'

export const metadata: Metadata = { title: 'Sponsor request', robots: { index: false, follow: false } }
// One request, behind the secret in the owner's email: never cached.
export const dynamic = 'force-dynamic'

/**
 * Where the owner says yes or no to a sponsor request: the ad drawn as it
 * would run, on the site and in today's email, and two buttons. Opening this
 * page does nothing; only a button does (app/api/sponsor/decide).
 */
export default async function DecidePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const r = token ? await requestByToken(token) : null
  const pkg = r ? packageOf(r.package) : undefined
  const logo = r ? hostedLogo(r.logo_link) : null
  const ad: SlotSponsor | null = r ? { name: r.company, tagline: r.tagline, blurb: r.blurb, ctaUrl: r.cta_url, ctaText: r.cta_text ?? undefined, logoUrl: logo ?? undefined } : null

  let emailHtml: string | null = null
  if (r) {
    try {
      const sample = await getSampleContent()
      emailHtml = renderNewsletterEmail({
        ...sample,
        unsubscribeUrl: 'https://fundopshq.com/sponsor',
        sponsorSlate: { label: SPONSOR_LABEL.toUpperCase(), sponsors: [{ name: r.company, blurb: r.blurb, ctaUrl: r.cta_url, ctaText: r.cta_text ?? undefined, logoUrl: logo ?? undefined, logoWidth: logo ? 160 : undefined }], sample: true },
      })
    } catch {
      emailHtml = null
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="mx-auto max-w-[1000px] px-4 pb-16 pt-8 lg:px-6">
          <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400">Sponsor request</p>
          {!r || !ad || !token ? (
            <>
              <h1 className="mt-2 font-news text-[34px] font-medium leading-[1.05] tracking-[-0.02em]">Nothing to decide here.</h1>
              <p className="mt-3 max-w-[60ch] font-news text-[18px] leading-[1.45] text-foreground/80">This page opens from the link in a sponsor-request email. The link may be incomplete.</p>
            </>
          ) : (
            <>
              <h1 className="mt-2 font-news text-[34px] font-medium leading-[1.05] tracking-[-0.02em] sm:text-[42px]">{r.company}</h1>
              <p className="mt-2 font-news text-[19px] leading-[1.4] text-foreground/85">
                {pkg?.name ?? r.package}, {longDay(r.starts_on)} to {longDay(r.ends_on)} · <strong className="font-bold text-foreground">{usd(r.price_usd)}</strong>
              </p>
              <p className="mt-1 font-ui text-[14px] text-foreground/80">
                {r.contact_name} · <a href={`mailto:${r.email}`} className="underline underline-offset-2">{r.email}</a> ·{' '}
                <a href={r.website} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">{r.website}</a>
              </p>
              {r.notes && <p className="mt-3 max-w-[70ch] border-l-4 border-[var(--tab)] pl-3 font-news text-[16.5px] leading-[1.45]">{r.notes}</p>}

              <div className="mt-6">
                {r.status === 'pending' ? (
                  <DecideButtons token={token} company={r.company} />
                ) : (
                  <p className="font-news text-[20px]">This request was {r.status}{r.decided_at ? ` on ${new Date(r.decided_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'America/New_York' })}` : ''}.</p>
                )}
                {r.status === 'pending' && (
                  <p className="mt-2 max-w-[64ch] font-ui text-[12.5px] leading-snug text-muted-foreground">
                    Approving books the dates, puts the ad in the email and on the site from the first day, and emails them how to pay. Declining emails them a polite no.
                    {r.logo_link && !logo ? ' Their logo is a link to another site, so it is not placed automatically: the firm’s name runs as a wordmark until a file is added.' : ''}
                  </p>
                )}
              </div>

              <h2 className="mt-9 font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">On the site · above the stories</h2>
              <div inert aria-hidden="true" className="pointer-events-none mt-2 select-none"><SponsorStripView sponsor={ad} line="" /></div>
              <h2 className="mt-6 font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">On the site · beside the stories</h2>
              <div inert aria-hidden="true" className="pointer-events-none mt-2 max-w-[340px] select-none"><SponsorCardView sponsor={ad} /></div>
              <p className="mt-3 font-ui text-[13px] text-foreground/80">Their link: <a href={r.cta_url} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">{r.cta_url}</a></p>

              {emailHtml && (
                <>
                  <h2 className="mt-8 font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">In today&rsquo;s email</h2>
                  <iframe title="The ad in today's email" srcDoc={emailHtml} sandbox="" className="mt-2 h-[720px] w-full max-w-[760px] border border-border bg-white" />
                </>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
