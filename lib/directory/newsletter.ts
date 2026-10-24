/**
 * FundOps Daily offered to a directory owner (plan B4): at the end of a claim
 * (a tick box on the confirm page) and on the edit page. The address is one
 * that has just proved it is at the firm, so the signup goes through the site's
 * own subscribe route, the same signup in every way (welcome email, form name),
 * as the news-submission confirm does (app/api/news/submit/confirm/route.ts).
 */
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { POST as subscribe } from '@/app/api/newsletter/subscribe/route'

export type OwnerSignup = 'subscribed' | 'already' | 'failed'
export type OwnerSignupForm = 'directory-claim' | 'directory-edit'

export async function subscribeOwner(email: string, form: OwnerSignupForm, page: string): Promise<OwnerSignup> {
  try {
    const res = await subscribe(
      new Request('https://fundopshq.com/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, form, page }),
      }),
    )
    if (!res.ok) return 'failed'
    const data = (await res.json().catch(() => ({}))) as { message?: string }
    return data.message === 'Already subscribed' ? 'already' : 'subscribed'
  } catch {
    return 'failed'
  }
}

/** Whether the address already gets FundOps Daily (so the offer is not made). False on any doubt. */
export async function isSubscribed(email: string): Promise<boolean> {
  try {
    const { data } = await getSupabaseAdmin().from('newsletter_subscribers').select('status').eq('email', email.trim().toLowerCase()).maybeSingle()
    return data?.status === 'confirmed'
  } catch {
    return false
  }
}
