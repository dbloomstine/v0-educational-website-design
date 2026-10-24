import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FormShell } from '@/components/directory/FormShell'
import { ClaimForm } from '@/components/directory/forms'
import { loadPerson } from '@/lib/directory/data'
import { displayDomain, profilePath } from '@/lib/directory/people'
import { CATEGORIES, directoryEnabled } from '@/lib/directory/taxonomy'

// "Is this you? Claim this profile" (2026-10-24): a work email at the firm's domain, then a one-time link.

export const metadata: Metadata = { title: 'Claim your profile', robots: { index: false, follow: false } }

type Params = { searchParams: Promise<{ p?: string | string[] }> }

export default async function ClaimPage({ searchParams }: Params) {
  if (!directoryEnabled()) notFound()
  const { p: slug } = await searchParams
  const person = typeof slug === 'string' ? await loadPerson(CATEGORIES.fund_lawyer.id, slug) : null
  if (!person) notFound()
  const domain = displayDomain(person.firm_domain)
  return (
    <FormShell
      kicker="Directory"
      title="Claim your profile"
      intro={
        <p>
          Are you{' '}
          <Link href={profilePath(person)} className="font-semibold text-foreground underline underline-offset-2">
            {person.full_name}
          </Link>{' '}
          of {person.firm_name}? Confirm with your work email and you can add a headline, a short description, a photo and a contact link,
          or hide the profile. Claiming is free.
        </p>
      }
    >
      {person.claimed_at && (
        <p className="mb-4 font-ui text-[13px] text-foreground/75">This profile has been claimed. Confirm again with your work email to edit it.</p>
      )}
      <ClaimForm slug={person.slug} domain={domain} />
    </FormShell>
  )
}
