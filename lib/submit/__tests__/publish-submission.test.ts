// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  amountPhrase,
  buildSubmissionRow,
  publishedNotes,
  scrubContacts,
  submissionText,
  SUBMISSION_PUBLISH_COLUMNS,
  SUBMISSION_TEXT_NOTE,
  type SubmissionForPublish,
} from '../publish-submission'
import { hashString, normalizeUrl } from '@/lib/news/ingest-worker'
import { isFirmSubmission, isOwnSiteUrl, SUBMISSION_SOURCE_NAME } from '@/lib/news/submission-source'

const NOW = new Date('2026-10-22T15:00:00Z')
const ID = '0b6f2c1e-4a1d-4c8e-9f00-1234567890ab'

const base: SubmissionForPublish = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  status: 'pending',
  kind: 'fund_close',
  firm: 'Harbor Ridge Capital',
  firm_website: 'https://www.harborridge.com/',
  headline: 'Harbor Ridge Capital closes Fund III at $450 million hard cap',
  details: 'Harbor Ridge Capital held the final close of Harbor Ridge Fund III at its $450 million hard cap, above its $350 million target.',
  amount: 450_000_000,
  currency: 'USD',
  news_date: '2026-10-20',
  url: null,
  domain_match: true,
  published_news_item_id: null,
  review_notes: null,
}

const build = (over: Partial<SubmissionForPublish> = {}, opts: Partial<Parameters<typeof buildSubmissionRow>[1]> = {}) =>
  buildSubmissionRow({ ...base, ...over }, { id: ID, now: NOW, ...opts })

describe('buildSubmissionRow', () => {
  it('builds a pending manual row under the submission source, linked to its own story page', () => {
    const r = build()
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.row).toMatchObject({
      id: ID,
      title: base.headline,
      source_url: `https://fundopshq.com/story/${ID}`,
      source_name: SUBMISSION_SOURCE_NAME,
      published_date: '2026-10-20',
      classification_status: 'pending',
      source_type: 'manual',
      is_duplicate: false,
      processing_attempts: 0,
      enriched_at: NOW.toISOString(),
      enrichment_error: SUBMISSION_TEXT_NOTE,
    })
    expect(r.row.url_hash).toBe(hashString(normalizeUrl(r.row.source_url)))
    expect(r.row.content_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(r.warnings).toContain('no public announcement: the link is the story page itself')
  })

  it('gives the classifier the details and the form facts, in both text columns', () => {
    const r = build()
    if (!r.ok) throw new Error(r.error)
    expect(r.row.full_text).toBe(r.row.description)
    expect(r.row.full_text.startsWith(base.details!)).toBe(true)
    expect(r.row.full_text).toContain('Firm: Harbor Ridge Capital. Website: harborridge.com. News: fund close. Amount: 450 million USD. Date: 2026-10-20.')
  })

  it('links to the public announcement when the firm gave one', () => {
    const r = build({ url: 'https://www.harborridge.com/news/fund-iii-final-close' })
    if (!r.ok) throw new Error(r.error)
    expect(r.row.source_url).toBe('https://www.harborridge.com/news/fund-iii-final-close')
    expect(r.warnings.some((w) => w.startsWith('no public announcement'))).toBe(false)
  })

  it('gives each row its own url_hash (a fragment would not: normalizeUrl drops it)', () => {
    const a = build()
    const b = build({}, { id: '11111111-2222-4333-8444-555555555555' })
    if (!a.ok || !b.ok) throw new Error('build failed')
    expect(a.row.url_hash).not.toBe(b.row.url_hash)
    expect(normalizeUrl('https://fundopshq.com/submit#a')).toBe(normalizeUrl('https://fundopshq.com/submit#b'))
  })

  it('never carries the people or the contact', () => {
    const r = buildSubmissionRow(
      {
        ...base,
        // Fields the script never selects, passed anyway: none may reach the row.
        ...({ people: [{ name: 'Jane Partner', role: 'Partner' }], contact_name: 'Sam Sender', contact_email: 'sam@harborridge.com', contact_role: 'IR' } as object),
      } as SubmissionForPublish,
      { id: ID, now: NOW },
    )
    if (!r.ok) throw new Error(r.error)
    const all = JSON.stringify(r.row)
    for (const s of ['Jane Partner', 'Sam Sender', 'sam@harborridge.com']) expect(all).not.toContain(s)
    expect(SUBMISSION_PUBLISH_COLUMNS).not.toMatch(/people|contact|ip_hash/)
  })

  it('takes email addresses and phone numbers out of the details, and says so', () => {
    const r = build({ details: `${base.details} Contact ir@harborridge.com or +1 (212) 555-0100 for more.` })
    if (!r.ok) throw new Error(r.error)
    expect(r.row.full_text).not.toContain('ir@harborridge.com')
    expect(r.row.full_text).not.toContain('555-0100')
    expect(r.warnings).toContain('an email address or phone number was taken out of the details')
  })

  it('uses the desk’s headline, text and date when given', () => {
    const r = build({ news_date: '2025-01-01' }, { title: 'Harbor Ridge closes third fund on $450M', details: 'Harbor Ridge Capital closed its third fund on $450 million.', publishedDate: '2026-10-21' })
    if (!r.ok) throw new Error(r.error)
    expect(r.row.title).toBe('Harbor Ridge closes third fund on $450M')
    expect(r.row.full_text.startsWith('Harbor Ridge Capital closed its third fund')).toBe(true)
    expect(r.row.published_date).toBe('2026-10-21')
  })

  it('refuses what is not ready to publish', () => {
    expect(build({ status: 'unconfirmed' })).toMatchObject({ ok: false })
    expect(build({ status: 'approved' })).toMatchObject({ ok: false })
    expect(build({ published_news_item_id: ID })).toMatchObject({ ok: false })
    expect(build({}, { id: 'not-a-uuid' })).toMatchObject({ ok: false })
    expect(build({ details: 'too short' })).toMatchObject({ ok: false })
    expect(build({ headline: 'See https://spam.example for more' })).toMatchObject({ ok: false })
    expect(build({ news_date: null })).toMatchObject({ ok: false })
  })

  it('refuses news dated ahead of today or older than a feed item may be, unless the desk gives a date', () => {
    expect(build({ news_date: '2026-10-23' })).toMatchObject({ ok: false })
    expect(build({ news_date: '2026-09-01' })).toMatchObject({ ok: false })
    expect(build({ news_date: '2026-09-22' })).toMatchObject({ ok: true })
    expect(build({ news_date: '2026-09-01' }, { publishedDate: '2026-09-01' })).toMatchObject({ ok: true })
  })

  it('warns when the email domain is not the firm’s, or the link is unusable', () => {
    const r = build({ domain_match: false, url: 'not a url' })
    if (!r.ok) throw new Error(r.error)
    expect(r.warnings).toContain("the sender's email domain is not the firm website's")
    expect(r.row.source_url).toBe(`https://fundopshq.com/story/${ID}`)
  })
})

