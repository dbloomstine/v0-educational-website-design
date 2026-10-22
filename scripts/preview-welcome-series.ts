/**
 * Renders the welcome series' emails (lib/newsletter/welcome-series.ts) to files. Sends nothing, reads nothing.
 *
 *   npx tsx scripts/preview-welcome-series.ts [out-dir]      default /tmp/fundops-welcome-series
 *
 * Writes <key>.html and <key>.txt per email (subject and preview text on the .txt's first lines). Email 3b is text
 * only, so its .html is the text in a <pre>, for looking at side by side. Email 1 and 3 are rendered twice: with and
 * without the one-click follow row, and with and without the Monday events line.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderSeriesEmail, type SeriesContext } from '../lib/newsletter/welcome-series'
import type { WelcomeEmailKey } from '../lib/newsletter/welcome-series-schedule'

const out = process.argv[2] || '/tmp/fundops-welcome-series'
mkdirSync(out, { recursive: true })

const base: SeriesContext = {
  unsubscribeUrl: 'https://fundopshq.com/api/newsletter/unsubscribe?token=PREVIEW',
  preferencesUrl: 'https://fundopshq.com/preferences?token=PREVIEW',
  interestToken: '00000000-0000-4000-8000-000000000000.PREVIEW',
  audience: { readers: 161, firms: 98 },
  eventsMondayLive: false,
}

const variants: Array<[string, WelcomeEmailKey, SeriesContext]> = [
  ['1-follow-what-you-follow', '1', base],
  ['2-how-to-read', '2', base],
  ['3-between-editions', '3', base],
  ['3-between-editions-monday-events-live', '3', { ...base, eventsMondayLive: true }],
  ['3b-is-it-reaching-you', '3b', base],
  ['4-who-else', '4', base],
  ['4-who-else-no-audience-counts', '4', { ...base, audience: null }],
]

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
for (const [name, key, ctx] of variants) {
  const e = renderSeriesEmail(key, ctx)
  const html = e.html ?? `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(e.subject)}</title></head><body style="font-family:-apple-system,Arial,sans-serif;max-width:640px;margin:24px auto;padding:0 16px;"><p style="color:#666;font-size:13px;">Plain-text email. Subject: <b>${esc(e.subject)}</b></p><pre style="white-space:pre-wrap;font-family:inherit;font-size:15px;line-height:1.6;">${esc(e.text)}</pre></body></html>`
  writeFileSync(join(out, `${name}.html`), html)
  writeFileSync(join(out, `${name}.txt`), `Subject: ${e.subject}\nPreview: ${e.preheader}\n\n${e.text}`)
}
console.log(`Wrote ${variants.length} emails to ${out}`)
