/**
 * The monthly "your profile was viewed N times" email to directory claimers
 * (2026-10-24, plan B7). OFF unless DIRECTORY_STATS_EMAIL=on, and a dry run
 * unless --apply as well: without both it prints who would get what.
 *
 *   npx tsx --env-file=.env.local scripts/directory/stats-email.ts [--apply] [--min 1]
 *
 * For each claimed, published profile: the views in the calendar month just
 * ended (New York), to the newest confirmed claim's address. Profiles under
 * --min views (default 1) get nothing. Each send is written to
 * directory_desk_log ("stats-email", the month), and a profile already logged
 * for that month is skipped, so running it twice sends once.
 *
 * Counts only, never a comparison with anyone else. Each email says how to
 * stop them (a reply); a reply of "stop" is honoured by hand: add the address
 * to DIRECTORY_STATS_EMAIL_SKIP (comma-separated).
 */
import { createClient } from '@supabase/supabase-js'
import { profilePath } from '@/lib/directory/people'
import type { CategoryId } from '@/lib/directory/taxonomy'
import { previousMonth } from '@/lib/directory/views'
import { sendDirectoryMail, statsEmail, statsEmailEnabled } from '@/lib/directory/owner-mail'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const args = process.argv.slice(2)
  const enabled = statsEmailEnabled()
  const apply = args.includes('--apply') && enabled
  const i = args.indexOf('--min')
  const min = i >= 0 ? Math.max(1, Number(args[i + 1]) || 1) : 1
  const skip = new Set((process.env.DIRECTORY_STATS_EMAIL_SKIP ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))
  const month = previousMonth()
  if (!enabled) console.log('DIRECTORY_STATS_EMAIL is off: a dry run, nothing is sent.')
  else if (!apply) console.log('Dry run: add --apply to send.')
  console.log(`Month: ${month.name} (${month.from} to ${month.to})`)

  const { data: people, error } = await db
    .from('directory_people')
    .select('id, category, slug, full_name, firm_name')
    .eq('status', 'published')
    .not('claimed_at', 'is', null)
  if (error) throw new Error(error.message)
  if (!people?.length) return console.log('No claimed profiles.')

  const ids = people.map((p) => p.id as string)
  const { data: views, error: vErr } = await db.from('directory_profile_views').select('person_id, views').in('person_id', ids).gte('day', month.from).lte('day', month.to)
  if (vErr) throw new Error(vErr.message)
  const total = new Map<string, number>()
  for (const v of views ?? []) total.set(v.person_id, (total.get(v.person_id) ?? 0) + (Number(v.views) || 0))

  const { data: logged } = await db.from('directory_desk_log').select('person_id, detail').eq('action', 'stats-email')
  const already = new Set((logged ?? []).filter((l) => (l.detail as { month?: string })?.month === month.from.slice(0, 7)).map((l) => l.person_id))

  let sent = 0
  for (const p of people) {
    const n = total.get(p.id) ?? 0
    if (n < min) continue
    if (already.has(p.id)) {
      console.log(`  skip ${p.slug}: already sent for ${month.name}`)
      continue
    }
    const { data: claim } = await db
      .from('directory_claims')
      .select('email')
      .eq('person_id', p.id)
      .not('confirmed_at', 'is', null)
      .order('confirmed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const to = claim?.email as string | undefined
    if (!to || skip.has(to.toLowerCase())) {
      console.log(`  skip ${p.slug}: ${to ? 'asked to stop' : 'no confirmed address'}`)
      continue
    }
    const m = statsEmail(p, month.name, n, profilePath({ slug: p.slug, category: p.category as CategoryId }))
    if (!apply) {
      console.log(`  would email ${to}: ${m.subject}`)
      continue
    }
    if (await sendDirectoryMail(to, m)) {
      sent++
      await db.from('directory_desk_log').insert({ action: 'stats-email', person_id: p.id, detail: { month: month.from.slice(0, 7), views: n, to } })
      console.log(`  emailed ${to}: ${m.subject}`)
    } else console.log(`  NOT SENT to ${to}`)
  }
  console.log(apply ? `Sent ${sent}.` : 'Nothing sent.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
