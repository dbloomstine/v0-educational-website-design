import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FormShell } from '@/components/directory/FormShell'
import { SuggestForm } from '@/components/directory/forms'
import { CATEGORIES, DIRECTORY_PATH, categoryBySlug, directoryEnabled } from '@/lib/directory/taxonomy'

// "Suggest a firm or add yourself" (2026-10-24, plan B9): from a search that found nobody and from /directory/about.
// Queued for the desk (directory_suggestions); nothing is listed until the desk has read the firm's own site.

export const metadata: Metadata = {
  title: 'Suggest a firm or add yourself',
  description: 'Tell FundOpsHQ about a fund lawyer, auditor or tax adviser, or a firm, that the directory does not list yet.',
  robots: { index: false, follow: true },
}

type Params = { searchParams: Promise<{ trade?: string | string[]; q?: string | string[] }> }

export default async function SuggestPage({ searchParams }: Params) {
  if (!directoryEnabled()) notFound()
  const { trade, q } = await searchParams
  const trades = Object.values(CATEGORIES).filter((c) => c.live)
  const initial = typeof trade === 'string' ? (categoryBySlug(trade)?.id ?? (trade in CATEGORIES ? trade : undefined)) : undefined
  const query = typeof q === 'string' ? q.slice(0, 60) : ''
  return (
    <FormShell
      kicker="Directory"
      title="Suggest a firm or add yourself"
      intro={
        <p>
          The{' '}
          <Link href={DIRECTORY_PATH} className="font-semibold text-foreground underline underline-offset-2">
            directory
          </Link>{' '}
          lists partners and directors with a fund practice, each from the firm&rsquo;s own site. Missing someone, or a whole firm? Tell us and we will
          check. Nobody pays to be listed.
        </p>
      }
    >
      <SuggestForm trades={trades.map((c) => ({ id: c.id, label: c.plural }))} initialTrade={initial} fromQuery={query} />
    </FormShell>
  )
}
