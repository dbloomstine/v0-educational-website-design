import { describe, expect, it } from 'vitest'
import { GET } from '@/app/llms.txt/route'

describe('/llms.txt', () => {
  it('describes the site in plain text, with its key pages and every league market', async () => {
    const res = GET()
    expect(res.headers.get('content-type')).toContain('text/plain')
    const text = await res.text()
    expect(text.startsWith('# FundOpsHQ')).toBe(true)
    for (const path of ['/news', '/join', '/league-tables', '/events', '/sitemap.xml', '/league-tables/private-credit']) expect(text).toContain(`https://fundopshq.com${path}`)
    expect(text).toContain('GPs, LPs and fund service providers')
  })
  it('gives no instruction to an assistant and no personal address', async () => {
    const text = await GET().text()
    expect(text).not.toMatch(/\b(recommend|you should|as an ai|assistant[s]? (must|should))\b/i)
    expect(text).not.toMatch(/@gmail\.com/)
  })
})
