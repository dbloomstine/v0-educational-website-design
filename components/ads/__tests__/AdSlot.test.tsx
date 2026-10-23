import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'

let path = '/story/abc'
vi.mock('next/navigation', () => ({ usePathname: () => path }))

async function load(env: Record<string, string>) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  const { AdSlot } = await import('../AdSlot')
  const hold = await import('@/lib/ads/hold')
  return { AdSlot, hold }
}

const LIVE = {
  NEXT_PUBLIC_ADSENSE_CLIENT: 'ca-pub-1234567890123456',
  NEXT_PUBLIC_ADSENSE_MODE: 'live',
  NEXT_PUBLIC_ADSENSE_SLOT_STORY: '1111111111',
}

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.useRealTimers()
  delete (window as { adsbygoogle?: unknown[] }).adsbygoogle
  path = '/story/abc'
})

describe('AdSlot', () => {
  it('renders nothing while off', async () => {
    const { AdSlot } = await load({})
    const { container } = render(<AdSlot placement="story" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing in verify mode', async () => {
    const { AdSlot } = await load({ ...LIVE, NEXT_PUBLIC_ADSENSE_MODE: 'verify' })
    const { container } = render(<AdSlot placement="story" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing for a placement without its slot ID', async () => {
    const { AdSlot } = await load(LIVE)
    const { container } = render(<AdSlot placement="front" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders a labelled unit when live, and requests it after the takeover lets go', async () => {
    vi.useFakeTimers()
    const { AdSlot, hold } = await load(LIVE)
    hold.holdAds()
    const { getByText, container } = render(<AdSlot placement="story" />)
    expect(getByText('Advertisement')).toBeTruthy()
    const ins = container.querySelector('ins.adsbygoogle')!
    expect(ins.getAttribute('data-ad-client')).toBe('ca-pub-1234567890123456')
    expect(ins.getAttribute('data-ad-slot')).toBe('1111111111')
    act(() => vi.runAllTimers())
    expect((window as { adsbygoogle?: unknown[] }).adsbygoogle).toBeUndefined()
    act(() => hold.releaseAds())
    expect((window as { adsbygoogle?: unknown[] }).adsbygoogle).toHaveLength(1)
  })

  it('never renders on a no-ads page, even when live', async () => {
    path = '/sponsor'
    const { AdSlot } = await load(LIVE)
    const { container } = render(<AdSlot placement="story" />)
    expect(container.innerHTML).toBe('')
  })
})
