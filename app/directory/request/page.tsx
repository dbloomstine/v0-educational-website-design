import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FormShell } from '@/components/directory/FormShell'
import { RequestForm } from '@/components/directory/forms'
import { loadPersonBySlug } from '@/lib/directory/data'
import { profilePath } from '@/lib/directory/people'
import { directoryEnabled } from '@/lib/directory/taxonomy'

// "Request a correction or removal", from any profile, by anyone. A removal hides the profile at once.

export const metadata: Metadata = { title: 'Request a correction or removal', robots: { index: false, follow: false } }

type Params = { searchParams: Promise<{ p?: string | string[] }> }

export default async function RequestPage({ searchParams }: Params) {
  if (!directoryEnabled()) notFound()
  const { p: slug } = await searchParams
  const person = typeof slug === 'string' ? await loadPersonBySlug(slug) : null
  if (!person) notFound()
  return (
    <FormShell
      kicker="Directory"
      title="Request a correction or removal"
      intro={
        <p>
          About{' '}
          <Link href={profilePath(person)} className="font-semibold text-foreground underline underline-offset-2">
            {person.full_name}
          </Link>{' '}
          ({person.firm_name}). We check corrections against the firm&rsquo;s own page, and answer within two business days. See{' '}
          <Link href="/privacy#directory" className="underline underline-offset-2">
            how the directory works
          </Link>
          .
        </p>
      }
    >
      <RequestForm slug={person.slug} name={person.full_name} />
    </FormShell>
  )
}
