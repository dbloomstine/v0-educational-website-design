import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { FormShell } from '@/components/directory/FormShell'
import { EditProfileForm } from '@/components/directory/forms'
import { BadgeSnippet, NewsletterOffer, ViewsPanel } from '@/components/directory/owner'
import { SESSION_COOKIE, readSession, type ProfileEdits } from '@/lib/directory/claim'
import { badgeImageUrl, badgeSnippet, badgeWords } from '@/lib/directory/badge'
import { isSubscribed } from '@/lib/directory/newsletter'
import { profilePath } from '@/lib/directory/people'
import { ownerEmail, personById, profileViewRows } from '@/lib/directory/server'
import { viewSummary } from '@/lib/directory/views'
import { CATEGORIES, DIRECTORY_PATH, directoryEnabled, practicesFor } from '@/lib/directory/taxonomy'

// The claimed person's edit page: open for a day after they confirm a claim or a sign-in link (a signed cookie).
// Every change goes to the desk for review; hiding is immediate. Below the form: their profile's views, a badge
// for their own site, and FundOps Daily (2026-10-24, workstream B).

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Edit your profile', robots: { index: false, follow: false } }

export default async function EditPage() {
  if (!directoryEnabled()) notFound()
  const session = readSession((await cookies()).get(SESSION_COOKIE)?.value)
  const person = session ? await personById(session.personId).catch(() => null) : null
  if (!session || !person || person.status === 'removed' || person.status === 'review') {
    return (
      <FormShell kicker="Directory" title="Edit your profile">
        <p className="font-news text-[17px] text-foreground">Your edit session has expired.</p>
        <p className="mt-2 font-ui text-[14px] text-foreground/75">
          Sessions last a day. Open your profile and choose &ldquo;Sign in to edit&rdquo; for a fresh link to your work email, or start from the{' '}
          <Link href={DIRECTORY_PATH} className="font-semibold text-foreground underline underline-offset-2">
            directory
          </Link>
          .
        </p>
      </FormShell>
    )
  }
  const pending = person.pending_edits as ProfileEdits | null
  const initial: ProfileEdits = pending ?? {
    headline: person.headline,
    description: person.description,
    photo_url: person.photo_url,
    contact_url: person.contact_url,
    practice_areas: person.claimed_practice_areas?.length ? person.claimed_practice_areas : person.practice_areas,
    notable: (person.notable ?? []).map((n) => ({ text: n.text, year: n.year ?? null })),
  }
  const category = CATEGORIES[person.category]
  const path = profilePath(person)
  const [rows, email] = await Promise.all([profileViewRows(person.id), ownerEmail(person.id, session.claimId)])
  const subscribed = email ? await isSubscribed(email) : true
  return (
    <FormShell
      kicker="Directory"
      title={person.full_name}
      intro={
        <p>
          What you add here appears on{' '}
          <Link href={path} className="font-semibold text-foreground underline underline-offset-2">
            your profile
          </Link>{' '}
          once we have reviewed it. The facts from {person.firm_name}&rsquo;s own site stay as the firm publishes them; to change those, change
          them there or ask us to correct them.
        </p>
      }
    >
      <EditProfileForm
        initial={initial}
        hidden={person.status === 'hidden'}
        hiddenByOwner={person.hidden_by === 'owner'}
        profileHref={path}
        pending={Boolean(pending)}
        practices={practicesFor(category).map((x) => ({ id: x.id, label: x.label }))}
      />
      <div className="mt-8 space-y-8">
        <ViewsPanel v={viewSummary(rows)} />
        {person.status === 'published' && <BadgeSnippet snippet={badgeSnippet(category, path)} imageUrl={badgeImageUrl(category).replace('https://fundopshq.com', '')} words={badgeWords(category)} />}
        {email && !subscribed && <NewsletterOffer email={email} />}
      </div>
    </FormShell>
  )
}
