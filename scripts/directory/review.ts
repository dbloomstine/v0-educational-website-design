/**
 * The desk's tool for the directory (2026-10-24; owners, requests, suggestions
 * and moves added the same day, workstream B). Dry run unless --apply: a dry
 * run prints what it would write and the email it would send.
 *
 *   npx tsx --env-file=.env.local scripts/directory/review.ts queue
 *       counts by status, profiles in review, pending edits, open requests,
 *       open suggestions, moves awaiting, claims this week, searches that found nobody
 *   ... review.ts publish <slug> [<slug>...] [--apply]
 *   ... review.ts publish --all-review [--firm kirkland.com] [--apply]
 *   ... review.ts approve-edits <slug> [--apply] [--no-email]             live, the claimer emailed
 *   ... review.ts reject-edits <slug> --reason "..." [--apply] [--no-email] dropped, the claimer told why
 *   ... review.ts hide <slug> | unhide <slug> | remove <slug> [--apply]
 *   ... review.ts resolve <request id> done|rejected [--notes "internal"] [--reply "to them"] [--apply] [--no-email]
 *   ... review.ts claims [--days 30]                       who claimed what, and from which address
 *   ... review.ts suggestions                              open suggestions in full
 *   ... review.ts suggestion <id> added|rejected|done [--profile <slug>] [--notes ".."] [--reply ".."] [--apply] [--no-email]
 *   ... review.ts misses [--days 30]                       searches that found nobody, most asked first
 *   ... review.ts moves                                    claimed people who look as if they changed firm
 *   ... review.ts link-move <old slug> <new slug> [--publish] [--apply] [--no-email]
 *       the claimer is asked to confirm from the new firm's domain; their
 *       additions follow as pending edits; the old profile is hidden, not deleted
 *   ... review.ts views <slug>                             the profile's view counts
 *
 * Emails go only with --apply, and only to the claimer's confirmed address (or,
 * for a request or a suggestion, the address the sender gave). Every --apply is
 * written to directory_desk_log.
 *
 * Pages read a cache that refreshes within the hour (lib/directory/data.ts),
 * so a change made here shows by then. A hide or a removal request made on
 * the site itself clears the cache at once.
 */
import { createClient } from '@supabase/supabase-js'
import type { ProfileEdits } from '@/lib/directory/claim'
import { profilePath } from '@/lib/directory/people'
import { CATEGORIES, type CategoryId } from '@/lib/directory/taxonomy'
import { moveCandidates, type MoveSide } from '@/lib/directory/moves'
import { viewSummary } from '@/lib/directory/views'
import {
  SITE,
  editsLiveEmail,
  editsNotAcceptedEmail,
  moveEmail,
  requestResolvedEmail,
  sendDirectoryMail,
  suggestionResolvedEmail,
  type Mail,
} from '@/lib/directory/owner-mail'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const PERSON = 'id, category, slug, full_name, firm_name, firm_domain, status, hidden_by, pending_edits, claimed_at, headline, description, photo_url, contact_url, claimed_practice_areas, notable'

type Row = {
  id: string
  category: CategoryId
  slug: string
  full_name: string
  firm_name: string
  firm_domain: string
  status: string
  hidden_by: string | null
  pending_edits: (ProfileEdits & { submitted_by_claim?: string | null; carried_from?: string }) | null
  claimed_at: string | null
  headline: string | null
  description: string | null
  photo_url: string | null
  contact_url: string | null
  claimed_practice_areas: string[] | null
  notable: { text: string; year?: number | null }[] | null
}

async function one(slug: string): Promise<Row> {
  const { data, error } = await db.from('directory_people').select(PERSON).eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error(`no profile ${slug}`)
  return data as unknown as Row
}

async function write(apply: boolean, what: string, run: () => PromiseLike<{ error: { message: string } | null }>) {
  if (!apply) return console.log(`[dry run] would ${what}`)
  const { error } = await run()
  if (error) throw new Error(`${what}: ${error.message}`)
  console.log(`done: ${what}`)
}

/** The desk log, after an --apply. A missing table (migration not applied) is a warning, never a failure. */
async function log(apply: boolean, action: string, personId: string | null, refId: string | null, detail: Record<string, unknown> = {}) {
  if (!apply) return
  const { error } = await db.from('directory_desk_log').insert({ action, person_id: personId, ref_id: refId, detail })
  if (error) console.warn(`(desk log not written: ${error.message})`)
}

