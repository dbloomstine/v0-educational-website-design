import { describe, expect, it } from 'vitest'
import {
  batchexecuteBody,
  decodeArticleIdPayload,
  findPublisherUrlInHtml,
  googleNewsArticleId,
  isGoogleNewsUrl,
  parseBatchexecuteResponse,
  readSignature,
  resolveGoogleNewsUrl,
} from '../google-news-url'

// Three links as stored in news_items on 2026-10-16 (new-style ids, which
// carry no URL and need the batchexecute call).
const REAL = [
  {
    url: 'https://news.google.com/rss/articles/CBMiowFBVV95cUxQZUpCRlB1ZEJXQ2hscmxGMkhUbGN5ZGVfTTZIQ1Fhcm9kZ1oyYnZXWjBXSl9JcFltWlczT3YtRkRPOFBob3U4VldQNlRXOC02MF9WY2M4SUs5MGFKMUVvUXBwenBnQVdhSWFHMVpEa3NHN01LeThWN1VrRlhqTGJGMUZJV01BdEdRREgyeXA4VmJkYTN6Ml9QR0J1NGNUaEROaW9F?oc=5',
    host: 'www.alternativeswatch.com',
  },
  {
    url: 'https://news.google.com/rss/articles/CBMijwFBVV95cUxOYVZnSlQxUi05bUVkYkVGRUVKNjJwd2hGY1N3dDA2aW1EbG84ZWpIcjJOOV9ndEN4amtvLXMtUlFreVZ5UXlKVUZVMENZcUs2QXZWZGtubmdoMEJqd3VmNWQzOURQN09qaXZzaHVYclEtVkFES0x5V1IxY0JDOTNSR0NjdXh5SDhYQTRvMDdwUQ?oc=5',
    host: 'www.pionline.com',
  },
  {
    url: 'https://news.google.com/rss/articles/CBMib0FVX3lxTE9UZ2xmRHhXZWdGYlRRNlNNdHBPNEY3alNYcXZzT3hPc2lRVk03MGdaWXpjc0gzekota3k2QnN5bDBhRzN6ckE0cFc1TTZmSEo3ajh4Y2NUSWdlSlh5ejNnWmdyTjJ3TzFVcUwxRmc1VQ?oc=5',
    host: 'amwatch.com',
  },
]

