import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ConfirmNews } from '@/components/submit/ConfirmNews'

// Where the "Confirm my news" email lands (2026-10-22). The token is in the
// address (?t=); the page posts it only when the sender presses the button, so
// a firm's mail scanner opening the link confirms nothing. Not indexed, and the
// address is never sent on as a referrer.

export const metadata: Metadata = {
  title: 'Confirm your news',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

type Params = { searchParams: Promise<{ t?: string | string[] }> }

export default async function ConfirmNewsPage({ searchParams }: Params) {
  const { t } = await searchParams
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="paper flex-1">
        <div className="mx-auto max-w-[640px] px-4 pb-12 pt-8 lg:px-6">
          <h1 className="font-news text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground">Confirm your news</h1>
          <div className="panel panel-lead mt-5">
            <ConfirmNews token={typeof t === 'string' ? t : ''} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
