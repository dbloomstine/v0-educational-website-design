/**
 * Dry run of the long story summaries. Reads no database and writes none.
 *
 *   npx tsx scripts/story-summary-dryrun.ts                 # plan only: which 12 stories, no model calls
 *   npx tsx scripts/story-summary-dryrun.ts --run           # call the model for the non-thin ones
 *   npx tsx scripts/story-summary-dryrun.ts --run --only 2,3,7 --out rerun.md   # just these picks of the plan (1-based)
 *   npx tsx scripts/story-summary-dryrun.ts --replay                # no model call: judge the saved answers again, with the checks as they are now
 *   npx tsx scripts/story-summary-dryrun.ts --run --pool pool.json --text rows-with-text.json --out dryrun.md
 *
 * The rows come from a saved pool (the shape `scripts/roundup-audit.ts --save-pool`
 * writes: news_items rows as the site reads them), clustered by the site's own
 * code (buildStories). The site's columns do not include a row's description or
 * stored text, so those come from `--text`: a JSON array of
 * { i: <first 8 characters of the row id>, d, title, src, desc, ft }, the shape
 * of the 2026-10-08 trial's q4-rows.json. A story with no row in that file has
 * only its headlines, which is thin by definition; the report says so, and the
 * picks prefer stories whose text is on file.
 *
 * Picks 12 stories first seen on 2026-10-07 and 08: four with many outlets, four
 * ordinary, four thin. Where the text on file does not cover enough of those
 * days it fills from earlier days and says so.
 *
 * Every model answer is saved raw (`--answers`, default dryrun-answers.json beside the report), so a
 * change to the checks can be tried on the answers already paid for with --replay.
 *
 * ANTHROPIC_API_KEY is read from .env.local into this process only; it is never
 * printed. Hard cap: 20 model calls in total across runs, counted in a file.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { buildStories, type Story } from '../lib/news/stories'
import { ALL_NEWSLETTER_TYPES } from '../lib/newsletter/query-articles'
import { buildWriterInput, callWriter, judgeAnswer, redoNote, prepareRows, realTextLength, THIN_CHARS, wordCount, SUMMARY_MODEL, type ModelCall, type PreparedRow, type SourceRow, type WriteOutcome } from '../lib/news/story-summary'

const CALL_CAP = 20
/** The most rewrite calls --redo makes, across runs. */
const REDO_CAP = 6
const DAYS = ['2026-10-07', '2026-10-08']

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : undefined
}
const has = (name: string) => process.argv.includes(name)

const poolPath = flag('--pool') ?? '/private/tmp/nl-subject-data/pool.json'
const textPath = flag('--text') ?? '/private/tmp/trial-summary-work/q4-rows.json'
const outPath = flag('--out') ?? '/private/tmp/build-summaries-work/dryrun.md'
const answersPath = flag('--answers') ?? '/private/tmp/build-summaries-work/dryrun-answers.json'
const counterPath = '/private/tmp/build-summaries-work/api-calls.txt'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

function loadKey(): string | null {
  if (!existsSync('.env.local')) return null
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^ANTHROPIC_API_KEY\s*=\s*"?([^"\n]+)"?\s*$/)
    if (m) return m[1].trim()
  }
  return null
}

function callsUsed(): number {
  return existsSync(counterPath) ? Number(readFileSync(counterPath, 'utf8')) || 0 : 0
}

interface Pick { story: Story; kind: 'many' | 'ordinary' | 'thin'; prepared: PreparedRow[]; realChars: number; textOnFile: boolean; inWindow: boolean }

