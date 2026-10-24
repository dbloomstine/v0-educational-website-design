import { describe, expect, it } from 'vitest'
import { canClaim, claimKind, emailLooksLikeName, readSession, signSession, verifySession } from '../claim'
import { completeness, DESCRIPTION_MIN } from '../completeness'
import { isLikelyHuman, normalizeMissQuery, nyDay, previousMonth, shouldCountView, viewSummary } from '../views'
import { carryOver, moveCandidates, nameKey, type MoveSide } from '../moves'
import { badgeSnippet, badgeSvg, badgeWords } from '../badge'
import {
  claimConfirmedEmail,
  editsLiveEmail,
  editsNotAcceptedEmail,
  moveEmail,
  otherClaimEmail,
  requestResolvedEmail,
  signInEmail,
  statsEmail,
  statsEmailEnabled,
  suggestionResolvedEmail,
} from '../owner-mail'
import { validateSuggestion } from '../suggest'
import { CATEGORIES } from '../taxonomy'

const PERSON = '11111111-2222-4333-8444-555555555555'
const CLAIM = '99999999-8888-4777-8666-555555555555'
const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
const RANK_WORDS = /\b(top|best|leading|ranked|rank|#1|award|elite|premier|stars?)\b/i

describe('the edit session (tokens)', () => {
  const t = 1_800_000_000_000
  it('carries the claim it came from, and still reads an older session without one', () => {
    const s = signSession(PERSON, t, 'k', CLAIM)!
    expect(s.split('.')).toHaveLength(4)
    expect(readSession(s, t + 1000, 'k')).toEqual({ personId: PERSON, claimId: CLAIM })
    expect(verifySession(s, t + 1000, 'k')).toBe(PERSON)
    const old = signSession(PERSON, t, 'k')!
    expect(readSession(old, t + 1000, 'k')).toEqual({ personId: PERSON, claimId: null })
  })
  it('refuses a swapped claim id, another key, and an expired session', () => {
    const s = signSession(PERSON, t, 'k', CLAIM)!
    const swapped = s.replace(CLAIM, '00000000-8888-4777-8666-555555555555')
    expect(readSession(swapped, t + 1000, 'k')).toBeNull()
    expect(readSession(s, t + 1000, 'other')).toBeNull()
    expect(readSession(s, t + 25 * 3_600_000, 'k')).toBeNull()
    expect(readSession('a.b.c.d.e', t, 'k')).toBeNull()
  })
  it('prefers the dedicated session secret', () => {
    process.env.DIRECTORY_SESSION_SECRET = 'dedicated'
    try {
      const s = signSession(PERSON)!
      expect(verifySession(s, Date.now(), 'dedicated')).toBe(PERSON)
    } finally {
      delete process.env.DIRECTORY_SESSION_SECRET
    }
  })
})

describe('claims and sign-ins', () => {
  it('a confirmed address coming back is a sign-in; any other address is a claim', () => {
    const earlier = [
      { email: 'Jane.Smith@kirkland.com', confirmed_at: '2026-10-20T00:00:00Z' },
      { email: 'assistant@kirkland.com', confirmed_at: null },
    ]
    expect(claimKind('jane.smith@kirkland.com', earlier)).toBe('signin')
    expect(claimKind('assistant@kirkland.com', earlier)).toBe('claim')
    expect(claimKind('jane.smith@kirkland.com', [])).toBe('claim')
  })
  it('only a published profile, or one its owner hid, can be claimed', () => {
    expect(canClaim({ status: 'published' })).toBe(true)
    expect(canClaim({ status: 'hidden', hidden_by: 'owner' })).toBe(true)
    expect(canClaim({ status: 'hidden', hidden_by: 'desk' })).toBe(false)
    expect(canClaim({ status: 'hidden', hidden_by: 'request' })).toBe(false)
    expect(canClaim({ status: 'review' })).toBe(false)
    expect(canClaim({ status: 'removed' })).toBe(false)
  })
  it('flags an address that does not look like the person', () => {
    expect(emailLooksLikeName('jsmith@kirkland.com', 'Jane Smith')).toBe(true)
    expect(emailLooksLikeName('jane.smith@kirkland.com', 'Jane A. Smith, Jr.')).toBe(true)
    expect(emailLooksLikeName('jeff@kirkland.com', 'Jeffrey (Jeff) Misher')).toBe(true)
    expect(emailLooksLikeName('marketing@kirkland.com', 'Jane Smith')).toBe(false)
  })
})

describe('the completeness meter', () => {
  it('counts the six things a claimer can add', () => {
    expect(completeness({}).done).toBe(0)
    expect(completeness({}).total).toBe(6)
    const full = completeness({
      headline: 'Forms first-time funds',
      description: 'x'.repeat(DESCRIPTION_MIN),
      photo_url: 'https://example.com/p.jpg',
      contact_url: 'https://example.com/me',
      practice_areas: ['fund_formation'],
      notable: [{ text: 'Fund counsel to Example Fund III', year: 2025 }],
    })
    expect(full).toMatchObject({ done: 6, percent: 100 })
  })
  it('a short description, blank strings and empty matters do not count; an uploaded photo does', () => {
    const c = completeness({ headline: '  ', description: 'Short.', notable: [{ text: ' ', year: null }], photo_data: 'data:image/png;base64,AAAA' })
    expect(c.done).toBe(1)
    expect(c.items.find((i) => i.id === 'photo')?.done).toBe(true)
    expect(c.percent).toBe(17)
  })
})

describe('counting views', () => {
  const base = { userAgent: CHROME, fetchSite: 'same-origin', prefetch: false, sessionPersonId: null, personId: PERSON }
  it('counts a browser and leaves out bots, scripts and previews', () => {
    expect(isLikelyHuman(CHROME)).toBe(true)
    expect(isLikelyHuman('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(false)
    expect(isLikelyHuman('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)')).toBe(false)
    expect(isLikelyHuman('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36')).toBe(false)
    expect(isLikelyHuman('LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)')).toBe(false)
    expect(isLikelyHuman('curl/8.4.0')).toBe(false)
    expect(isLikelyHuman('')).toBe(false)
    expect(isLikelyHuman(null)).toBe(false)
  })
  it('never counts a prefetch, a post from another site, the owner, or a malformed id', () => {
    expect(shouldCountView(base)).toBe(true)
    expect(shouldCountView({ ...base, fetchSite: null })).toBe(true)
    expect(shouldCountView({ ...base, prefetch: true })).toBe(false)
    expect(shouldCountView({ ...base, fetchSite: 'cross-site' })).toBe(false)
    expect(shouldCountView({ ...base, sessionPersonId: PERSON.toUpperCase() })).toBe(false)
    expect(shouldCountView({ ...base, sessionPersonId: CLAIM })).toBe(true)
    expect(shouldCountView({ ...base, personId: 'not-a-uuid' })).toBe(false)
  })
  it('sums the daily rows into 7 and 30 days, this month and last', () => {
    const now = new Date('2026-11-10T15:00:00Z')
    expect(nyDay(now)).toBe('2026-11-10')
    const v = viewSummary(
      [
        { day: '2026-11-10', views: 2 },
        { day: '2026-11-04', views: 3 },
        { day: '2026-11-03', views: 5 },
        { day: '2026-10-20', views: 7 },
        { day: '2026-09-01', views: 11 },
        { day: '2026-11-11', views: 100 }, // tomorrow: never counted
      ],
      now,
    )
    expect(v).toEqual({ last7: 5, last30: 17, thisMonth: 10, lastMonth: 7, total: 28, since: '2026-09-01' })
    expect(viewSummary([], now)).toMatchObject({ total: 0, since: null })
  })
  it('names the month just ended, across a new year', () => {
    expect(previousMonth(new Date('2026-11-02T12:00:00Z'))).toEqual({ from: '2026-10-01', to: '2026-10-31', name: 'October 2026' })
    expect(previousMonth(new Date('2027-01-05T12:00:00Z'))).toEqual({ from: '2026-12-01', to: '2026-12-31', name: 'December 2026' })
    expect(previousMonth(new Date('2028-03-01T12:00:00Z')).to).toBe('2028-02-29')
  })
  it('logs an empty search only as a short, plain query; never an address or a number', () => {
    expect(normalizeMissQuery('  Ropes   & GRAY  ')).toBe('ropes & gray')
    expect(normalizeMissQuery('O’Brien')).toBe('o brien')
    expect(normalizeMissQuery('jane@firm.com')).toBeNull()
    expect(normalizeMissQuery('212 555 0100')).toBeNull()
    expect(normalizeMissQuery('a')).toBeNull()
    expect(normalizeMissQuery('12')).toBeNull()
    expect(normalizeMissQuery('x'.repeat(61))).toBeNull()
    expect(normalizeMissQuery(42)).toBeNull()
  })
})

describe('moves between firms', () => {
  const row = (o: Partial<MoveSide>): MoveSide => ({
    id: o.slug ?? 'x',
    slug: 'x',
    full_name: 'Jane Smith',
    firm_name: 'Old LLP',
    firm_domain: 'old.com',
    status: 'published',
    bar_admissions: [],
    education: [],
    practice_areas: [],
    claimed_at: null,
    missing_since: null,
    ...o,
  })
  it('keys a name without nickname, initials or suffix', () => {
    expect(nameKey('Jeffrey (Jeff) A. Misher, Jr.')).toBe('jeffrey misher')
    expect(nameKey('José  Núñez')).toBe('jose nunez')
  })
  it('pairs a claimed profile with the same person at another firm, only with a second shared fact', () => {
    const from = row({ slug: 'jane-smith-old', claimed_at: '2026-10-01', missing_since: '2026-11-01', bar_admissions: ['New York'], education: [{ school: 'Harvard Law School' }] })
    const to = row({ slug: 'jane-smith-new', firm_name: 'New LLP', firm_domain: 'new.com', status: 'review', bar_admissions: ['New York'], education: [{ school: 'Harvard Law School' }] })
    const namesake = row({ slug: 'jane-smith-other', firm_name: 'Other LLP', firm_domain: 'other.com' })
    const sameFirm = row({ slug: 'jane-smith-old-2', firm_domain: 'www.old.com', bar_admissions: ['New York'] })
    const found = moveCandidates([from, to, namesake, sameFirm])
    expect(found).toHaveLength(1)
    expect(found[0].from.slug).toBe('jane-smith-old')
    expect(found[0].to.slug).toBe('jane-smith-new')
    expect(found[0].evidence).toEqual(['1 bar admission', '1 school'])
  })
  it('ignores unclaimed and removed profiles', () => {
    const a = row({ slug: 'a', bar_admissions: ['NY'] })
    const b = row({ slug: 'b', firm_domain: 'new.com', bar_admissions: ['NY'] })
    expect(moveCandidates([a, b])).toEqual([])
    expect(moveCandidates([{ ...a, claimed_at: '2026-10-01' }, { ...b, status: 'removed' }])).toEqual([])
  })
  it('carries what was live (or the newer pending edits), never the old contact link', () => {
    const live = { headline: 'Forms funds', description: 'At Old LLP I form funds.', photo_url: 'https://x/p.jpg', contact_url: 'https://old.com/jane', claimed_practice_areas: ['fund_formation'], notable: [{ text: 'Fund III', year: 2024 }] }
    expect(carryOver(live)).toEqual({ headline: 'Forms funds', description: 'At Old LLP I form funds.', photo_url: 'https://x/p.jpg', contact_url: null, practice_areas: ['fund_formation'], notable: [{ text: 'Fund III', year: 2024 }] })
    const pending = { ...live, pending_edits: { headline: 'Newer', description: null, photo_url: null, contact_url: 'https://old.com/c', practice_areas: [], notable: [] } }
    expect(carryOver(pending)).toMatchObject({ headline: 'Newer', contact_url: null })
    expect(carryOver({ headline: null, description: null, photo_url: null, contact_url: 'https://old.com', claimed_practice_areas: null, notable: [] })).toBeNull()
  })
})

describe('the badge', () => {
  const lawyers = CATEGORIES.fund_lawyer
  it('states the listing, links only to the person’s own profile, and ranks nothing', () => {
    const html = badgeSnippet(lawyers, '/fund-lawyers/people/jane-smith')
    expect(badgeWords(lawyers)).toBe('Listed in the FundOpsHQ Directory of Fund Lawyers')
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
    expect(hrefs).toEqual(['https://fundopshq.com/fund-lawyers/people/jane-smith'])
    expect(html).toContain('alt="Listed in the FundOpsHQ Directory of Fund Lawyers"')
    expect(html).not.toMatch(RANK_WORDS)
    expect(badgeSvg(lawyers)).not.toMatch(RANK_WORDS)
    expect(badgeSvg(lawyers)).not.toMatch(/<script|href=/i)
  })
})

describe('owner emails', () => {
  const p = { full_name: 'Jane <b>Smith</b>', firm_name: 'Smith & Co', slug: 'jane-smith', firm_domain: 'smith.com' }
  const all = [
    claimConfirmedEmail(p, '/fund-lawyers/people/jane-smith'),
    signInEmail(p, 'T'.repeat(43)),
    otherClaimEmail(p, 'smith.com', '/fund-lawyers/people/jane-smith', new Date('2026-10-24T12:00:00Z')),
    editsLiveEmail(p, '/fund-lawyers/people/jane-smith'),
    editsNotAcceptedEmail(p, 'The description ranked you against other lawyers.'),
    requestResolvedEmail({ kind: 'removal', person_name: p.full_name, done: true }, null),
    moveEmail(p, { ...p, firm_name: 'New LLP' }),
    statsEmail(p, 'October 2026', 1, '/fund-lawyers/people/jane-smith'),
    suggestionResolvedEmail({ full_name: 'Sam <i>Lee</i>', firm_name: 'Lee LLP', outcome: 'added' }, null, null),
  ]
  it('escape every name in the HTML', () => {
    for (const m of all) {
      expect(m.html).not.toMatch(/<b>Smith|<i>Lee/)
      expect(m.subject.length).toBeGreaterThan(5)
      expect(m.text).toMatch(/FundOpsHQ$/)
    }
  })
  it('put the desk’s reason in a "not accepted" email, and the sign-in path in the claim email', () => {
    expect(all[4].text).toContain('Why: The description ranked you')
    expect(all[0].text).toContain('https://fundopshq.com/directory/claim?p=jane-smith')
    expect(all[1].text).toContain(`/directory/claim/confirm?t=${'T'.repeat(43)}`)
    expect(all[7].subject).toBe('Your directory profile in October 2026: viewed 1 time')
  })
  it('the monthly email is off unless the flag says on', () => {
    expect(statsEmailEnabled({})).toBe(false)
    expect(statsEmailEnabled({ DIRECTORY_STATS_EMAIL: 'off' })).toBe(false)
    expect(statsEmailEnabled({ DIRECTORY_STATS_EMAIL: 'on' })).toBe(true)
  })
})

describe('suggestions', () => {
  const good = { kind: 'add_self', category: 'fund_lawyer', full_name: 'Jane Smith', firm_name: 'Smith LLP', bio_url: 'https://www.smith.com/people/jane', contact_email: 'jane@smith.com', from_query: 'jane smith' }
  it('takes a self-add at the firm’s domain', () => {
    const r = validateSuggestion(good)
    expect(r.ok && r.value).toMatchObject({ kind: 'add_self', domain_match: true, from_query: 'jane smith', firm_website: null })
  })
  it('accepts a bare website, flags a mismatched address and refuses free mail for a self-add', () => {
    const firm = validateSuggestion({ kind: 'firm', category: 'fund_auditor', firm_name: 'Audit Co', firm_website: 'auditco.com', contact_email: 'pat@elsewhere.com' })
    expect(firm.ok && firm.value).toMatchObject({ firm_website: 'https://auditco.com/', domain_match: false, full_name: null })
    expect(validateSuggestion({ ...good, contact_email: 'jane@gmail.com' })).toMatchObject({ ok: false, field: 'contact_email' })
    expect(validateSuggestion({ ...good, bio_url: 'http://smith.com/x' })).toMatchObject({ ok: false, field: 'bio_url' })
    expect(validateSuggestion({ ...good, category: 'placement_agent' })).toMatchObject({ ok: false, field: 'category' })
    expect(validateSuggestion({ ...good, full_name: '' })).toMatchObject({ ok: false, field: 'full_name' })
  })
})
