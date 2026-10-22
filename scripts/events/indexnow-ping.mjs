// IndexNow for the hand-run scripts (2026-10-22): tells Bing and the engines that
// share its submissions that pages on fundopshq.com are new. The site's own jobs
// use lib/seo/indexnow.ts; a plain node script cannot import TypeScript, so this
// is the same POST, kept small. The key is read from the file that proves it
// (public/<32 hex>.txt), so there is one copy of it.
//
// Used by load-events.mjs after an insert, or by hand:
//   node scripts/events/indexnow-ping.mjs /events/some-slug /events
// Best effort: it never throws, and prints the HTTP status.
import { readdirSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const HOST = 'fundopshq.com'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

function readKey() {
  const dir = new URL('../../public/', import.meta.url)
  const file = readdirSync(dir).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))
  if (!file) return null
  const key = readFileSync(new URL(file, dir), 'utf8').trim()
  return key === file.slice(0, -4) ? key : null
}

export async function pingIndexNow(paths, label = 'events') {
  try {
    const urls = [...new Set(paths.filter(Boolean).map((p) => new URL(p, `https://${HOST}`)).filter((u) => u.hostname === HOST).map((u) => u.toString()))].slice(0, 10_000)
    if (urls.length === 0) return null
    const key = readKey()
    if (!key) { console.log('indexnow: no key file in public/, nothing sent'); return null }
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList: urls }),
      signal: AbortSignal.timeout(10_000),
    })
    console.log(`indexnow (${label}): ${urls.length} URL(s), HTTP ${res.status}${res.status === 200 || res.status === 202 ? '' : ' (not accepted)'}`)
    return res.status
  } catch (err) {
    console.log(`indexnow (${label}): failed: ${err instanceof Error ? err.message : err}`)
    return null
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await pingIndexNow(process.argv.slice(2), 'by hand')
}