async function main() {
  const pool: Row[] = JSON.parse(readFileSync(poolPath, 'utf8'))
  const withText: Row[] = existsSync(textPath) ? JSON.parse(readFileSync(textPath, 'utf8')) : []
  const textById = new Map<string, Row>(withText.map((r) => [r.i, r]))
  const byId = new Map<string, Row>(pool.map((r) => [r.id, r]))

  // What the site loads: classified, not a duplicate, high-signal or relevant, a newsletter type.
  const shown = pool.filter((r) => r.classification_status === 'complete' && !r.is_duplicate && (r.is_high_signal || r.relevance_score >= 0.3) && ALL_NEWSLETTER_TYPES.includes(r.article_type))
  const stories = buildStories(shown).filter((s) => !s.roundup)

  const rowsOf = (s: Story): { rows: SourceRow[]; onFile: boolean } => {
    let onFile = false
    const rows = s.memberIds.map((id) => {
      const r = byId.get(id)
      const t = textById.get(id.slice(0, 8))
      if (t) onFile = true
      return { id, title: t?.title ?? r?.title ?? '', description: t?.desc ?? null, full_text: t?.ft && t.ft !== 'None' ? t.ft : null, source_name: t?.src ?? r?.source_name ?? null, published_date: r?.published_date ?? null }
    })
    return { rows, onFile }
  }

  const all: Pick[] = stories.map((story) => {
    const { rows, onFile } = rowsOf(story)
    const prepared = prepareRows(rows)
    const realChars = realTextLength(prepared)
    const outlets = new Set(prepared.map((p) => p.outlet)).size
    return {
      story, prepared, realChars, textOnFile: onFile,
      kind: realChars < THIN_CHARS ? 'thin' : outlets >= 4 ? 'many' : 'ordinary',
      inWindow: DAYS.includes(story.firstSeen.slice(0, 10)),
    }
  })

  const chosen: Pick[] = []
  const take = (kind: Pick['kind'], n: number, order: (a: Pick, b: Pick) => number) => {
    const pickable = all.filter((p) => p.kind === kind && !chosen.includes(p)).sort(order)
    chosen.push(...pickable.slice(0, n))
  }
  // In the window first; for thin ones, stories whose text is on file (measured thin) before stories we simply have no text for.
  const richer = (a: Pick, b: Pick) => Number(b.inWindow) - Number(a.inWindow) || Number(b.textOnFile) - Number(a.textOnFile) || b.realChars - a.realChars
  take('many', 4, (a, b) => Number(b.inWindow && b.textOnFile) - Number(a.inWindow && a.textOnFile) || richer(a, b) || b.story.coverage.length - a.story.coverage.length)
  take('ordinary', 4, richer)
  take('thin', 4, (a, b) => Number(b.textOnFile) - Number(a.textOnFile) || Number(b.inWindow) - Number(a.inWindow) || a.story.id.localeCompare(b.story.id))

  console.log(`pool ${pool.length} rows, ${shown.length} shown, ${stories.length} stories; text on file for ${withText.length} rows`)
  for (const p of chosen) {
    console.log(`${p.kind.padEnd(8)} ${p.story.firstSeen.slice(0, 10)} outlets=${p.story.coverage.length + 1} real=${p.realChars} onFile=${p.textOnFile} ${p.story.headline.slice(0, 70)}`)
  }
  const replay = has('--replay')
  if (!has('--run') && !replay && !has('--redo')) return console.log('\nPlan only. Add --run to call the model, or --replay to judge the saved answers again.')

  // Raw answers by the first 8 characters of the story's id.
  const saved: Record<string, ModelCall> = existsSync(answersPath) ? JSON.parse(readFileSync(answersPath, 'utf8')) : {}
  const judge = (pick: Pick, raw: ModelCall): WriteOutcome => ({ ...judgeAnswer(raw, buildWriterInput(pick.prepared)), usage: raw.usage, model: raw.model })

  const key = replay ? null : loadKey()
  if (!replay && !key) throw new Error('ANTHROPIC_API_KEY not found in .env.local')
  mkdirSync(dirname(counterPath), { recursive: true })

  const only = flag('--only')?.split(',').map(Number)
  const results: { pick: Pick; outcome: WriteOutcome | null; error?: string }[] = []
  for (const pick of chosen.filter((_, n) => !only || only.includes(n + 1))) {
    const id = pick.story.id.slice(0, 8)
    if (pick.kind === 'thin') { results.push({ pick, outcome: { status: 'thin' } }); continue }
    if (replay) {
      results.push(saved[id] ? { pick, outcome: judge(pick, saved[`${id}-redo`] ?? saved[id]) } : { pick, outcome: null, error: 'no saved answer' })
      continue
    }
    // --redo: the rewrite the job asks for when a saved answer fails a check (at most REDO_CAP calls).
    if (has('--redo')) {
      const first = saved[id] ? judge(pick, saved[id]) : null
      if (!saved[id] || !first || first.status !== 'rejected' || first.failures.length === 0 || saved[`${id}-redo`] || Object.keys(saved).filter((k) => k.endsWith('-redo')).length >= REDO_CAP) {
        results.push(saved[id] ? { pick, outcome: judge(pick, saved[`${id}-redo`] ?? saved[id]) } : { pick, outcome: null, error: 'no saved answer' })
        continue
      }
      try {
        const raw = await callWriter(buildWriterInput(pick.prepared).user, key as string, fetch, { answer: saved[id].text, note: redoNote(first.failures) })
        saved[`${id}-redo`] = raw
        writeFileSync(answersPath, JSON.stringify(saved, null, 1))
        results.push({ pick, outcome: judge(pick, raw) })
      } catch (err) {
        results.push({ pick, outcome: null, error: err instanceof Error ? err.message : String(err) })
      }
      console.log(`  ${id} redo: ${results[results.length - 1].outcome?.status ?? 'error'}`)
      continue
    }
    if (callsUsed() >= CALL_CAP) { results.push({ pick, outcome: null, error: `call cap ${CALL_CAP} reached` }); continue }
    writeFileSync(counterPath, String(callsUsed() + 1))
    try {
      const raw = await callWriter(buildWriterInput(pick.prepared).user, key as string)
      saved[id] = raw
      writeFileSync(answersPath, JSON.stringify(saved, null, 1))
      results.push({ pick, outcome: judge(pick, raw) })
    } catch (err) {
      results.push({ pick, outcome: null, error: err instanceof Error ? err.message : String(err) })
    }
    console.log(`  ${id} ${results[results.length - 1].outcome?.status ?? 'error'}`)
  }

  writeFileSync(outPath, report(results, replay))
  console.log(`\nWrote ${outPath}. Model calls used in total: ${callsUsed()} of ${CALL_CAP}.`)
}

