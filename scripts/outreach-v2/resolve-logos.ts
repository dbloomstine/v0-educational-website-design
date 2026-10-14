#!/usr/bin/env npx tsx
/**
 * Resolve each sponsor lead's logo from its own homepage, the way a person
 * would: open the site in headless Chrome and take the mark in its header (the
 * link back to the homepage, top left), image or inline SVG, drawn exactly as
 * the site draws it (computed fills and all) on a transparent ground. A
 * wordmark lockup is preferred to a lone icon; the site's structured-data logo
 * and its touch icon are used only when the header has nothing. The result is
 * trimmed, measured (a light mark is drawn on a dark plate in the ad, a dark
 * one on a light plate: components/sponsor/SponsorBuilder.tsx) and stored as a
 * PNG we host (public bucket `mockup-logos`), with the page it came from, in
 * outreach_v2_logos. /api/sponsor/logo serves it from there.
 *
 *   npx tsx --env-file=.env.local scripts/outreach-v2/resolve-logos.ts <leads.json> [--only domain,domain] [--shots dir]
 *
 * --shots writes each homepage's header as the site shows it (for checking by eye).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { launch, type Page } from './chrome'
import { parseBatchFile } from '../../lib/outreach-v2/sponsor-pitch'

interface Found { kind: 'header' | 'header-img'; rect: { x: number; y: number; width: number; height: number }; how: string }
interface Measured { drawn: number; light: number; colours: number; clear: number; w: number; h: number; png: string }

/** Runs in the page: finds the header logo, marks it, and returns its box (or null). */
const FIND = `(() => {
  const vw = innerWidth
  const host = location.hostname.replace(/^www\\./, '')
  const shown = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05 }
  const isHome = (a) => { const raw = (a.getAttribute('href') || '').trim(); if (!raw || raw.startsWith('#')) return false; try { const u = new URL(raw, location.href); const p = u.pathname.replace(/\\/+$/, ''); return u.hostname.replace(/^www\\./, '') === host && (p === '' || /^\\/(index\\.html?|home|en|en-us)$/i.test(p)) } catch { return false } }
  const marksIn = (root) => [...root.querySelectorAll('img, svg, picture, [style*="background-image"]')].filter((e) => !(e.tagName.toLowerCase() === 'svg' && e.parentElement && e.parentElement.closest('svg'))).filter(shown)
  const union = (els) => { const rs = els.map((e) => e.getBoundingClientRect()); const x = Math.min(...rs.map((r) => r.left)), y = Math.min(...rs.map((r) => r.top)); return { x, y, width: Math.max(...rs.map((r) => r.right)) - x, height: Math.max(...rs.map((r) => r.bottom)) - y } }
  const inTop = (r) => r.top >= 0 && r.left >= 0 && r.top < 220 && r.left < vw * 0.6 && r.height >= 10 && r.height <= 200 && r.width >= 20 && r.width <= 720
  const cands = []
  for (const a of document.querySelectorAll('a[href]')) {
    if (!isHome(a) || !shown(a)) continue
    const r = a.getBoundingClientRect()
    if (!inTop(r)) continue
    const marks = marksIn(a)
    const text = (a.innerText || '').trim()
    if (!marks.length && (!text || text.length > 40)) continue
    let el = a, box
    if (marks.length) {
      const u = union(marks)
      const wordmark = u.width / Math.max(1, u.height) >= 2
      // A lone icon beside the firm's name set in type: take the whole lockup.
      box = !wordmark && text && text.length <= 40 ? { x: r.left, y: r.top, width: r.width, height: r.height } : u
    } else box = { x: r.left, y: r.top, width: r.width, height: r.height }
    cands.push({ el, box, score: (marks.length ? 2 : 1) + (box.width / Math.max(1, box.height) >= 2 ? 1 : 0) - box.y / 400 - box.x / 2000, how: marks.length ? 'home link: ' + marks.map((m) => m.tagName.toLowerCase()).join('+') : 'home link: text' })
  }
  if (!cands.length) {
    for (const e of document.querySelectorAll('img, svg')) {
      if (e.tagName.toLowerCase() === 'svg' && e.parentElement && e.parentElement.closest('svg')) continue
      const hint = [e.getAttribute('class'), e.id, e.getAttribute('alt'), e.getAttribute('src'), e.getAttribute('aria-label'), e.parentElement && e.parentElement.getAttribute('class')].join(' ')
      if (!/logo|brand/i.test(hint) || !shown(e)) continue
      const r = e.getBoundingClientRect()
      if (!inTop(r)) continue
      cands.push({ el: e, box: { x: r.left, y: r.top, width: r.width, height: r.height }, score: 0.5 - r.top / 400, how: 'logo-named ' + e.tagName.toLowerCase(), img: true })
    }
  }
  if (!cands.length) return null
  cands.sort((a, b) => b.score - a.score)
  const best = cands[0]
  best.el.setAttribute('data-fops-logo', '1')
  return { kind: best.img ? 'header-img' : 'header', rect: best.box, how: best.how }
})()`