/** The claimer's address: the claim that sent the edits if known, else the newest confirmed claim. */
async function claimerEmail(personId: string, claimId?: string | null): Promise<string | null> {
  const { data } = await db.from('directory_claims').select('id, email, confirmed_at').eq('person_id', personId).not('confirmed_at', 'is', null).order('confirmed_at', { ascending: false })
  const rows = (data ?? []) as { id: string; email: string }[]
  return (claimId ? rows.find((r) => r.id === claimId) : undefined)?.email ?? rows[0]?.email ?? null
}

async function mail(apply: boolean, noEmail: boolean, to: string | null, m: Mail, what: string): Promise<boolean> {
  if (noEmail) {
    console.log(`(no email: --no-email) ${what}`)
    return false
  }
  if (!to) {
    console.log(`(no email: nobody to send it to) ${what}`)
    return false
  }
  if (!apply) {
    console.log(`[dry run] would email ${to}: ${m.subject}\n${m.text.split('\n').map((l) => `    ${l}`).join('\n')}`)
    return false
  }
  const ok = await sendDirectoryMail(to, m)
  console.log(ok ? `emailed ${to}: ${m.subject}` : `EMAIL NOT SENT to ${to} (${what}); check RESEND_API_KEY`)
  return ok
}

const show = (v: unknown) => (v === null || v === undefined || (Array.isArray(v) && !v.length) ? '(none)' : typeof v === 'string' ? v : JSON.stringify(v))

/** What changes if the pending edits go live: one entry per field that differs. */
function diff(p: Row, e: ProfileEdits): string[] {
  const live: Record<string, unknown> = {
    headline: p.headline,
    description: p.description,
    photo_url: p.photo_url,
    contact_url: p.contact_url,
    practice_areas: p.claimed_practice_areas ?? [],
    notable: p.notable ?? [],
  }
  const next: Record<string, unknown> = {
    headline: e.headline,
    description: e.description,
    photo_url: e.photo_url,
    contact_url: e.contact_url,
    practice_areas: e.practice_areas ?? [],
    notable: e.notable ?? [],
  }
  return Object.keys(live)
    .filter((k) => JSON.stringify(live[k] ?? null) !== JSON.stringify(next[k] ?? null))
    .map((k) => `  ${k}:\n    live: ${show(live[k])}\n    new:  ${show(next[k])}`)
}

async function allRows(columns: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('directory_people').select(columns).order('id').range(from, from + 999)
    if (error) throw new Error(error.message)
    out.push(...((data ?? []) as unknown as Record<string, unknown>[]))
    if (!data || data.length < 1000) return out
  }
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
const tradeName = (c: string) => CATEGORIES[c as CategoryId]?.plural ?? c

