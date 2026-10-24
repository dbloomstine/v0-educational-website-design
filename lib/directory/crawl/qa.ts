/**
 * The per-run QA report (2026-10-25): counts for every source, every reject
 * reason, every flag, and a random sample of 20 kept rows with a field-by-field
 * list of what to check against the page. The sample is seeded by the run's
 * date, so a re-run of the same day draws the same rows.
 */
import { CATEGORIES } from '../taxonomy'
import { officeLabel } from '../places'
import type { SourceResult } from './crawl'
import type { DirectoryRow } from './types'

/** mulberry32: a small seeded generator, so the sample is reproducible. */
export function seededRandom(seed: string): () => number {
  let a = 0
  for (const ch of seed) a = (Math.imul(a ^ ch.charCodeAt(0), 2654435761) >>> 0) + 1
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function sample<T>(xs: T[], n: number, seed: string): T[] {
  const rnd = seededRandom(seed)
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

/** What to check on the page for one row. */
export function eyeball(r: DirectoryRow, flags: string[], evidence?: { scope?: string; practice?: string; kind?: string }): string[] {
  const lines = [
    `full_name **${r.full_name}**: spelled as the page heading, suffix (Jr., III) kept, no credentials`,
    `title **${r.title}**: the title shown on the page, not a group name`,
    `firm **${r.firm_name}** (${r.firm_domain}): the firm itself, not a department`,
    `offices **${r.offices.map(officeLabel).join('; ')}**: stated for this person, not a coverage region or the footer`,
    `practice_areas **${r.practice_areas.join(', ') || '(none)'}**: each stated on the page${evidence?.practice ? ` (model: "${evidence.practice}")` : ''}`,
    `in scope: ${evidence?.scope ? `"${evidence.scope}"` : '(no reason)'}: is this person really a ${CATEGORIES[r.category].singular.toLowerCase()}?`,
    `education **${r.education.map((e) => [e.school, e.degree, e.year].filter(Boolean).join(' ')).join('; ') || '(none)'}**: only degrees listed`,
    `bio_url ${r.bio_url}: opens this person's own page${evidence?.kind === 'team' ? ' (a TEAM page: the person must be on it)' : ''}`,
  ]
  if (r.client_focus.length) lines.push(`client_focus **${r.client_focus.join(', ')}**: stated, not inferred`)
  if (r.represents.length) lines.push(`represents **${r.represents.join(', ')}**: stated, not inferred`)
  if (r.bar_admissions.length) lines.push(`bar_admissions **${r.bar_admissions.join(', ')}**`)
  for (const f of flags) lines.push(`FLAG: ${f}`)
  return lines
}

export interface RunMeta {
  started_at: string
  finished_at: string
  spend: { usd: number; calls: number; input_tokens: number; output_tokens: number; limit_usd: number }
  ci: boolean
  stopped?: string
}

export function qaReport(results: SourceResult[], meta: RunMeta, seed: string): string {
  const out: string[] = []
  const rows = results.flatMap((r) => r.rows)
  const rejected = results.reduce((n, r) => n + r.rejected.length, 0)
  const extracted = results.reduce((n, r) => n + r.extracted, 0)
  out.push(`# Directory crawl QA, ${meta.started_at.slice(0, 10)}`, '')
  out.push(`- Run: ${meta.started_at} to ${meta.finished_at}${meta.ci ? ' (CI: no headless sources)' : ''}`)
  out.push(`- Spend: $${meta.spend.usd.toFixed(4)} of the $${meta.spend.limit_usd} cap, ${meta.spend.calls} model calls, ${meta.spend.input_tokens.toLocaleString('en-US')} in / ${meta.spend.output_tokens.toLocaleString('en-US')} out tokens`)
  if (meta.stopped) out.push(`- **Stopped early:** ${meta.stopped}`)
  out.push(`- People read: ${extracted}; kept: ${rows.length}; rejected: ${rejected}; duplicates merged: ${results.reduce((n, r) => n + r.duplicates, 0)}`, '')

  out.push('## Sources', '', '| Source | Status | Method | Pages | Failed | Model errors | Read | Kept | Rejected | Flagged | Notes |', '|---|---|---|---|---|---|---|---|---|---|---|')
  for (const r of results) {
    const flagged = [...r.flags.values()].filter((f) => f.length).length
    const notes = [r.stopped, ...r.discovery.notes].filter(Boolean).slice(0, 3).join('; ').replace(/\|/g, '/')
    out.push(`| ${r.source.key} | ${r.status} | ${r.source.method} | ${r.discovery.jobs.length} | ${r.pages.failed} | ${r.pages.model_errors} | ${r.extracted} | ${r.rows.length} | ${r.rejected.length} | ${flagged} | ${notes} |`)
  }

  const reasons: Record<string, number> = {}
  for (const r of results) for (const [k, n] of Object.entries(r.rejectReasons)) reasons[k] = (reasons[k] ?? 0) + n
  out.push('', '## Why rows were rejected', '')
  for (const [k, n] of Object.entries(reasons).sort((a, b) => b[1] - a[1])) out.push(`- ${n} × ${k}`)
  if (!Object.keys(reasons).length) out.push('- none')

  const flagCount: Record<string, number> = {}
  for (const r of results) for (const fl of r.flags.values()) for (const f of fl) {
    const k = f.replace(/".*?"/g, '…').replace(/\(.*\)/, '').replace(/\d+/g, 'N').trim()
    flagCount[k] = (flagCount[k] ?? 0) + 1
  }
  out.push('', '## Flags on kept rows (look at these)', '')
  for (const [k, n] of Object.entries(flagCount).sort((a, b) => b[1] - a[1])) out.push(`- ${n} × ${k}`)
  if (!Object.keys(flagCount).length) out.push('- none')

  const bySlug = new Map(results.flatMap((r) => [...r.flags.entries()]))
  const evidence = new Map(results.flatMap((r) => [...r.evidence.entries()]))
  out.push('', `## Random sample: ${Math.min(20, rows.length)} rows to check against the page`, '', `Seed \`${seed}\`. Open each bio URL and tick every line.`, '')
  sample(rows, 20, seed).forEach((r, i) => {
    const ev = evidence.get(r.slug)
    out.push(`### ${i + 1}. ${r.full_name} (${r.firm_name}, ${CATEGORIES[r.category].singular})`, `\`${r.slug}\``, '')
    for (const l of eyeball(r, bySlug.get(r.slug) ?? [], { scope: ev?.person.scope_evidence, practice: ev?.person.practice_evidence, kind: ev?.page.kind })) out.push(`- [ ] ${l}`)
    out.push('')
  })

  const sampleRejects = results.flatMap((r) => r.rejected)
  out.push(`## Rejected rows (first 40 of ${sampleRejects.length})`, '')
  for (const r of sampleRejects.slice(0, 40)) out.push(`- ${r.full_name || '(no name)'} (${r.source_key}) ${r.bio_url}: ${r.errors.join('; ')}`)
  return out.join('\n') + '\n'
}
