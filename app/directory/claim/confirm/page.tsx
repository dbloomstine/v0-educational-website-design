import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FormShell } from '@/components/directory/FormShell'
import { ConfirmClaim } from '@/components/directory/forms'
import { hashToken, looksLikeToken } from '@/lib/directory/claim'
import { isSubscribed } from '@/lib/directory/newsletter'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { directoryEnabled } from '@/lib/directory/taxonomy'

// Where the claim (or sign-in) email lands. The token is posted only when the person presses the button: a firm's
// mail scanner opening the link confirms nothing. Not indexed; the address is never sent on as a referrer.
// FundOps Daily is offered with a tick box (plan B4), unless the address already gets it: one read by the
// token's hash, nothing written.

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Confirm your profile', robots: { index: false, follow: false }, referrer: 'no-referrer' }

type Params = { searchParams: Promise<{ t?: string | string[] }> }

async function offerFor(token: string): Promise<boolean> {
  if (!looksLikeToken(token)) return false
  try {
    const { data } = await getSupabaseAdmin().from('directory_claims').select('email, confirmed_at').eq('token_hash', hashToken(token)).maybeSingle()
    if (!data || data.confirmed_at) return false
    return !(await isSubscribed(data.email))
  } catch {
    return false
  }
}

export default async function ConfirmClaimPage({ searchParams }: Params) {
  if (!directoryEnabled()) notFound()
  const { t } = await searchParams
  const token = typeof t === 'string' ? t : ''
  return (
    <FormShell kicker="Directory" title="Confirm your profile">
      <ConfirmClaim token={token} offerNewsletter={await offerFor(token)} />
    </FormShell>
  )
}