function tally(rows: { query: string; category: string; misses: number }[]) {
  const top = new Map<string, number>()
  for (const m of rows) {
    const k = `${tradeName(m.category)}  ${m.query}`
    top.set(k, (top.get(k) ?? 0) + m.misses)
  }
  return [...top].sort((a, b) => b[1] - a[1])
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2)
  const apply = rest.includes('--apply')
  const noEmail = rest.includes('--no-email')
  const VALUED = ['--firm', '--notes', '--reason', '--reply', '--days', '--profile']
  const opt = (n: string) => {
    const i = rest.indexOf(`--${n}`)
    return i >= 0 ? rest[i + 1] : undefined
  }
  const args = rest.filter((a, i) => !a.startsWith('--') && !VALUED.includes(rest[i - 1]))

  if (cmd === 'queue') {
    for (const s of ['review', 'published', 'hidden', 'removed']) {
      const { count } = await db.from('directory_people').select('id', { count: 'exact', head: true }).eq('status', s)
      console.log(`${s}: ${count ?? 0}`)
    }
    const { count: claimed } = await db.from('directory_people').select('id', { count: 'exact', head: true }).not('claimed_at', 'is', null)
    console.log(`claimed: ${claimed ?? 0}`)
    const { data: edits } = await db.from('directory_people').select('slug, full_name, firm_name, pending_edits_at').not('pending_edits', 'is', null).order('pending_edits_at')
    console.log(`\npending edits: ${edits?.length ?? 0}   (approve-edits <slug> | reject-edits <slug> --reason "...")`)
    for (const e of edits ?? []) console.log(`  ${e.slug}  ${e.full_name} (${e.firm_name})  ${e.pending_edits_at}`)
    const { data: reqs } = await db.from('directory_requests').select('id, person_slug, kind, contact_email, message, created_at').eq('status', 'open').order('created_at')
    console.log(`\nopen requests: ${reqs?.length ?? 0}   (resolve <id> done|rejected --reply "...")`)
    for (const r of reqs ?? []) console.log(`  ${r.id}  ${r.kind}  ${r.person_slug}  <${r.contact_email}>  ${(r.message ?? '').slice(0, 120)}`)
    const sug = await db.from('directory_suggestions').select('id, kind, full_name, firm_name, contact_email, domain_match').eq('status', 'open').order('created_at')
    if (sug.error) console.log(`\nsuggestions: (not readable: ${sug.error.message})`)
    else {
      console.log(`\nopen suggestions: ${sug.data.length}   (suggestions | suggestion <id> added|rejected|done)`)
      for (const s of sug.data) console.log(`  ${s.id}  ${s.kind}  ${s.full_name ?? '-'} (${s.firm_name})  <${s.contact_email}>${s.domain_match ? '' : '  [not at the firm domain]'}`)
    }
    const mv = await db.from('directory_moves').select('id', { count: 'exact', head: true }).eq('status', 'awaiting')
    if (!mv.error) console.log(`\nmoves awaiting the person: ${mv.count ?? 0}   (moves | link-move)`)
    const { count: weekClaims } = await db.from('directory_claims').select('id', { count: 'exact', head: true }).not('confirmed_at', 'is', null).gte('confirmed_at', daysAgo(7))
    console.log(`claims and sign-ins confirmed in the last 7 days: ${weekClaims ?? 0}   (claims)`)
    const miss = await db.from('directory_search_misses').select('query, category, misses').gte('day', daysAgo(30).slice(0, 10))
    if (!miss.error) {
      const list = tally(miss.data).slice(0, 10)
      console.log(`\nsearches that found nobody, last 30 days, top ${list.length}   (misses)`)
      for (const [k, v] of list) console.log(`  ${String(v).padStart(4)}  ${k}`)
    }
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
      await write(apply, `publish ${count ?? 0} profiles in review${firm ? ` at ${firm}` : ''}`, () => u)
      return log(apply, 'publish', null, null, { all_review: true, firm: firm ?? null, count })
    }
    for (const slug of args) {
      const p = await one(slug)
      if (p.status !== 'review') {
        console.log(`${slug}: is ${p.status}, not in review; left alone`)
        continue
      }
      await write(apply, `publish ${slug} (${p.full_name}, ${p.firm_name})`, () => db.from('directory_people').update({ status: 'published' }).eq('id', p.id).eq('status', 'review'))
      await log(apply, 'publish', p.id, null)
    }
    return
  }

  if (cmd === 'approve-edits' || cmd === 'reject-edits') {
    const p = await one(args[0] ?? '')
    const e = p.pending_edits
    if (!e) return console.log(`${p.slug}: no pending edits`)
    const changes = diff(p, e)
    console.log(`${p.full_name} (${p.firm_name})${e.carried_from ? `, carried from ${e.carried_from} after a move` : ''}\nwhat changes:\n${changes.join('\n') || '  (nothing differs from what is live)'}`)
    const to = await claimerEmail(p.id, e.submitted_by_claim)
    if (cmd === 'reject-edits') {
      const reason = opt('reason') ?? null
      if (!reason && !noEmail) throw new Error('reject-edits needs --reason "..." (it goes in the email to them), or --no-email')
      await write(apply, `drop the pending edits of ${p.slug}`, () => db.from('directory_people').update({ pending_edits: null, pending_edits_at: null }).eq('id', p.id))
      const sent = await mail(apply, noEmail, to, editsNotAcceptedEmail(p, reason), 'edits not accepted')
      return log(apply, 'reject-edits', p.id, null, { reason, emailed: sent ? to : null, edits: e })
    }
    await write(apply, `make the pending edits of ${p.slug} live`, () =>
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
    const sent = await mail(apply, noEmail, to, editsLiveEmail(p, profilePath(p)), 'edits live')
    return log(apply, 'approve-edits', p.id, null, {
      emailed: sent ? to : null,
      before: { headline: p.headline, description: p.description, photo_url: p.photo_url, contact_url: p.contact_url, practice_areas: p.claimed_practice_areas, notable: p.notable },
      edits: e,
    })
  }

  if (cmd === 'hide' || cmd === 'unhide' || cmd === 'remove') {
    const p = await one(args[0] ?? '')
    const change = cmd === 'hide' ? { status: 'hidden', hidden_by: 'desk' } : cmd === 'unhide' ? { status: 'published', hidden_by: null } : { status: 'removed' }
    await write(apply, `${cmd} ${p.slug} (now ${p.status}${p.hidden_by ? `, hidden by ${p.hidden_by}` : ''})`, () => db.from('directory_people').update(change).eq('id', p.id))
    return log(apply, cmd, p.id, null, { was: p.status, hidden_by: p.hidden_by })
  }

  if (cmd === 'resolve') {
    const [id, outcome] = args
    if (!id || !['done', 'rejected'].includes(outcome)) throw new Error('usage: resolve <request id> done|rejected [--notes "internal"] [--reply "to them"]')
    const { data: r, error } = await db.from('directory_requests').select('id, person_id, person_slug, kind, contact_email, status').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    if (!r) throw new Error(`no request ${id}`)
    if (r.status !== 'open') console.log(`(request ${id} is already ${r.status})`)
    const { data: person } = r.person_id ? await db.from('directory_people').select('full_name').eq('id', r.person_id).maybeSingle() : { data: null }
    await write(apply, `mark request ${id} ${outcome}`, () =>
      db.from('directory_requests').update({ status: outcome, notes: opt('notes') ?? null, resolved_at: new Date().toISOString() }).eq('id', id),
    )
    const m = requestResolvedEmail({ kind: r.kind, person_name: person?.full_name ?? null, done: outcome === 'done' }, opt('reply') ?? null)
    const sent = await mail(apply, noEmail, r.contact_email, m, 'request resolved')
    return log(apply, 'resolve', r.person_id, r.id, { outcome, notes: opt('notes') ?? null, reply: opt('reply') ?? null, emailed: sent ? r.contact_email : null })
  }

  if (cmd === 'claims') {
    const days = Number(opt('days') ?? 30)
    const { data, error } = await db
      .from('directory_claims')
      .select('person_id, email, confirmed_at, created_at')
      .gte('created_at', daysAgo(days))
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw new Error(error.message)
    const ids = [...new Set((data ?? []).map((c) => c.person_id as string))]
    const { data: people } = ids.length ? await db.from('directory_people').select('id, slug, full_name, firm_name').in('id', ids) : { data: [] }
    const by = new Map((people ?? []).map((p) => [p.id as string, p]))
    console.log(`claim and sign-in links, last ${days} days: ${data?.length ?? 0}`)
    for (const c of data ?? []) {
      const p = by.get(c.person_id)
      const when = c.confirmed_at ? `confirmed ${String(c.confirmed_at).slice(0, 16)}` : `unconfirmed (sent ${String(c.created_at).slice(0, 16)})`
      console.log(`  ${when}  ${p?.slug ?? c.person_id}  ${p ? `${p.full_name} (${p.firm_name})` : ''}  <${c.email}>`)
    }
    return
  }

  if (cmd === 'suggestions') {
    const { data, error } = await db.from('directory_suggestions').select('*').eq('status', 'open').order('created_at')
    if (error) throw new Error(error.message)
    console.log(`open suggestions: ${data.length}  (UNVERIFIED: typed by the sender)`)
    for (const s of data) {
      console.log(
        [
          `\n${s.id}  ${s.kind}  ${tradeName(s.category)}  ${String(s.created_at).slice(0, 10)}`,
          `  name: ${s.full_name ?? '-'}   firm: ${s.firm_name}   site: ${s.firm_website ?? '-'}`,
          `  bio: ${s.bio_url ?? '-'}`,
          `  from: ${s.contact_email}${s.domain_match ? ' (at the firm domain)' : ' (NOT at the firm domain)'}${s.from_query ? `   searched: ${s.from_query}` : ''}`,
          s.message ? `  message: ${String(s.message).replace(/\s+/g, ' ').slice(0, 400)}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      )
    }
    return
  }

  if (cmd === 'suggestion') {
    const [id, outcome] = args
    if (!id || !['added', 'rejected', 'done'].includes(outcome)) throw new Error('usage: suggestion <id> added|rejected|done [--profile <slug>] [--notes ".."] [--reply ".."]')
    const { data: s, error } = await db.from('directory_suggestions').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    if (!s) throw new Error(`no suggestion ${id}`)
    const profileSlug = opt('profile')
    const profile = profileSlug ? await one(profileSlug) : null
    await write(apply, `mark suggestion ${id} ${outcome}`, () =>
      db.from('directory_suggestions').update({ status: outcome, notes: opt('notes') ?? null, resolved_at: new Date().toISOString() }).eq('id', id),
    )
    const url = profile && profile.status === 'published' ? `${SITE}${profilePath(profile)}` : null
    const m = suggestionResolvedEmail({ full_name: s.full_name, firm_name: s.firm_name, outcome: outcome as 'added' | 'rejected' | 'done' }, url, opt('reply') ?? null)
    const sent = await mail(apply, noEmail, s.contact_email, m, 'suggestion resolved')
    return log(apply, 'suggestion', profile?.id ?? null, s.id, { outcome, notes: opt('notes') ?? null, emailed: sent ? s.contact_email : null })
  }

  if (cmd === 'misses') {
    const days = Number(opt('days') ?? 30)
    const { data, error } = await db.from('directory_search_misses').select('query, category, misses').gte('day', daysAgo(days).slice(0, 10))
    if (error) throw new Error(error.message)
    const list = tally(data)
    console.log(`searches that found nobody, last ${days} days: ${list.length} distinct`)
    for (const [k, v] of list.slice(0, 100)) console.log(`  ${String(v).padStart(4)}  ${k}`)
    return
  }

  if (cmd === 'moves') {
    const rows = (await allRows('id, slug, full_name, firm_name, firm_domain, status, bar_admissions, education, practice_areas, claimed_at, missing_since')) as unknown as MoveSide[]
    const found = moveCandidates(rows)
    console.log(`possible moves of claimed people: ${found.length}   (link-move <old slug> <new slug>)`)
    for (const c of found.slice(0, 50)) {
      const gone = c.from.missing_since ? `, gone since ${c.from.missing_since}` : ''
      console.log(`  ${c.from.slug} (${c.from.firm_domain}${gone})  ->  ${c.to.slug} (${c.to.firm_domain}, ${c.to.status})  shared: ${c.evidence.join(', ')}`)
    }
    return
  }

  if (cmd === 'link-move') {
    const [fromSlug, toSlug] = args
    if (!fromSlug || !toSlug) throw new Error('usage: link-move <old slug> <new slug> [--publish]')
    const from = await one(fromSlug)
    const to = await one(toSlug)
    if (from.id === to.id) throw new Error('the same profile twice')
    if (!from.claimed_at) console.log(`(note: ${from.slug} was never claimed: nothing to carry, and nobody to email)`)
    if (to.status !== 'published') {
      if (!rest.includes('--publish')) throw new Error(`${to.slug} is ${to.status}: it must be published to be claimed. Add --publish to publish it as part of the move.`)
      if (to.status !== 'review') throw new Error(`${to.slug} is ${to.status}; only a profile in review is published by --publish`)
      await write(apply, `publish ${to.slug}`, () => db.from('directory_people').update({ status: 'published' }).eq('id', to.id).eq('status', 'review'))
    }
    await write(apply, `link the move ${from.slug} (${from.firm_domain}) -> ${to.slug} (${to.firm_domain})`, () =>
      db.from('directory_moves').insert({ from_person_id: from.id, to_person_id: to.id, from_domain: from.firm_domain, to_domain: to.firm_domain }),
    )
    const sent = from.claimed_at ? await mail(apply, noEmail, await claimerEmail(from.id), moveEmail(from, to), 'move') : false
    console.log('When they confirm a claim on the new profile from the new domain, their additions arrive there as pending edits and the old profile is hidden.')
    return log(apply, 'link-move', to.id, from.id, { from: from.slug, to: to.slug, emailed: sent })
  }

  if (cmd === 'views') {
    const p = await one(args[0] ?? '')
    const { data, error } = await db.from('directory_profile_views').select('day, views').eq('person_id', p.id)
    if (error) throw new Error(error.message)
    const v = viewSummary(data ?? [])
    console.log(`${p.full_name} (${p.firm_name}): last 7 days ${v.last7}, last 30 days ${v.last30}, this month ${v.thisMonth}, last month ${v.lastMonth}, all ${v.total} since ${v.since ?? '-'}`)
    return
  }

  throw new Error('usage: review.ts queue | publish | approve-edits | reject-edits | hide | unhide | remove | resolve | claims | suggestions | suggestion | misses | moves | link-move | views (see the header)')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
