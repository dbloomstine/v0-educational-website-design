/**
 * Publish one reviewed "Send us your news" submission as a story (2026-10-22).
 *
 *   npx tsx --env-file=.env.local scripts/news/publish-submission.ts <submission id>
 *   npx tsx --env-file=.env.local scripts/news/publish-submission.ts <submission id> --apply --notes "checked with the firm's release of 21 Oct"
 *
 * Options, all optional:
 *   --title "..."     the desk's headline in place of the firm's
 *   --details "..."   the desk's text in place of the firm's details
 *   --date YYYY-MM-DD the date to publish under (also lets an old or future-dated item through)
 *
 * Only for a submission the desk has VERIFIED (the review-submissions skill,
 * "Third queue"). Without --apply it changes nothing: it prints the news_items
 * row it would insert, the warnings, and any row already in news_items that
 * looks like the same article. With --apply (and --notes, which is required)
 * it inserts the row as `pending` and stamps the submission `approved`, with
 * published_news_item_id and the notes. The hourly classifier (:30) then types
 * the row, writes its summary and puts it on the site and in the email like any
 * other story; nothing here sets a classification by hand. Why, and how the
 * link is chosen: lib/submit/publish-submission.ts.
 *
 * Never reads the people, the contact's details or the IP hash.
 */
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { titleSourceKey } from '@/lib/news/ingest-worker'
import {
  buildSubmissionRow,
  publishedNotes,
  SUBMISSION_PUBLISH_COLUMNS,
  type SubmissionForPublish,
} from '@/lib/submit/publish-submission'

async function main() {
  const args = process.argv.slice(2)
  const flag = (n: string) => args.includes(`--${n}`)
  const opt = (n: string): string | null => {
    const i = args.indexOf(`--${n}`)
    return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null
  }
  const submissionId = args[0]
  if (!submissionId || !/^[0-9a-f-]{36}$/i.test(submissionId)) {
    throw new Error('usage: publish-submission.ts <submission id> [--apply --notes "..."] [--title "..."] [--details "..."] [--date YYYY-MM-DD]')
  }
  const apply = flag('apply')
  const notes = opt('notes')
  if (apply && !notes?.trim()) throw new Error('--apply needs --notes "...": what was checked, and where')

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: sub, error } = await db.from('news_submissions').select(SUBMISSION_PUBLISH_COLUMNS).eq('id', submissionId).maybeSingle()
  if (error) throw new Error(`submission lookup failed: ${error.message}`)
  if (!sub) throw new Error(`no submission ${submissionId}`)

  const built = buildSubmissionRow(sub as SubmissionForPublish, {
    id: randomUUID(),
    title: opt('title'),
    details: opt('details'),
    publishedDate: opt('date'),
  })
  if (!built.ok) throw new Error(`not published: ${built.error}`)
  const { row, warnings } = built

  // The ingest worker's four dedup layers, asked of the database: the same link,
  // the same normalised link, the same text, or the same headline from the same source.
  const [byUrl, byUrlHash, byContent, byTitle] = await Promise.all([
    db.from('news_items').select('id, title, source_name, published_date').eq('source_url', row.source_url).limit(3),
    db.from('news_items').select('id, title, source_name, published_date').eq('url_hash', row.url_hash).limit(3),
    db.from('news_items').select('id, title, source_name, published_date').eq('content_hash', row.content_hash).limit(3),
    db.from('news_items').select('id, title, source_name, published_date').eq('title', row.title).limit(10),
  ])
  for (const r of [byUrl, byUrlHash, byContent, byTitle]) if (r.error) throw new Error(`dedup lookup failed: ${r.error.message}`)
  const sameTitle = (byTitle.data ?? []).filter((r) => titleSourceKey(r.title, r.source_name) === built.titleKey)
  const clashes = [...(byUrl.data ?? []), ...(byUrlHash.data ?? []), ...(byContent.data ?? []), ...sameTitle]
  const otherOutlets = (byTitle.data ?? []).filter((r) => !sameTitle.includes(r))

  console.log(`submission ${sub.id} (${sub.kind}, ${sub.firm}), status ${sub.status}`)
  console.log('news_items row:')
  console.log(JSON.stringify(row, null, 2))
  for (const w of warnings) console.log(`warning: ${w}`)
  for (const r of otherOutlets) console.log(`note: the same headline from ${r.source_name} is news_items ${r.id} (${r.published_date}); the stories will cluster`)

  if (clashes.length > 0) {
    for (const r of clashes) console.log(`already in news_items: ${r.id} "${r.title}" (${r.source_name}, ${r.published_date})`)
    throw new Error('not published: news_items already holds this article. Approve the submission by hand if the story is already on the site.')
  }

  if (!apply) {
    console.log('\ndry run: nothing written. Add --apply --notes "..." to publish.')
    return
  }

  const { error: insertError } = await db.from('news_items').insert(row)
  if (insertError) throw new Error(`insert failed, nothing written: ${insertError.message}`)

  const { data: stamped, error: stampError } = await db
    .from('news_submissions')
    .update({ status: 'approved', published_news_item_id: row.id, review_notes: publishedNotes(sub.review_notes, notes!, row.id) })
    .eq('id', sub.id)
    .eq('status', 'pending')
    .select('id')
  if (stampError || !stamped?.length) {
    throw new Error(
      `news_items ${row.id} was inserted, but the submission was not stamped (${stampError?.message ?? 'its status changed meanwhile'}). ` +
        `Set status = 'approved', published_news_item_id = '${row.id}' on news_submissions ${sub.id} by hand.`,
    )
  }
  console.log(`\npublished: news_items ${row.id} (pending). The :30 classify run types it, and the site shows it within ten minutes after that, if the classifier scores it a story (relevance 0.3 or more, or high signal).`)
  console.log(`its page, once classified: https://fundopshq.com/story/${row.id}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