/** An old-style id: protobuf field 1 = 0x13, field 4 = the URL. */
function oldStyleId(url: string): string {
  const bytes = Buffer.from(url, 'utf8')
  const len = bytes.length
  const header = Buffer.from([0x08, 0x13, 0x22, len])
  return Buffer.concat([header, bytes]).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

describe('googleNewsArticleId', () => {
  it('reads the id from rss and non-rss article links, with or without ?oc=5', () => {
    for (const r of REAL) expect(googleNewsArticleId(r.url)).toMatch(/^CBMi/)
    expect(googleNewsArticleId('https://news.google.com/articles/CBMiabc')).toBe('CBMiabc')
    expect(isGoogleNewsUrl('https://www.pionline.com/story')).toBe(false)
    expect(isGoogleNewsUrl('https://news.google.com/')).toBe(false)
    expect(isGoogleNewsUrl(null)).toBe(false)
  })
})

describe('decodeArticleIdPayload', () => {
  it('decodes an old-style id that carries the URL', () => {
    const id = oldStyleId('https://www.buyoutsinsider.com/example-story/')
    expect(id.startsWith('CBMi')).toBe(true)
    expect(decodeArticleIdPayload(id)).toBe('https://www.buyoutsinsider.com/example-story/')
  })
  it('returns null for a new-style opaque id', () => {
    for (const r of REAL) expect(decodeArticleIdPayload(googleNewsArticleId(r.url)!)).toBeNull()
  })
  it('returns null for garbage', () => {
    expect(decodeArticleIdPayload('!!!')).toBeNull()
    expect(decodeArticleIdPayload('')).toBeNull()
  })
})

describe('readSignature and batchexecuteBody', () => {
  it('reads the signature and timestamp from the article page', () => {
    const html = '<c-wiz><div jscontroller="x" data-n-a-sg="AbIaSL8oDdzodQXq7KIpEGOC6DGM" data-n-a-ts="1792182108"></div></c-wiz>'
    expect(readSignature(html)).toEqual({ signature: 'AbIaSL8oDdzodQXq7KIpEGOC6DGM', timestamp: 1792182108 })
    expect(readSignature('<html></html>')).toBeNull()
  })
  it('builds the garturlreq form body', () => {
    const body = batchexecuteBody('CBMiX', 'SIG', 123)
    const req = JSON.parse(new URLSearchParams(body).get('f.req')!)
    expect(req[0][0][0]).toBe('Fbv4je')
    const inner = JSON.parse(req[0][0][1])
    expect(inner[0]).toBe('garturlreq')
    expect(inner.slice(2)).toEqual(['CBMiX', 123, 'SIG'])
  })
})

describe('parseBatchexecuteResponse', () => {
  // The answer Google gave for REAL[0] on 2026-10-16.
  const answer = `)]}'\n\n[["wrb.fr","Fbv4je","[\\"garturlres\\",\\"https://www.alternativeswatch.com/2026/10/16/new-private-funds-96bn-september-pe-capital-convergence/\\",1]",null,null,null,"generic"],["di",24],["af.httprm",24,"-322113299068864197",14]]`
  it('reads the URL out of a garturlres row', () => {
    expect(parseBatchexecuteResponse(answer)).toBe('https://www.alternativeswatch.com/2026/10/16/new-private-funds-96bn-september-pe-capital-convergence/')
  })
  it('reads the chunked form (a length line before each array)', () => {
    const chunked = `)]}'\n\n123\n[["wrb.fr","Fbv4je","[\\"garturlres\\",\\"https://amwatch.com/x\\",1]",null,null,null,"generic"]]\n25\n[["di",24]]`
    expect(parseBatchexecuteResponse(chunked)).toBe('https://amwatch.com/x')
  })
  it('is null for an error or an empty answer', () => {
    expect(parseBatchexecuteResponse(`)]}'\n[["wrb.fr","Fbv4je",null,null,null,[3],"generic"]]`)).toBeNull()
    expect(parseBatchexecuteResponse('')).toBeNull()
    expect(parseBatchexecuteResponse('<html>captcha</html>')).toBeNull()
  })
})

describe('findPublisherUrlInHtml', () => {
  it('takes a data-n-au, a meta refresh, a location.replace, or an outward link, never a Google one', () => {
    expect(findPublisherUrlInHtml('<a data-n-au="https://www.pionline.com/a?x=1&amp;y=2">x</a>')).toBe('https://www.pionline.com/a?x=1&y=2')
    expect(findPublisherUrlInHtml('<meta http-equiv="refresh" content="0; url=https://amwatch.com/b">')).toBe('https://amwatch.com/b')
    expect(findPublisherUrlInHtml('<script>location.replace("https://amwatch.com/c")</script>')).toBe('https://amwatch.com/c')
    expect(findPublisherUrlInHtml('<a href="https://policies.google.com/privacy">p</a><a href="https://support.google.com/x">s</a><a href="https://www.pionline.com/d">d</a>')).toBe('https://www.pionline.com/d')
    expect(findPublisherUrlInHtml('<a href="https://news.google.com/home">home</a>')).toBeNull()
  })
})

/** A fetch answer: Response.url is a getter, so a plain object stands in. */
function page(url: string, body: string, status = 200): Response {
  return { ok: status < 400, status, url, text: async () => body } as unknown as Response
}

describe('resolveGoogleNewsUrl', () => {
  it('leaves a non-Google URL alone without a request', async () => {
    const fetch = async () => { throw new Error('must not be called') }
    expect(await resolveGoogleNewsUrl('https://www.pionline.com/x', { fetch })).toEqual({ url: 'https://www.pionline.com/x', method: 'not-google' })
  })
  it('decodes an old-style id without a request', async () => {
    const fetch = async () => { throw new Error('must not be called') }
    const url = `https://news.google.com/rss/articles/${oldStyleId('https://www.buyoutsinsider.com/s/')}?oc=5`
    expect(await resolveGoogleNewsUrl(url, { fetch })).toEqual({ url: 'https://www.buyoutsinsider.com/s/', method: 'payload' })
  })
  it('asks batchexecute with the page signature and keeps the answer', async () => {
    const calls: string[] = []
    const fetch = async (input: string, init?: RequestInit) => {
      calls.push(input)
      if (input.endsWith('/batchexecute')) {
        expect(String(init?.body)).toContain('garturlreq')
        return page(input, `)]}'\n[["wrb.fr","Fbv4je","[\\"garturlres\\",\\"https://amwatch.com/story\\",1]",null,null,null,"generic"]]`)
      }
      return page(input, '<div data-n-a-sg="SIG" data-n-a-ts="42"></div>')
    }
    expect(await resolveGoogleNewsUrl(REAL[2].url, { fetch })).toEqual({ url: 'https://amwatch.com/story', method: 'batchexecute' })
    expect(calls).toHaveLength(2)
  })
  it('falls back to the page when batchexecute fails, and to the input when nothing works', async () => {
    const fetch = async (input: string) => {
      if (input.endsWith('/batchexecute')) return page(input, 'nope', 400)
      return page(input, '<div data-n-a-sg="SIG" data-n-a-ts="42"></div><a href="https://amwatch.com/page">Open</a>')
    }
    expect(await resolveGoogleNewsUrl(REAL[2].url, { fetch })).toEqual({ url: 'https://amwatch.com/page', method: 'html' })
    const dead = async () => { throw new Error('offline') }
    expect(await resolveGoogleNewsUrl(REAL[2].url, { fetch: dead })).toEqual({ url: REAL[2].url, method: 'unresolved', detail: 'error Error' })
  })
  it('says when Google refuses, without asking batchexecute', async () => {
    const calls: string[] = []
    const fetch = async (input: string) => {
      calls.push(input)
      return page(input, 'Too many requests', 429)
    }
    expect(await resolveGoogleNewsUrl(REAL[2].url, { fetch })).toEqual({ url: REAL[2].url, method: 'unresolved', detail: 'page 429', refused: true })
    expect(calls).toHaveLength(1)
  })
  it('flags a refused batchexecute and fetches the rss page form when asked', async () => {
    const calls: string[] = []
    const fetch = async (input: string) => {
      calls.push(input)
      if (input.endsWith('/batchexecute')) return page(input, '', 429)
      return page(input, '<div data-n-a-sg="SIG" data-n-a-ts="42"></div>')
    }
    expect(await resolveGoogleNewsUrl(REAL[2].url, { fetch, pageForm: 'rss' })).toEqual({
      url: REAL[2].url, method: 'unresolved', detail: 'batchexecute 429', refused: true,
    })
    expect(calls[0]).toMatch(/^https:\/\/news\.google\.com\/rss\/articles\//)
  })
})

// Against Google itself: `GOOGLE_NEWS_LIVE=1 npx vitest run google-news-url`.
describe.skipIf(!process.env.GOOGLE_NEWS_LIVE)('resolveGoogleNewsUrl, live', () => {
  it('resolves three links stored in news_items on 2026-10-16', async () => {
    for (const r of REAL) {
      const got = await resolveGoogleNewsUrl(r.url)
      expect(got.method).toBe('batchexecute')
      expect(new URL(got.url).hostname).toBe(r.host)
    }
  }, 60_000)
})
