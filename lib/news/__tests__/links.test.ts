import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A <Link> to a static page is prefetched when it scrolls into view, and a
 * prefetch of a page that is built on demand BUILDS it. Story, firm and event
 * pages are built on demand, and lists link to hundreds of them: one visit to
 * the firm directory would build five hundred firm pages — a thousand database
 * queries — and so would every crawler that runs JavaScript. Those links say
 * prefetch={false}. (The header's tabs keep prefetching: thirteen pages, built
 * at deploy, and it is what makes a tab open instantly.)
 */
const ROOT = join(__dirname, '..', '..', '..')
const ON_DEMAND = /^\{`\/story\/\$\{|^\{`\/firm\/\$\{|^\{`\/events\/\$\{(?:event|e)\.slug|^\{firmHref\(|^\{f\.href\}|^\{bar\.href\}/

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.tsx$/.test(name) ? [path] : []
  })
}

/** Every <Link …> opening tag in a file. */
function linkTags(source: string): string[] {
  const tags: string[] = []
  for (const m of source.matchAll(/<Link\b/g)) {
    let depth = 0
    let j = (m.index ?? 0) + m[0].length
    for (; j < source.length; j++) {
      const c = source[j]
      if (c === '{') depth++
      else if (c === '}') depth--
      else if (c === '>' && depth === 0 && source[j - 1] !== '=') break
    }
    tags.push(source.slice(m.index, j + 1))
  }
  return tags
}

describe('links to pages that are built on demand', () => {
  it('do not prefetch', () => {
    const offenders: string[] = []
    let checked = 0
    for (const file of [...sources(join(ROOT, 'app')), ...sources(join(ROOT, 'components'))]) {
      for (const tag of linkTags(readFileSync(file, 'utf8'))) {
        const href = tag.match(/href=(\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*")/)?.[1] ?? ''
        if (!ON_DEMAND.test(href)) continue
        checked++
        if (!tag.includes('prefetch={false}')) offenders.push(`${file.replace(ROOT, '')}: ${href}`)
      }
    }
    expect(offenders).toEqual([])
    // The scan found the links it is meant to guard.
    expect(checked).toBeGreaterThanOrEqual(20)
  })
})