/** Hides everything but the marked logo, on a transparent page. */
const ISOLATE = `(() => {
  // What the logo draws from elsewhere in the page stays visible too: <use> targets (sprite symbols) and the
  // filters, masks and clip paths it or its ancestors apply (ToltIQ's header logo is a sprite under a filter).
  const logo = document.querySelector('[data-fops-logo]')
  const ids = new Set()
  for (const u of logo.querySelectorAll('use')) { const h = u.getAttribute('href') || u.getAttribute('xlink:href') || ''; if (h.startsWith('#')) ids.add(h.slice(1)) }
  for (let e = logo; e; e = e.parentElement) {
    const cs = getComputedStyle(e)
    for (const v of [cs.filter, cs.mask, cs.clipPath, cs.maskImage]) for (const m of String(v).matchAll(/url\\(["']?#([^"')]+)/g)) ids.add(m[1])
  }
  for (const el of logo.querySelectorAll('*')) { const cs = getComputedStyle(el); for (const v of [cs.fill, cs.stroke, cs.filter, cs.mask, cs.clipPath]) for (const m of String(v).matchAll(/url\\(["']?#([^"')]+)/g)) ids.add(m[1]) }
  for (const id of ids) { const t = document.getElementById(id); if (t) t.setAttribute('data-fops-keep', '1') }
  const st = document.createElement('style')
  st.textContent = 'html,body{background:transparent!important;background-image:none!important}*,*::before,*::after{visibility:hidden!important;animation:none!important;transition:none!important}[data-fops-logo],[data-fops-logo] *,[data-fops-keep],[data-fops-keep] *,symbol,symbol *,defs,defs *{visibility:visible!important}[data-fops-logo]{background:transparent!important;box-shadow:none!important;border-color:transparent!important;outline:none!important}'
  document.head.appendChild(st)
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))
})()`

/** Trims and measures a PNG (data URL) in the page. */
const MEASURE = (src: string) => `(async () => {
  const img = new Image(); img.src = ${JSON.stringify(src)}; await img.decode()
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight
  const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height).data
  let minX = c.width, minY = c.height, maxX = -1, maxY = -1, drawn = 0, light = 0; const cols = new Set()
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 24) continue
    const p = i / 4, px = p % c.width, py = (p - px) / c.width
    drawn++; if (px < minX) minX = px; if (px > maxX) maxX = px; if (py < minY) minY = py; if (py > maxY) maxY = py
    if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] > 200) light++
    cols.add(((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4))
  }
  if (!drawn) return { drawn: 0, light: 0, colours: 0, clear: 1, w: 0, h: 0, png: '' }
  const w = maxX - minX + 1, h = maxY - minY + 1
  const o = document.createElement('canvas'); o.width = w; o.height = h; o.getContext('2d').drawImage(c, minX, minY, w, h, 0, 0, w, h)
  return { drawn, light: light / drawn, colours: cols.size, clear: 1 - drawn / (w * h), w, h, png: o.toDataURL('image/png') }
})()`

/** A photograph or a screenshot of a page, not a mark: no clear ground around it and many colours. */
const looksLikePhoto = (m: Measured) => m.clear < 0.03 && m.colours > 300

const pad = (r: Found['rect'], n = 3) => ({ x: Math.max(0, r.x - n), y: Math.max(0, r.y - n), width: r.width + 2 * n, height: r.height + 2 * n })

async function measure(page: Page, png: Buffer): Promise<Measured> {
  await page.goto('about:blank', 5000)
  return page.eval<Measured>(MEASURE(`data:image/png;base64,${png.toString('base64')}`))
}

/** The structured-data logo, else the touch icon: only when the header gives nothing. */
async function fallbackLogo(page: Page): Promise<{ url: string; kind: 'jsonld' | 'icon' } | null> {
  return page.eval(`(() => {
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      const m = s.textContent.match(/"logo"\\s*:\\s*(?:\\{[^{}]*?"(?:url|contentUrl)"\\s*:\\s*)?"(https:[^"]+)"/i)
      if (m) return { url: m[1].replace(/\\\\\\//g, '/'), kind: 'jsonld' }
    }
    const t = document.querySelector('link[rel~="apple-touch-icon"]')
    if (t && t.href) return { url: t.href, kind: 'icon' }
    return null
  })()`)
}

