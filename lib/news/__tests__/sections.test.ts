import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { SECTIONS } from '../sections'

describe('sections', () => {
  it('every section slug is exempt from the legacy /news/* redirect', () => {
    // next.config redirects /news/<anything> to /news for old article links.
    // A section added here but not there would silently redirect to Latest.
    const root = join(__dirname, '..', '..', '..')
    const file = readdirSync(root).find((f) => f.startsWith('next.config.'))!
    const config = readFileSync(join(root, file), 'utf8')
    const list = config.match(/const SECTION_SLUGS = \[([\s\S]*?)\]/)?.[1] ?? ''
    const inConfig = Array.from(list.matchAll(/'([a-z-]+)'/g)).map((m) => m[1]).sort()
    expect(inConfig).toEqual(SECTIONS.map((s) => s.slug).sort())
  })

  it('slugs are unique and every section can be reached by kind or asset class', () => {
    expect(new Set(SECTIONS.map((s) => s.slug)).size).toBe(SECTIONS.length)
    for (const s of SECTIONS) expect(Boolean(s.kind) !== Boolean(s.assetClasses?.length), s.slug).toBe(true)
  })
})
