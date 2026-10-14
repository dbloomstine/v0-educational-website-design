import { describe, expect, it } from 'vitest'
import { asksToStop, handleWebhook, headerValue, messageIdsIn, ownWords, type MsgRef, type WebhookDeps } from '../inbound'
import { verifySvixSignature, signSvix } from '@/lib/resend/webhook-signature'

const pitch: MsgRef = { id: 'm1', parent_id: null, email: 'jane@acme.com', company: 'Acme', program: 'sponsor_pitch', subject: 'A FundOps Daily ad for Acme' }

function fakeDeps(over: Partial<WebhookDeps> = {}) {
  const log: Record<string, unknown[]> = { stored: [], replied: [], suppressed: [], halted: [], danny: [], events: [], marked: [], forwarded: [] }
  const storedIds = new Set<string>()
  const events = new Set<string>()
  const deps: WebhookDeps = {
    fetchReceived: async () => ({ text: 'Sounds interesting, send me dates.\n\nOn Wed, Danny wrote:\n> Hi Jane', html: null, headers: { 'In-Reply-To': '<m1@fundopshq.com>' }, messageId: '<x@mail.acme.com>', error: null }),
    findByMessageIds: async (ids) => (ids.includes('<m1@fundopshq.com>') ? pitch : null),
    findLatestSentTo: async (email) => (email === 'jane@acme.com' ? pitch : null),
    findByResendId: async (id) => (id === 'resend-m1' ? pitch : null),
    storeReply: async (row) => {
      if (storedIds.has(row.resend_email_id)) return { inserted: false, id: null }
      storedIds.add(row.resend_email_id)
      log.stored.push(row)
      return { inserted: true, id: `r-${row.resend_email_id}` }
    },
    markReplied: async (msg) => { log.replied.push(msg.id) },
    markForwarded: async (id, err) => { log.forwarded.push([id, err]) },
    recordEvent: async (row) => {
      const k = `${row.resend_email_id}:${row.type}`
      if (events.has(k)) return false
      events.add(k)
      log.events.push(row)
      return true
    },
    markMessage: async (id, fields) => { log.marked.push([id, fields]) },
    suppress: async (email, reason) => { log.suppressed.push([email, reason]) },
    halt: async (reason) => { log.halted.push(reason) },
    sendToDanny: async (to, subject, text, replyTo) => { log.danny.push({ to, subject, text, replyTo }) },
    ...over,
  }
  return { deps, log }
}

const received = (over: Record<string, unknown> = {}) => ({
  type: 'email.received',
  data: { email_id: 'in-1', from: 'Jane Doe <jane@acme.com>', to: ['danny@reply.fundopshq.com'], subject: 'Re: A FundOps Daily ad for Acme', created_at: '2026-10-15T15:00:00Z', ...over },
})