describe('the parts', () => {
  it('amountPhrase reads amounts as the classifier does', () => {
    expect(amountPhrase(450_000_000, 'USD')).toBe('450 million USD')
    expect(amountPhrase('1200000000', 'eur')).toBe('1.2 billion EUR')
    expect(amountPhrase(750_000, null)).toBe('750,000 USD')
    expect(amountPhrase(null, 'USD')).toBeNull()
  })

  it('scrubContacts leaves dates and amounts alone', () => {
    expect(scrubContacts('Closed on 2026-10-22 at $450,000,000.')).toBe('Closed on 2026-10-22 at $450,000,000.')
    expect(scrubContacts('Call 212.555.0100 or email a@b.com.')).toBe('Call or email.')
  })

  it('submissionText leaves out a kind of "other" and a missing amount', () => {
    const t = submissionText({ kind: 'other', firm: 'Acme', firm_website: null, amount: null, currency: null, url: null }, 'Acme opened a Toronto office.', '2026-10-20')
    expect(t).toBe('Acme opened a Toronto office.\n\nFirm: Acme. Date: 2026-10-20.')
  })

  it('publishedNotes keeps what was there and adds a dated line', () => {
    expect(publishedNotes(null, 'checked the release', ID, NOW)).toBe(`2026-10-22 published as news_items ${ID}: checked the release`)
    expect(publishedNotes('called the firm', 'ok', ID, NOW)).toBe(`called the firm\n2026-10-22 published as news_items ${ID}: ok`)
  })

  it('submission-source knows its own rows and its own site', () => {
    expect(isFirmSubmission(SUBMISSION_SOURCE_NAME)).toBe(true)
    expect(isFirmSubmission('PR Newswire')).toBe(false)
    expect(isOwnSiteUrl(`https://fundopshq.com/story/${ID}`)).toBe(true)
    expect(isOwnSiteUrl('https://www.fundopshq.com/x')).toBe(true)
    expect(isOwnSiteUrl('https://harborridge.com/news')).toBe(false)
    expect(isOwnSiteUrl(null)).toBe(false)
  })
})

describe('a published submission on the site', () => {
  it('becomes a story under its own source, once the classifier has typed the row', async () => {
    const { buildStories } = await import('@/lib/news/stories')
    const r = build()
    if (!r.ok) throw new Error(r.error)
    // What the :30 classify run writes back (classify-articles.ts), in short.
    const classified = {
      ...r.row,
      created_at: '2026-10-22T15:00:00Z',
      classification_status: 'complete',
      article_type: 'fund_close',
      event_type: 'fund_close',
      fund_categories: ['PE'],
      is_high_signal: true,
      relevance_score: 0.8,
      tldr: 'Harbor Ridge Capital closed Harbor Ridge Fund III at its $450 million hard cap.',
      entities_raw: [{ name: 'Harbor Ridge Capital', type: 'firm', role: null, confidence: 0.95 }],
      extracted_data: { firm_name: 'Harbor Ridge Capital', fund_name: 'Harbor Ridge Fund III', fund_size_usd_millions: 450, close_type: 'final_close' },
    }
    const [story] = buildStories([classified])
    expect(story).toBeDefined()
    expect(story.source).toBe(SUBMISSION_SOURCE_NAME)
    expect(story.url).toBe(`https://fundopshq.com/story/${ID}`)
    expect(story.kind).toBe('fundraising')
    expect(story.sizeUsdM).toBe(450)
  })
})