async function rasterUrl(page: Page, url: string): Promise<Buffer | null> {
  // Draw the file alone on a transparent page and photograph it (SVG and bitmaps alike).
  const html = `<!doctype html><style>html,body{margin:0;background:transparent}img{display:block;height:120px;width:auto}</style><img src="${url.replace(/"/g, '&quot;')}">`
  await page.goto(`data:text/html;base64,${Buffer.from(html).toString('base64')}`, 10_000)
  const box = await page.eval<{ w: number; h: number } | null>(`new Promise((r) => { const im = document.images[0]; const done = () => r(im.naturalWidth ? { w: im.getBoundingClientRect().width, h: im.getBoundingClientRect().height } : null); if (im.complete) done(); else { im.onload = done; im.onerror = () => r(null) } })`)
  if (!box) return null
  return page.shot({ x: 0, y: 0, width: Math.ceil(box.w), height: Math.ceil(box.h) })
}

async function main() {
  const file = process.argv[2]
  const only = (process.argv[process.argv.indexOf('--only') + 1] ?? '').split(',').filter((s) => process.argv.includes('--only') && s)
  const shotsAt = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null
  if (shotsAt) mkdirSync(shotsAt, { recursive: true })
  const leads = parseBatchFile(JSON.parse(readFileSync(file, 'utf8'))).leads as Array<{ company: string; domain: string }>
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const page = await launch({ width: 1440, height: 900, scale: 3 })
  const report: Record<string, unknown>[] = []
  try {
    for (const lead of leads) {
      const domain = lead.domain.toLowerCase().replace(/^www\./, '')
      if (only.length && !only.includes(domain)) continue
      const source = `https://${domain}/`
      let row: Record<string, unknown> = { domain, company: lead.company, source_page: source, source_kind: 'none', storage_path: null, public_url: null, width: null, height: null, tone: null, note: null }
      try {
        await page.transparent(false)
        await page.goto(source)
        await new Promise((r) => setTimeout(r, 2500)) // late scripts draw headers (Framer, Webflow)
        await page.eval('window.scrollTo(0, 0)')
        if (shotsAt) writeFileSync(join(shotsAt, `${domain}-header.png`), await page.shot({ x: 0, y: 0, width: 1440, height: 160 }))
        const finalUrl = await page.eval<string>('location.href')
        row.source_page = finalUrl
        const found = await page.eval<Found | null>(FIND)
        let png: Buffer | null = null
        let kind: string = 'none'
        let how = ''
        if (found) {
          await page.eval(ISOLATE)
          await page.transparent(true)
          // A small mark is photographed larger (re-drawn, not stretched) so it stays sharp at the ad's size.
          const zoom = Math.min(4, Math.max(1, Math.ceil(160 / Math.max(1, found.rect.width))))
          png = await page.shot(pad(found.rect), zoom)
          kind = found.kind
          how = found.how
        }
        let m = png ? await measure(page, png) : null
        if (process.env.DEBUG) console.warn(domain, found, m && { ...m, png: m.png.length })
        // Nothing drawn, or a photograph: try the site's own fallbacks.
        if (!m || !m.drawn || looksLikePhoto(m)) {
          await page.transparent(false)
          await page.goto(finalUrl)
          const fb = await fallbackLogo(page)
          if (fb) {
            await page.transparent(true)
            const raster = await rasterUrl(page, fb.url)
            const m2 = raster ? await measure(page, raster) : null
            if (m2 && m2.drawn && !looksLikePhoto(m2)) { m = m2; kind = fb.kind; how = `${fb.kind}: ${fb.url}` } else m = null
          } else m = null
        }
        if (m && m.drawn) {
          const bytes = Buffer.from(m.png.split(',')[1], 'base64')
          const path = `${domain}.png`
          const up = await db.storage.from('mockup-logos').upload(path, bytes, { contentType: 'image/png', upsert: true })
          if (up.error) throw new Error(up.error.message)
          const url = db.storage.from('mockup-logos').getPublicUrl(path).data.publicUrl
          // A mark that is mostly light where it is drawn, with clear ground around it, needs a dark plate.
          const tone = m.clear > 0.02 && m.light > 0.6 ? 'light' : 'dark'
          row = { ...row, source_kind: kind, storage_path: path, public_url: url, width: m.w, height: m.h, tone, note: how }
        } else row.note = 'no usable logo on the homepage: the name is shown in type'
      } catch (err) {
        row.note = `failed: ${err instanceof Error ? err.message : String(err)}`
      }
      row.resolved_at = new Date().toISOString()
      const { error } = await db.from('outreach_v2_logos').upsert(row)
      if (error) throw new Error(error.message)
      report.push({ company: row.company, kind: row.source_kind, tone: row.tone, size: row.width ? `${row.width}x${row.height}` : '', note: row.note })
      console.warn(`${lead.company}: ${row.source_kind} ${row.tone ?? ''} ${row.note ?? ''}`)
    }
  } finally {
    await page.close()
  }
  console.warn(JSON.stringify(report, null, 1))
}

main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1) })
