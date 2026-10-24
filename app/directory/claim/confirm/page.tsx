import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FormShell } from '@/components/directory/FormShell'
import { ConfirmClaim } from '@/components/directory/forms'
import { directoryEnabled } from '@/lib/directory/taxonomy'

// Where the claim email lands. The token is posted only when the person presses the button: a firm's mail
// scanner opening the link confirms nothing. Not indexed; the address is never sent on as a referrer.

export const metadata: Metadata = { title: 'Confirm your profile', robots: { index: false, follow: false }, referrer: 'no-referrer' }

type Params = { searchParams: Promise<{ t?: string | string[] }> }

export default async function ConfirmClaimPage({ searchParams }: Params) {
  if (!directoryEnabled()) notFound()
  const { t } = await searchParams
  return (
    <FormShell kicker="Directory" title="Confirm your profile">
      <ConfirmClaim token={typeof t === 'string' ? t : ''} />
    </FormShell>
  )
}
