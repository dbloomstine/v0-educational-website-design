#!/usr/bin/env npx tsx
/**
 * Load a sponsor-pitch list into outreach_v2_messages and render every email
 * for Danny to read. Sends nothing.
 *
 *   npx tsx --env-file=.env.local scripts/outreach-v2/load-sponsor-batch.ts \
 *     ~/fundopshq-workspace/docs/outreach/sponsor-batch-1.json \
 *     [--batch sponsor-batch-1] [--out ~/fundopshq-workspace/docs/outreach/sponsor-batch-1-preview.md]
 *
 * The file's shape is documented in lib/outreach-v2/sponsor-pitch.ts. Each
 * lead becomes a `preview` row (or `skipped`, with the reason: invalid, Lead
 * Desk, unsubscribed, bounced, emailed in the last 90 days...). Re-running
 * re-renders whatever is still in preview. To send, see release-batch.ts.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { envMode } from '../../lib/outreach-v2/config'
import { bodyOf, wordCount } from '../../lib/outreach-v2/compose'
import { parseBatchFile, prepareSponsorBatch } from '../../lib/outreach-v2/sponsor-pitch'
import { readHalt } from '../../lib/outreach-v2/store'

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] ?? null : null
}

async function main() {
  const file = process.argv[2]
  if (!file || file.startsWith('--')) throw new Error('usage: load-sponsor-batch.ts <file.json> [--batch name] [--out preview.md]')
  const parsed = parseBatchFile(JSON.parse(readFileSync(file, 'utf8')))
  const batch = arg('batch') ?? parsed.batch ?? basename(file).replace(/\.json$/, '')
  const out = arg('out') ?? file.replace(/\.json$/, '-preview.md')
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const prepared = await prepareSponsorBatch(db, batch, parsed.leads)
  const ready = prepared.filter((p) => p.row?.status === 'preview')
  const halt = await readHalt(db)

  const lines: string[] = [
    `# ${batch}: sponsor pitches, preview`,
    '',
    `Rendered ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET from \`${file}\`. **Nothing has been sent.**`,
    '',
    `- ${prepared.length} leads in the file; **${ready.length} ready** to send; ${prepared.length - ready.length} held back (reasons below).`,
    `- From: Danny Bloomstine <danny@fundopshq.com>. Replies go to danny@reply.fundopshq.com (stored, and a copy forwarded to Gmail).`,
    `- Plain text, no tracking. One-click unsubscribe header and a visible unsubscribe link; postal address in the footer.`,
    `- Sending, once released: one every five minutes, weekdays 9am to 6pm New York, at most 30 outreach emails a day. One follow-up five business days later unless they reply or opt out.`,
    `- Mode now: \`${envMode()}\` here (production is set in Vercel)${halt.halted ? `; HALTED: ${halt.halted_reason}` : ''}.`,
    '',
  ]
  const held = prepared.filter((p) => p.row?.status !== 'preview')
  if (held.length) {
    lines.push('## Held back', '')
    for (const p of held) lines.push(`- **${p.lead.company || '(no company)'}** <${p.lead.email || 'no email'}>: ${p.skipReason ?? p.row?.status ?? 'not stored'}`)
    lines.push('')
  }
  lines.push('## The emails', '')
  ready.forEach((p, i) => {
    const r = p.row!
    lines.push(
      `### ${i + 1}. ${r.company}: ${r.first_name} ${r.last_name ?? ''}, ${r.title ?? ''}`.trim(),
      '',
      `- To: ${r.email}`,
      `- Subject: **${r.subject}**`,
      `- Mock-up (the short link in the email opens this): ${r.mockup_url}`,
      `- Hook source: ${r.source_url || '(none)'}`,
      `- Words (above the footer): ${wordCount(bodyOf(r.body_text))}`,
      ...(p.warnings.length ? [`- Check: ${p.warnings.join('; ')}`] : []),
      '',
      '```text',
      r.body_text,
      '```',
      '',
    )
  })
  lines.push('## To send this batch', '', '```bash', `npx tsx --env-file=.env.local scripts/outreach-v2/release-batch.ts ${batch}`, '```', '', 'It queues the rows above; the dispatcher sends them only while OUTREACH_V2_MODE=live in Vercel Production.', '')
  writeFileSync(out, lines.join('\n'))
  console.log(`${ready.length} ready, ${held.length} held back. Preview written to ${out}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
