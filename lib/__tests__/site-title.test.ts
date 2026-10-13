import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The site's titles fit a search result. The homepage title was 76 characters
 * until 2026-10-12 and Google cut it; a result shows about 60. The files are
 * read as text because app/layout.tsx loads fonts that do not run under vitest.
 */
const ROOT = join(__dirname, '..', '..')
const TITLE_MAX = 60
const DESCRIPTION_MAX = 160

function metadataStrings(file: string, key: 'title' | 'description' | 'default' | 'absolute'): string[] {
  const src = readFileSync(join(ROOT, file), 'utf8')
  return Array.from(src.matchAll(new RegExp(`\\b${key}:\\s*(['"])((?:(?!\\1).)*)\\1`, 'g'))).map((m) => m[2])
}

describe('the homepage title', () => {
  it('is brand first, says "private markets news" and fits in a search result', () => {
    const titles = [...metadataStrings('app/layout.tsx', 'default'), ...metadataStrings('app/page.tsx', 'absolute'), ...metadataStrings('app/page.tsx', 'title'), ...metadataStrings('app/layout.tsx', 'title')]
    // The bare brand (the RSS link's title) is not a page title.
    const homepage = titles.filter((t) => t.startsWith('FundOpsHQ ') || t.startsWith('FundOpsHQ:'))
    expect(homepage.length).toBeGreaterThanOrEqual(2)
    for (const t of homepage) {
      expect(t.length, t).toBeLessThanOrEqual(TITLE_MAX)
      expect(t.toLowerCase(), t).toContain('private markets news')
    }
  })

  it('has a meta description that is not cut either', () => {
    // The first `description` in each file is the meta description; the share cards' own follow it.
    const descriptions = [metadataStrings('app/layout.tsx', 'description')[0], metadataStrings('app/page.tsx', 'description')[0]]
    for (const d of descriptions) {
      expect(d).toBeTruthy()
      expect(d.length, d).toBeLessThanOrEqual(DESCRIPTION_MAX)
    }
  })
})
