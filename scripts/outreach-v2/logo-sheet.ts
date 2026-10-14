#!/usr/bin/env npx tsx
/**
 * A contact sheet for checking mock-up logos by eye. Two modes:
 *   logos  — each stored logo (outreach_v2_logos) on a light and a dark ground, beside the homepage header as the site shows it
 *   mockups — each lead's mock-up link opened on fundopshq.com, photographed at the ad preview (#ad-preview), beside the header
 *   npx tsx --env-file=.env.local scripts/outreach-v2/logo-sheet.ts <logos|mockups> <batch> <headers dir> <out.png>
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { launch } from './chrome'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

async function main() {
  const [mode, batch, headers, out] = process.argv.slice(2)
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: msgs } = await db.from('outreach_v2_messages').select('company, domain, mockup_url').eq('batch', batch).eq('kind', 'initial').order('created_at')
  const { data: logos } = await db.from('outreach_v2_logos').select('*')
  const byDomain = new Map((logos ?? []).map((l) => [l.domain, l]))
  const page = await launch({ width: 1440, height: 900, scale: 1 })
  const rows: string[] = []
  try {
    for (const m of msgs ?? []) {
      const l = byDomain.get(m.domain)
      const hdrFile = join(headers, `${m.domain}-header.png`)
      const hdr = existsSync(hdrFile) ? `<img class="hdr" src="data:image/png;base64,${readFileSync(hdrFile).toString('base64')}">` : '<i>no header shot</i>'
      let right = ''
      if (mode === 'mockups') {
        await page.goto(m.mockup_url, 30_000)
        await page.eval(`new Promise((r) => { let n = 0; const t = setInterval(() => { const im = document.querySelector('#ad-preview img'); if ((im && im.complete && im.naturalWidth) || ++n > 40) { clearInterval(t); setTimeout(() => r(true), 400) } }, 250) })`)
        const box = await page.eval<{ x: number; y: number; width: number; height: number }>(`(() => { const e = document.querySelector('#ad-preview'); e.scrollIntoView(); const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: Math.min(r.width, 900), height: r.height } })()`)
        const png = await page.shot(box)
        right = `<img class="ad" src="data:image/png;base64,${png.toString('base64')}">`
      } else {
        right = l?.public_url
          ? `<span class="plate light"><img src="${l.public_url}?v=${Date.now()}"></span><span class="plate dark"><img src="${l.public_url}?v=${Date.now()}"></span>`
          : '<b>name in type</b>'
      }
      rows.push(`<tr><td class="n">${esc(m.company)}<br><small>${esc(l?.source_kind ?? '?')} · ${esc(l?.tone ?? '')}<br>${esc((l?.note ?? '').slice(0, 60))}</small></td><td>${hdr}</td><td>${right}</td></tr>`)
    }
    const html = `<!doctype html><style>body{font:13px Arial;margin:8px;background:#fff}table{border-collapse:collapse}td{border:1px solid #ccc;padding:6px;vertical-align:middle}td.n{width:170px}.hdr{width:620px;display:block}.ad{width:760px;display:block}.plate{display:inline-block;padding:10px 14px;margin-right:8px}.plate img{height:34px;display:block}.light{background:#f6f1e7}.dark{background:#14213d}</style><table>${rows.join('')}</table>`
    const htmlFile = out.replace(/\.png$/, '.html')
    writeFileSync(htmlFile, html)
    await page.goto(`file://${htmlFile}`, 30_000)
    await page.eval(`Promise.all([...document.images].map((i) => i.complete ? 1 : new Promise((r) => { i.onload = r; i.onerror = r })))`)
    const h = await page.eval<number>('document.documentElement.scrollHeight')
    const w = await page.eval<number>('document.documentElement.scrollWidth')
    writeFileSync(out, await page.shot({ x: 0, y: 0, width: w, height: h }))
  } finally {
    await page.close()
  }
}
main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1) })