describe('replies', () => {
  it('stores the reply, links it by In-Reply-To, closes the thread and forwards a copy to Gmail', async () => {
    const { deps, log } = fakeDeps()
    const r = await handleWebhook(received(), deps)
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ matched: 'm1', method: 'in_reply_to', stop: false, forwarded: true })
    expect(log.stored).toHaveLength(1)
    expect(log.stored[0]).toMatchObject({ message_id: 'm1', from_address: 'jane@acme.com', in_reply_to: '<m1@fundopshq.com>' })
    expect(log.replied).toEqual(['m1'])
    expect(log.suppressed).toEqual([])
    const fwd = log.danny[0] as { to: string; subject: string; text: string; replyTo: string }
    expect(fwd.to).toBe('dbloomstine@gmail.com')
    expect(fwd.replyTo).toBe('jane@acme.com')
    expect(fwd.text).toContain('From: Jane Doe <jane@acme.com>')
    expect(fwd.text).toContain('Sounds interesting, send me dates.')
  })

  it('falls back to the sender when there are no threading headers', async () => {
    const { deps } = fakeDeps({ fetchReceived: async () => ({ text: 'Thanks!', html: null, headers: {}, messageId: null, error: null }) })
    const r = await handleWebhook(received(), deps)
    expect(r.body).toMatchObject({ matched: 'm1', method: 'sender' })
  })

  it('stores and forwards a reply that matches nothing', async () => {
    const { deps, log } = fakeDeps({ fetchReceived: async () => ({ text: 'Hello', html: null, headers: {}, messageId: null, error: null }) })
    const r = await handleWebhook(received({ from: 'stranger@x.com' }), deps)
    expect(r.body).toMatchObject({ matched: null })
    expect(log.stored).toHaveLength(1)
    expect(log.danny).toHaveLength(1)
    expect(log.replied).toEqual([])
  })

  it('suppresses someone who asks to stop, or writes to the unsubscribe mailbox', async () => {
    const a = fakeDeps({ fetchReceived: async () => ({ text: 'Unsubscribe please', html: null, headers: {}, messageId: null, error: null }) })
    await handleWebhook(received(), a.deps)
    expect(a.log.suppressed).toEqual([['jane@acme.com', 'asked_to_stop']])
    const b = fakeDeps({ fetchReceived: async () => ({ text: '', html: null, headers: {}, messageId: null, error: null }) })
    await handleWebhook(received({ to: ['unsubscribe@reply.fundopshq.com'], subject: 'unsubscribe-abc' }), b.deps)
    expect(b.log.suppressed).toEqual([['jane@acme.com', 'unsubscribed']])
  })

  it('handles a Resend retry once', async () => {
    const { deps, log } = fakeDeps()
    await handleWebhook(received(), deps)
    const again = await handleWebhook(received(), deps)
    expect(again.body).toMatchObject({ duplicate: 'in-1' })
    expect(log.danny).toHaveLength(1)
  })

  it('leaves mail for other addresses alone (events@ has its own route)', async () => {
    const { deps, log } = fakeDeps()
    const r = await handleWebhook(received({ to: ['events@fundopshq.com'] }), deps)
    expect(r.body).toMatchObject({ ignored: 'not for the reply domain' })
    expect(log.stored).toHaveLength(0)
  })

  it('reads the person’s own words, not the quote', () => {
    expect(ownWords('Yes please\n\nOn Tue, Oct 14, 2026 at 9:00 AM Danny wrote:\n> stop')).toBe('Yes please')
    expect(asksToStop('Stop.\n> Hi')).toBe(true)
    expect(asksToStop('Please remove me from your list')).toBe(true)
    expect(asksToStop("I'd love to hear more, don't stop")).toBe(false)
    expect(asksToStop('Thanks\n> unsubscribe')).toBe(false)
  })

  it('reads threading headers whatever their case', () => {
    expect(headerValue({ 'in-reply-to': '<a@b>' }, 'In-Reply-To')).toBe('<a@b>')
    expect(messageIdsIn('<a@b> <c@d>')).toEqual(['<a@b>', '<c@d>'])
  })
})

describe('bounces and complaints', () => {
  it('a bounce suppresses the address', async () => {
    const { deps, log } = fakeDeps()
    const r = await handleWebhook({ type: 'email.bounced', data: { email_id: 'resend-m1', bounce: { type: 'Permanent' } } }, deps)
    expect(r.body).toMatchObject({ bounced: 'jane@acme.com' })
    expect(log.suppressed).toEqual([['jane@acme.com', 'bounced']])
    expect(log.halted).toEqual([])
  })

  it('ANY spam complaint halts the program, suppresses the address and emails Danny', async () => {
    const { deps, log } = fakeDeps()
    const r = await handleWebhook({ type: 'email.complained', data: { email_id: 'resend-m1' } }, deps)
    expect(r.body).toMatchObject({ complained: 'jane@acme.com', halted: true })
    expect(log.halted).toHaveLength(1)
    expect(log.suppressed).toEqual([['jane@acme.com', 'complained']])
    const alert = log.danny[0] as { to: string; subject: string }
    expect(alert.to).toBe('dbloomstine@gmail.com')
    expect(alert.subject).toMatch(/stopped/i)
  })

  it('halts even when the alert email fails', async () => {
    const { deps, log } = fakeDeps({ sendToDanny: async () => { throw new Error('resend down') } })
    const r = await handleWebhook({ type: 'email.complained', data: { email_id: 'resend-m1' } }, deps)
    expect(r.status).toBe(200)
    expect(log.halted).toHaveLength(1)
  })

  it('ignores the newsletter’s own bounces and complaints', async () => {
    const { deps, log } = fakeDeps()
    await handleWebhook({ type: 'email.complained', data: { email_id: 'newsletter-123' } }, deps)
    expect(log.halted).toEqual([])
    expect(log.suppressed).toEqual([])
  })
})

describe('the webhook signature', () => {
  it('accepts a correctly signed body and rejects a tampered one', () => {
    const secret = `whsec_${Buffer.from('test-secret-key-0123456789').toString('base64')}`
    const body = JSON.stringify(received())
    const ts = 1_800_000_000
    const h = new Headers({ 'svix-id': 'msg_1', 'svix-timestamp': String(ts), 'svix-signature': signSvix(body, secret, 'msg_1', ts) })
    expect(verifySvixSignature(body, h, secret, ts).ok).toBe(true)
    expect(verifySvixSignature(`${body} `, h, secret, ts).ok).toBe(false)
    expect(verifySvixSignature(body, h, secret, ts + 3600).ok).toBe(false)
  })
})
