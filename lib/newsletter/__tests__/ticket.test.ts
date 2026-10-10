import { describe, it, expect } from 'vitest'
import { makeTicket, readTicket } from '../ticket'

const ID = '4a02902d-ba12-4dcb-9ea0-d9fff1bbc5c7'
const KEY = 'a-secret-only-the-server-holds'
const NOW = Date.UTC(2026, 9, 10, 15)

describe('a ticket to say what you follow', () => {
  it('names its subscriber and when it was made, for half an hour', () => {
    const t = makeTicket(ID, NOW, KEY)!
    expect(readTicket(t, NOW + 60_000, KEY)).toEqual({ id: ID, issuedAt: NOW })
    expect(readTicket(t, NOW + 29 * 60_000, KEY)?.id).toBe(ID)
    expect(readTicket(t, NOW + 31 * 60_000, KEY)).toBeNull()
  })
  it('is refused when it has been altered, signed with another secret, or is not a ticket at all', () => {
    const t = makeTicket(ID, NOW, KEY)!
    const [id, expires, mark] = t.split('.')
    expect(readTicket(`${id.replace('4a', '5b')}.${expires}.${mark}`, NOW, KEY)).toBeNull()
    expect(readTicket(`${id}.${Number(expires) + 86_400_000}.${mark}`, NOW, KEY)).toBeNull()
    expect(readTicket(t, NOW, 'another-secret')).toBeNull()
    for (const junk of ['', 'abc', `${id}.${expires}`, `${t}.extra`, null, 42, ID]) expect(readTicket(junk, NOW, KEY)).toBeNull()
  })
  it('is not made without a secret or for something that is not a subscriber id', () => {
    expect(makeTicket(ID, NOW, '')).toBeNull()
    expect(makeTicket('not-an-id', NOW, KEY)).toBeNull()
    expect(readTicket(makeTicket(ID, NOW, KEY), NOW, '')).toBeNull()
  })
})
