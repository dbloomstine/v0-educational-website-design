import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FormShell } from '@/components/directory/FormShell'
import { ClaimForm } from '@/components/directory/forms'
import { loadPersonBySlug } from '@/lib/directory/data'
import { canClaim } from '@/lib/directory/claim'
import { displayDomain, profilePath, type Person } from '@/lib/directory/people'
import { personBySlug } from '@/lib/directory/server'
import { directoryEnabled } from '@/lib/directory/taxonomy'

// "Is this you? Claim this profile" (2026-10-24): a work email at the firm's domain, then a one-time link.
// On a claimed profile the same page is "Sign in to edit": the link goes to the address that claimed it (or, from
// another address at the firm, it is a new claim, and the earlier claimer is told). No passwords.

export const metadata: Metadata = { title: 'Claim your profile', robots: { index: false, follow: false } }

type Params = { searchParams: Promise<{ p?: string | string[] }> }

/** The cached published profile; else, uncached, one its owner hid (they sign in here to show it again). */
async function load(slug: string): Promise<Person | null> {
  const published = await loadPersonBySlug(slug)
  if (published) return published
  const p = await personBySlug(slug).catch(() => null)
  return p && p.status === 'hidden' && canClaim(p) ? p : null
}

export default async function ClaimPage({ searchParams }: Params) {
  if (!directoryEnabled()) notFound()
  const { p: slug } = await searchParams
  const person = typeof slug === 'string' ? await load(slug) : null
  if (!person) notFound()
  const domain = displayDomain(person.firm_domain)
  const claimed = Boolean(person.claimed_at)
  const name = (
    <Link href={profilePath(person)} className="font-semibold text-foreground underline underline-offset-2">
      {person.full_name}
    </Link>
  )
  return (
    <FormShell
      kicker="Directory"
      title={claimed ? 'Sign in to edit your profile' : 'Claim your profile'}
      intro={
        claimed ? (
          <p>
            The profile of {name} ({person.firm_name}). Enter your work email and we send you a one-time link to edit it, or to hide it. There is no
            password.
          </p>
        ) : (
          <p>
            Are you {name} of {person.firm_name}, or at the firm acting for them? Confirm with a work email and you can add a headline, a short
            description, a photo and a contact link, or hide the profile. Claiming is free.
          </p>
        )
      }
    >
      <ClaimForm slug={person.slug} domain={domain} signin={claimed} />
    </FormShell>
  )
}
