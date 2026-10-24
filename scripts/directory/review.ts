/**
 * The desk's tool for the directory (2026-10-24). Dry run unless --apply.
 *
 *   npx tsx --env-file=.env.local scripts/directory/review.ts queue
 *       counts by status, profiles in review, pending edits, open requests
 *   ... review.ts publish <slug> [<slug>...] [--apply]
 *   ... review.ts publish --all-review [--firm kirkland.com] [--apply]
 *   ... review.ts approve-edits <slug> [--apply]   pending edits go live
 *   ... review.ts reject-edits <slug> [--apply]    pending edits dropped
 *   ... review.ts hide <slug> | unhide <slug> | remove <slug> [--apply]
 *   ... review.ts resolve <request id> done|rejected [--notes "..."] [--apply]
 *
 * Pages read a cache that refreshes within the hour (lib/directory/data.ts),
 * so a change made here shows by then. A hide or a removal request made on
 * the site itself clears the cache at once.
 */
import { createClient } from '@supabase/supabase-js'
import type { ProfileEdits } from '@/lib/directory/claim'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function one(slug: string) {
  const { data, error } = await db.from('directory_people').select('id, slug, full_name, firm_name, status, hidden_by, pending_edits, claimed_at').eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error(`no profile ${slug}`)
  return data
}

async function write(apply: boolean, what: string, run: () => PromiseLike<{ error: { message: string } | null }>) {
  if (!apply) return console.log(`[dry run] would ${what}`)
  const { error } = await run()
  if (error) throw new Error(`${what}: ${error.message}`)
  console.log(`done: ${what}`)
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2)
  const apply = rest.includes('--apply')
  const opt = (n: string) => {
    const i = rest.indexOf(`--${n}`)
    return i >= 0 ? rest[i + 1] : undefined
  }
  const slugs = rest.filter((a, i) => !a.startsWith('--') && !['--firm', '--notes'].includes(rest[i - 1]))

  if (cmd === 'queue') {
    for (const s of ['review', 'published', 'hidden', 'removed']) {
      const { count } = await db.from('directory_people').select('id', { count: 'exact', head: true }).eq('status', s)
      console.log(`${s}: ${count ?? 0}`)
    }
    const { data: edits } = await db.from('directory_people').select('slug, full_name, firm_name, pending_edits_at').not('pending_edits', 'is', null).order('pending_edits_at')
    console.log(`\npending edits: ${edits?.length ?? 0}`)
    for (const e of edits ?? []) console.log(`  ${e.slug}  ${e.full_name} (${e.firm_name})  ${e.pending_edits_at}`)
    const { data: reqs } = await db.from('directory_requests').select('id, person_slug, kind, contact_email, message, created_at').eq('status', 'open').order('created_at')
    console.log(`\nopen requests: ${reqs?.length ?? 0}`)
    for (const r of reqs ?? []) console.log(`  ${r.id}  ${r.kind}  ${r.person_slug}  <${r.contact_email}>  ${(r.message ?? '').slice(0, 120)}`)
    return
  }

  if (cmd === 'publish') {
    if (rest.includes('--all-review')) {
      let q = db.from('directory_people').select('id', { count: 'exact', head: true }).eq('status', 'review')
      const firm = opt('firm')
      if (firm) q = q.eq('firm_domain', firm)
      const { count } = await q
      let u = db.from('directory_people').update({ status: 'published' }).eq('status', 'review')
      if (firm) u = u.eq('firm_domain', firm)
      return write(apply, `publish ${count ?? 0} profiles in review${firm ? ` at ${firm}` : ''}`, () => u)
    }
    for (const slug of slugs) {
      const p = await one(slug)
      if (p.status !== 'review') {
        console.log(`${slug}: is ${p.status}, not in review; left alone`)
        continue
      }
      await write(apply, `publish ${slug} (${p.full_name}, ${p.firm_name})`, () => db.from('directory_people').update({ status: 'published' }).eq('id', p.id).eq('status', 'review'))
    }
    return
  }

  if (cmd === 'approve-edits' || cmd === 'reject-edits') {
    const p = await one(slugs[0] ?? '')
    const e = p.pending_edits as ProfileEdits | null
    if (!e) return console.log(`${p.slug}: no pending edits`)
    console.log(JSON.stringify(e, null, 2))
    if (cmd === 'reject-edits') return write(apply, `drop the pending edits of ${p.slug}`, () => db.from('directory_people').update({ pending_edits: null, pending_edits_at: null }).eq('id', p.id))
    return write(apply, `make the pending edits of ${p.slug} live`, () =>
      db
        .from('directory_people')
        .update({
          headline: e.headline,
          description: e.description,
          photo_url: e.photo_url,
          contact_url: e.contact_url,
          claimed_practice_areas: e.practice_areas?.length ? e.practice_areas : null,
          notable: e.notable ?? [],
          pending_edits: null,
          pending_edits_at: null,
        })
        .eq('id', p.id),
    )
  }

  if (cmd === 'hide' || cmd === 'unhide' || cmd === 'remove') {
    const p = await one(slugs[0] ?? '')
    const change = cmd === 'hide' ? { status: 'hidden', hidden_by: 'desk' } : cmd === 'unhide' ? { status: 'published', hidden_by: null } : { status: 'removed' }
    return write(apply, `${cmd} ${p.slug} (now ${p.status}${p.hidden_by ? `, hidden by ${p.hidden_by}` : ''})`, () => db.from('directory_people').update(change).eq('id', p.id))
  }

  if (cmd === 'resolve') {
    const [id, outcome] = slugs
    if (!id || !['done', 'rejected'].includes(outcome)) throw new Error('usage: resolve <request id> done|rejected [--notes "..."]')
    return write(apply, `mark request ${id} ${outcome}`, () =>
      db.from('directory_requests').update({ status: outcome, notes: opt('notes') ?? null, resolved_at: new Date().toISOString() }).eq('id', id),
    )
  }

  throw new Error('usage: review.ts queue | publish | approve-edits | reject-edits | hide | unhide | remove | resolve (see the header)')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
