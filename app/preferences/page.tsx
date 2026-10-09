import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PreferencesForm } from '@/components/newsletter/PreferencesForm'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { sanitizeInterests, sanitizeRole } from '@/lib/newsletter/interests'

export const metadata: Metadata = {
  title: 'What you follow',
  description: 'Choose the strategies FundOps Daily groups for you each morning.',
  robots: { index: false, follow: false },
}

// One reader's choices, behind the token from their own email: never cached.
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function findSubscriber(token: string | undefined) {
  if (!token || !UUID.test(token)) return null
  const { data } = await getSupabaseAdmin()
    .from('newsletter_subscribers')
    .select('status, interests, reader_role')
    .eq('unsubscribe_token', token)
    .maybeSingle()
  return data as { status: string; interests: string[] | null; reader_role: string | null } | null
}

export default async function PreferencesPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const subscriber = await findSubscriber(token)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="mx-auto max-w-[1000px] px-4 pb-16 pt-8 lg:px-6">
          <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400">FundOps Daily</p>
          <h1 className="mt-2 font-news text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[42px]">
            What you <span className="italic" style={{ color: 'var(--display-accent)' }}>follow.</span>
          </h1>

          {subscriber && token ? (
            <>
              <p className="mt-3 max-w-[60ch] font-news text-[18px] leading-[1.45] text-foreground/80">
                {subscriber.status === 'confirmed'
                  ? 'Tick the strategies you care about and each morning’s edition gathers those stories for you.'
                  : 'This address is not on the list at the moment, so no editions are going to it. Tick what you follow and press the button, and you are back on it.'}
              </p>
              <PreferencesForm
                resubscribe={subscriber.status !== 'confirmed'}
                token={token}
                initialInterests={sanitizeInterests(subscriber.interests)}
                initialRole={sanitizeRole(subscriber.reader_role) ?? null}
              />
            </>
          ) : (
            <>
              <p className="mt-3 max-w-[60ch] font-news text-[18px] leading-[1.45] text-foreground/80">
                This page opens from your own copy of FundOps Daily. Use the “Choose what you follow” link at the foot
                of any edition and it will bring you back here with your choices.
              </p>
              <p className="mt-4 font-ui text-[14px] text-foreground/80">
                Not a subscriber yet?{' '}
                <Link href="/#subscribe" className="font-semibold underline underline-offset-2">
                  Subscribe free
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
