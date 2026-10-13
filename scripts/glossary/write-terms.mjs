/**
 * Fills in the glossary (lib/glossary/terms.json): for each term whose
 * definition, example and "why it matters" came checked from the social desk's
 * explainer (fundopshq-social, engine/terms.mjs), the Claude API writes the two
 * fields that desk never needed: a short explanation and the related terms.
 *
 *   node scripts/glossary/write-terms.mjs            # write what is missing
 *   node scripts/glossary/write-terms.mjs --force    # write every term again (asks, then pays, again)
 *   node scripts/glossary/write-terms.mjs --only nav-loan,clawback
 *
 * Every answer is kept raw in scripts/glossary/answers.json, so a run never
 * pays twice for a term: a re-run writes only what has no answer on file. The
 * merged result is written back to terms.json, which is the committed source
 * the pages read. Read the merged text before committing it: the model is
 * fluent and sometimes wrong, and a glossary page is a definition.
 *
 * ANTHROPIC_API_KEY is read from .env.local into this process and never
 * printed. Totals (tokens, dollars at Sonnet's list price) print at the end.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const TERMS_PATH = join(ROOT, 'lib', 'glossary', 'terms.json')
const ANSWERS_PATH = join(HERE, 'answers.json')

const MODEL = 'claude-sonnet-5-5'
const API = 'https://api.anthropic.com/v1/messages'
const MAX_TOKENS = 450
const CONCURRENCY = 4
/** The most calls one run makes, whatever the flags say: 88 terms, a little room for retries. */
const CALL_CAP = 110
// Sonnet list prices per million tokens: input, output, cache write, cache read.
const PRICE = { in: 3, out: 15, cacheWrite: 3.75, cacheRead: 0.3 }

const has = (flag) => process.argv.includes(flag)
const flag = (name) => {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : undefined
}

function loadKey() {
  const path = join(ROOT, '.env.local')
  if (!existsSync(path)) throw new Error('.env.local not found')
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^ANTHROPIC_API_KEY\s*=\s*"?([^"\n]+)"?\s*$/)
    if (m) return m[1].trim()
  }
  throw new Error('ANTHROPIC_API_KEY is not in .env.local')
}

const file = JSON.parse(readFileSync(TERMS_PATH, 'utf8'))
const terms = file.terms
const slugs = new Set(terms.map((t) => t.slug))
const answers = existsSync(ANSWERS_PATH) ? JSON.parse(readFileSync(ANSWERS_PATH, 'utf8')) : {}

const SYSTEM = `You write entries for the glossary of FundOpsHQ, a daily news site for GPs, LPs and fund service providers in private markets. Each entry already has a checked definition, an example and a line on why the term matters, all written by a practitioner. You add two things.

1. "explanation": two or three sentences, at most 70 words, that a sharp colleague would add in a minute: how the thing works in practice, where it turns up (which document, which stage of a fund's life, which kind of deal), what commonly varies and what it is often confused with. Do not repeat the definition or the example; add to them. Do not contradict them.

2. "related": three to five slugs from the list below, the terms a reader of this one would want next, most useful first. Only slugs from the list; never the term's own slug.

Rules: plain and exact, no hype, no "in today's fast-paced market", no rhetorical questions, no second person. US spelling. No statistics, percentages or market sizes unless they are a term's own standard figure (an 8% hurdle, a 2% fee). No real firm, fund, person or deal: a "$500 million buyout fund", never a named one. Where usage varies, say "usually", "often" or "typically". Definitions, not advice.

Answer with one JSON object and nothing else: {"explanation": "...", "related": ["slug", ...]}

The glossary's terms (slug: term):
${terms.map((t) => `${t.slug}: ${t.term}`).join('\n')}`

function userMessage(t) {
  return `Term: ${t.term} (slug: ${t.slug})
Group: ${t.group}
Definition: ${t.define}
Why it matters: ${t.why}
Example: ${t.example}`
}

const usage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }
let calls = 0

async function ask(t, apiKey) {
  if (calls >= CALL_CAP) throw new Error(`call cap of ${CALL_CAP} reached`)
  calls++
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage(t) }],
    }),
    signal: AbortSignal.timeout(90_000),
  })
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  for (const k of Object.keys(usage)) usage[k] += data.usage?.[k] ?? 0
  const text = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('')
  return { text, stop: data.stop_reason ?? null, model: data.model ?? MODEL, at: new Date().toISOString() }
}

/** The answer as the two fields, or the reason it is unusable. */
function parse(t, raw) {
  const m = raw.text.match(/\{[\s\S]*\}/)
  if (!m) return { error: 'no JSON object in the answer' }
  let obj
  try {
    obj = JSON.parse(m[0])
  } catch {
    return { error: 'the JSON did not parse' }
  }
  const explanation = String(obj.explanation ?? '').replace(/\s+/g, ' ').trim()
  const words = explanation.split(/\s+/).filter(Boolean).length
  if (words < 15 || words > 80) return { error: `explanation is ${words} words` }
  const related = Array.isArray(obj.related) ? obj.related.map(String).filter((s) => slugs.has(s) && s !== t.slug) : []
  if (related.length < 2) return { error: `only ${related.length} related slugs are real` }
  return { explanation, related: Array.from(new Set(related)).slice(0, 5) }
}

async function main() {
  const only = flag('--only')?.split(',').map((s) => s.trim()).filter(Boolean)
  const force = has('--force')
  const todo = terms.filter((t) => (!only || only.includes(t.slug)) && (force || !answers[t.slug] || answers[t.slug].error))
  console.log(`${terms.length} terms; ${todo.length} to write; ${Object.keys(answers).length} answers on file`)
  if (todo.length === 0) return merge()

  const apiKey = loadKey()
  const queue = [...todo]
  const worker = async () => {
    while (queue.length) {
      const t = queue.shift()
      try {
        const raw = await ask(t, apiKey)
        const parsed = parse(t, raw)
        answers[t.slug] = { ...raw, ...parsed }
        console.log(`${parsed.error ? 'REJECTED' : 'written '} ${t.slug}${parsed.error ? `: ${parsed.error}` : ''}`)
      } catch (err) {
        console.error(`FAILED   ${t.slug}: ${err instanceof Error ? err.message : String(err)}`)
        if (/cap of|401|402|403|429/.test(String(err))) queue.length = 0
      }
      writeFileSync(ANSWERS_PATH, JSON.stringify(answers, null, 2) + '\n')
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  merge()

  const dollars =
    (usage.input_tokens * PRICE.in + usage.output_tokens * PRICE.out + usage.cache_creation_input_tokens * PRICE.cacheWrite + usage.cache_read_input_tokens * PRICE.cacheRead) / 1e6
  console.log(
    `\n${calls} calls · in ${usage.input_tokens} (+${usage.cache_creation_input_tokens} cache write, ${usage.cache_read_input_tokens} cache read) · out ${usage.output_tokens} · about $${dollars.toFixed(3)}`,
  )
}

/** The answers on file, into terms.json. A term with no good answer keeps whatever it had. */
function merge() {
  let merged = 0
  for (const t of terms) {
    const a = answers[t.slug]
    if (!a || a.error) continue
    t.explanation = a.explanation
    t.related = a.related
    merged++
  }
  writeFileSync(TERMS_PATH, JSON.stringify(file, null, 2) + '\n')
  const missing = terms.filter((t) => !t.explanation).map((t) => t.slug)
  console.log(`merged ${merged} of ${terms.length} into ${TERMS_PATH}${missing.length ? `; still missing: ${missing.join(', ')}` : ''}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
