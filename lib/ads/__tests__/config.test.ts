import { describe, expect, it } from 'vitest'
import { adSlotId, adsAllowedOn, adsClient, adsMode, adsScriptSrc, adsTxt, type AdsEnv } from '../config'
import { adsHeld, holdAds, releaseAds, whenAdsClear } from '../hold'

const CLIENT = 'ca-pub-1234567890123456'
const slots = { story: '1111111111', front: '2222222222', events: '3333333333' }

describe('mode gating', () => {
  it('is off by default and with no client', () => {
    expect(adsMode({})).toBe('off')
    expect(adsMode({ mode: 'live' })).toBe('off')
    expect(adsMode({ client: CLIENT })).toBe('off')
    expect(adsMode({ client: CLIENT, mode: 'nonsense' })).toBe('off')
  })

  it('refuses a malformed client ID', () => {
    expect(adsClient({ client: 'pub-1234567890123456' })).toBeNull()
    expect(adsMode({ client: 'ca-pub-XXXX', mode: 'live' })).toBe('off')
  })

  it('reads verify and live, trimmed and in any case', () => {
    expect(adsMode({ client: CLIENT, mode: 'verify' })).toBe('verify')
    expect(adsMode({ client: ` ${CLIENT} `, mode: ' LIVE ' })).toBe('live')
  })

  it('renders slots only in live mode, only with an ID', () => {
    const verify: AdsEnv = { client: CLIENT, mode: 'verify', slots }
    const live: AdsEnv = { client: CLIENT, mode: 'live', slots: { story: '1111111111', front: '', events: 'abc' } }
    expect(adSlotId('story', verify)).toBeNull()
    expect(adSlotId('story', live)).toBe('1111111111')
    expect(adSlotId('front', live)).toBeNull()
    expect(adSlotId('events', live)).toBeNull()
    expect(adSlotId('story', { mode: 'live', slots })).toBeNull()
  })

  it('loads the script in verify and live, never off', () => {
    expect(adsScriptSrc({ client: CLIENT })).toBeNull()
    expect(adsScriptSrc({ client: CLIENT, mode: 'verify' })).toBe(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`,
    )
  })

  it('the build default is off (no AdSense variables in the test environment)', () => {
    expect(adsMode()).toBe('off')
    expect(adsTxt()).toBeNull()
  })
})

describe('ads.txt', () => {
  it("is Google's one line when on", () => {
    expect(adsTxt({ client: CLIENT, mode: 'verify' })).toBe('google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n')
    expect(adsTxt({ client: CLIENT, mode: 'live' })).toBe('google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n')
  })

  it('is nothing when off', () => {
    expect(adsTxt({ client: CLIENT, mode: 'off' })).toBeNull()
    expect(adsTxt({ mode: 'live' })).toBeNull()
  })
})

describe('pages without ads', () => {
  it.each([
    '/sponsor',
    '/sponsor/decide',
    '/join',
    '/submit',
    '/submit/confirm',
    '/events/submit',
    '/preferences',
    '/unsubscribe',
    '/newsletter/unsubscribe',
    '/newsletter/confirm',
    '/privacy',
    '/privacy/extension',
    '/terms',
    '/desk',
    '/admin/x',
    '/api/news',
  ])('%s carries none', (p) => {
    expect(adsAllowedOn(p)).toBe(false)
  })

  it.each(['/', '/news/private-equity', '/news/private-equity/deals', '/story/abc-123', '/events', '/events/superreturn-boston', '/joined-up'])(
    '%s may carry one',
    (p) => {
      expect(adsAllowedOn(p)).toBe(true)
    },
  )

  it('no path, no ad', () => {
    expect(adsAllowedOn(null)).toBe(false)
  })
})

describe('takeover hold', () => {
  it('runs at once when clear, waits while held', () => {
    let ran = 0
    whenAdsClear(() => ran++)
    expect(ran).toBe(1)
    holdAds()
    expect(adsHeld()).toBe(true)
    whenAdsClear(() => ran++)
    const cancel = whenAdsClear(() => (ran += 100))
    cancel()
    expect(ran).toBe(1)
    releaseAds()
    expect(ran).toBe(2)
    expect(adsHeld()).toBe(false)
  })
})

describe('/ads.txt route', () => {
  it('404s while AdSense is off', async () => {
    const { GET } = await import('@/app/ads.txt/route')
    const res = GET()
    expect(res.status).toBe(404)
  })
})
