// @vitest-environment node
/**
 * The subscribe route's handling of where a signup came from: stored on a
 * first signup, never overwritten for an address already on the list, bad
 * values dropped, and the signup kept when the signup_* columns do not exist
 * yet.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type Row = Record<string, unknown>
type Err = { code?: string; message: string; details?: string } | null

let existing: Row | null
let inserts: Row[]
let updates: Row[]
/** Makes an insert fail; return null to let it through. */
let failInsert: (row: Row) => Err

function from() {
  let mode: 'select' | 'insert' | 'update' = 'select'
  let row: Row = {}
  const b = {
    select() { return b },
    eq() { return b },
    insert(r: Row) { mode = 'insert'; row = r; return b },
    update(r: Row) { mode = 'update'; row = r; return b },
    single() {
      if (mode === 'select') return Promise.resolve({ data: existing, error: null })
      inserts.push(row)
      const error = failInsert(row)
      return Promise.resolve(error ? { data: null, error } : { data: { unsubscribe_token: 'tok' }, error: null })
    },
    then(resolve: (v: unknown) => unknown) {
      if (mode === 'update') updates.push(row)
      return Promise.resolve({ error: null }).then(resolve)
    },
  }
  return b
}

vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: () => ({ from }) }))

import { POST } from '../route'

function post(body: unknown) {
  return POST(new Request('http://localhost/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify(body) }))
}

const missingColumn: Err = {
  code: 'PGRST204',
  message: "Could not find the 'signup_source' column of 'newsletter_subscribers' in the schema cache",
}

beforeEach(() => {
  existing = null
  inserts = []
  updates = []
  failInsert = () => null
  vi.stubEnv('RESEND_API_KEY', '')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('first signup', () => {
  it('stores the source on the new row', async () => {
    const res = await post({
      email: 'New@Example.com',
      attribution: { source: 'tiktok', medium: 'bio', campaign: 'launch', path: '/news/private-equity' },
    })
    expect(res.status).toBe(200)
    expect(inserts).toEqual([
      {
        email: 'new@example.com',
        status: 'confirmed',
        confirmed_at: expect.any(String),
        signup_source: 'tiktok',
        signup_medium: 'bio',
        signup_campaign: 'launch',
        signup_landing_path: '/news/private-equity',
      },
    ])
  })

  it('drops values that fail validation and stores the rest', async () => {
    await post({
      email: 'a@example.com',
      attribution: { source: 'linkedin', medium: '<script>', campaign: 'x'.repeat(41), path: '/a b' },
    })
    expect(inserts[0]).toMatchObject({ signup_source: 'linkedin' })
    expect(inserts[0]).not.toHaveProperty('signup_medium')
    expect(inserts[0]).not.toHaveProperty('signup_campaign')
    expect(inserts[0]).not.toHaveProperty('signup_landing_path')
  })

  it('inserts exactly as before when the request carries no source', async () => {
    const res = await post({ email: 'a@example.com' })
    expect(res.status).toBe(200)
    expect(inserts).toEqual([{ email: 'a@example.com', status: 'confirmed', confirmed_at: expect.any(String) }])
  })
})

describe('an address already on the list', () => {
  it('leaves a confirmed subscriber untouched', async () => {
    existing = { id: 1, status: 'confirmed', unsubscribe_token: 't' }
    const res = await post({ email: 'a@example.com', attribution: { source: 'tiktok' } })
    expect((await res.json()).message).toBe('Already subscribed')
    expect(inserts).toEqual([])
    expect(updates).toEqual([])
  })

  it('does not overwrite the original source when someone re-subscribes', async () => {
    existing = { id: 1, status: 'unsubscribed', unsubscribe_token: 't', signup_source: 'linkedin' }
    const res = await post({ email: 'a@example.com', attribution: { source: 'tiktok', medium: 'bio', path: '/' } })
    expect(res.status).toBe(200)
    expect(inserts).toEqual([])
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({ status: 'confirmed' })
    expect(Object.keys(updates[0]).filter((k) => k.startsWith('signup_'))).toEqual([])
  })
})

describe('before the migration is applied', () => {
  it('retries the insert without the signup columns instead of losing the signup', async () => {
    failInsert = (row) => ('signup_source' in row ? missingColumn : null)
    const res = await post({ email: 'a@example.com', attribution: { source: 'tiktok', path: '/' } })
    expect(res.status).toBe(200)
    expect(inserts).toHaveLength(2)
    expect(inserts[0]).toHaveProperty('signup_source', 'tiktok')
    expect(inserts[1]).toEqual({ email: 'a@example.com', status: 'confirmed', confirmed_at: expect.any(String) })
  })

  it('recognises the Postgres form of the same failure', async () => {
    failInsert = (row) => ('signup_medium' in row ? { code: '42703', message: 'column "signup_medium" of relation "newsletter_subscribers" does not exist' } : null)
    const res = await post({ email: 'a@example.com', attribution: { source: 'x', medium: 'bio' } })
    expect(res.status).toBe(200)
    expect(inserts).toHaveLength(2)
  })

  it('does not retry for an unrelated failure', async () => {
    failInsert = () => ({ code: '23505', message: 'duplicate key value violates unique constraint', details: 'Key (email)=(a@example.com) already exists.' })
    const res = await post({ email: 'a@example.com', attribution: { source: 'tiktok' } })
    expect(res.status).toBe(500)
    expect(inserts).toHaveLength(1)
  })

  it('gives up with an error if the plain insert fails too, without logging the address', async () => {
    failInsert = (row) => ('signup_source' in row ? missingColumn : { code: '08006', message: 'connection failure', details: 'for a@example.com' })
    const res = await post({ email: 'a@example.com', attribution: { source: 'tiktok' } })
    expect(res.status).toBe(500)
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).not.toContain('a@example.com')
  })
})