function report(results: { pick: Pick; outcome: WriteOutcome | null; error?: string }[], replay = false): string {
  const called = results.filter((r) => r.outcome && r.outcome.status !== 'thin')
  const written = results.filter((r) => r.outcome?.status === 'written')
  const thin = results.filter((r) => r.outcome?.status === 'thin')
  const rejected = results.filter((r) => r.outcome?.status === 'rejected')
  const byCheck = new Map<string, number>()
  for (const r of rejected) {
    const o = r.outcome as Extract<WriteOutcome, { status: 'rejected' }>
    for (const c of new Set(o.failures.map((f) => f.check))) byCheck.set(c, (byCheck.get(c) ?? 0) + 1)
    if (o.failures.length === 0) byCheck.set('answer unusable', (byCheck.get('answer unusable') ?? 0) + 1)
  }
  const usages = called.map((r) => (r.outcome as Extract<WriteOutcome, { usage: unknown }>).usage)
  const avg = (f: (u: (typeof usages)[number]) => number) => (usages.length ? Math.round(usages.reduce((n, u) => n + f(u), 0) / usages.length) : 0)

  const lines: string[] = [
    `# Long story summaries: dry run`,
    ``,
    `Model ${SUMMARY_MODEL}. ${results.length} stories: ${written.length} got a summary, ${thin.length} too thin, ${rejected.length} discarded by a check, ${results.length - written.length - thin.length - rejected.length} errors.`,
    ...(replay ? [`Replayed: no model call was made; the saved answers were judged again with the checks as they are now.`] : []),
    `Checks failed: ${byCheck.size ? [...byCheck].map(([k, v]) => `${k} x${v}`).join(', ') : 'none'}.`,
    `Average tokens per call (${usages.length} calls): ${avg((u) => u.input_tokens)} input uncached, ${avg((u) => u.cache_read_input_tokens)} cache read, ${avg((u) => u.cache_creation_input_tokens)} cache write, ${avg((u) => u.output_tokens)} output.`,
    ``,
  ]
  results.forEach(({ pick, outcome, error }, n) => {
    const s = pick.story
    lines.push(`## ${n + 1}. ${s.headline}`, ``)
    lines.push(`- Kind: ${pick.kind}. First seen ${s.firstSeen.slice(0, 10)}${pick.inWindow ? '' : ' (outside 10-07 / 10-08: no stored text on file for those days)'}. Stored text on file: ${pick.textOnFile ? 'yes' : 'no (headlines only)'}. Real text beyond headlines: ${pick.realChars} chars.`)
    lines.push(`- Outlets (${new Set(pick.prepared.map((p) => p.outlet)).size}): ${[...new Set(pick.prepared.map((p) => p.outlet))].join('; ')}`)
    lines.push(`- Today's short summary: ${s.summary ?? '(none)'}`)
    if (error) lines.push(`- ERROR: ${error}`)
    else if (!outcome) lines.push(`- Not run.`)
    else if (outcome.status === 'thin') lines.push(`- Long summary: **too thin** (the page keeps the short one)`)
    else {
      const u = outcome.usage
      lines.push(`- Tokens: ${u.input_tokens} in uncached, ${u.cache_read_input_tokens} cache read, ${u.cache_creation_input_tokens} cache write, ${u.output_tokens} out.`)
      if (outcome.status === 'written') {
        lines.push(`- Checks failed: none. ${wordCount(outcome.summary)} words.`, `- Long summary:`, ``, ...outcome.summary.split(/\n\s*\n/).map((p) => `> ${p}`).join('\n>\n').split('\n'))
        if (outcome.unsupported.length) lines.push(``, `- Model's own "unsupported" list (never shown): ${outcome.unsupported.join('; ')}`)
      } else {
        lines.push(`- Checks failed: ${outcome.failures.length ? outcome.failures.map((f) => `${f.check} (${f.detail})`).join('; ') : outcome.reason}. Would be discarded and marked for one retry.`)
        if (outcome.summary) lines.push(`- Discarded summary (${wordCount(outcome.summary)} words):`, ``, `> ${outcome.summary.replace(/\n\s*\n/g, '\n>\n> ')}`)
      }
    }
    lines.push(``)
  })
  return lines.join('\n')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
