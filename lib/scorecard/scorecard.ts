/**
 * The weekly scorecard: what the week did for the two things FundOpsHQ is building, an email list and an audience.
 *
 * Danny, 2026-10-11, to "build the weekly scorecard next": "3 sounds good. Go for it." A lot had been changed on
 * judgement that week (what a post looks like, which stories get one, LinkedIn switched on); this is how it is
 * found out what worked. One email every Monday morning, short enough to read on a phone.
 *
 * Everything here is pure: the route reads the rows, this file adds them up and words them. Nothing is estimated.
 * What cannot be known is said to be unknown (followers: neither network gives them to the scheduler).
 */
import { OWNER_EMAIL, esc, type Mail } from '@/lib/sponsor/mail'
import { emailWeek, type EditionRow, type EmailWeek } from './engagement'

export interface SubscriberRow { status: string; created_at: string; unsubscribed_at: string | null; signup_source: string | null; signup_form: string | null; /** utm_campaign at signup: which post or link brought them (2026-10-16). */ signup_campaign?: string | null; /** The page the form was on (2026-10-22). */ signup_page?: string | null; /** The first page of the visit they signed up on (lib/newsletter/signup-source.ts). */ signup_landing_path?: string | null }
/** An outreach v2 message, for the week's outreach figures (2026-10-16). */
export interface OutreachMessageRow { id: string; program: string; kind: string; status: string; sent_at: string | null; replied_at: string | null }
/** A Resend event on an outreach message (outreach_v2_events): email.delivered, email.opened, email.clicked, email.bounced, email.complained. */
export interface OutreachEventRow { message_id: string | null; type: string }

/** One outreach program's week (2026-10-22): every send of it, follow-ups included. */
export interface ProgramWeek { program: string; sent: number; replied: number; bounced: number }
export interface OutreachWeek { sent: number; pitches: number; notes: number; organizerNotes: number; followups: number; delivered: number; opened: number; clicked: number; replied: number; bounced: number; complained: number; /** Sponsor pitches, news notes, organizer notes, in that order, each listed even with nothing sent (a program not running shows). */ programs: ProgramWeek[] }
/** This week's unsubscribes against the average of the four weeks before (2026-10-16): a spike is more than twice the average, and at least three. */
export interface UnsubSpike { left: number; averageBefore: number; flagged: boolean }
export interface PostRow { id: string; post_date: string; slug: string; format: string; channel: string; status: string; permalink: string | null; caption: string | null }
export interface MetricRow { post_id: string; captured_at: string; metrics: Record<string, number | null> | null }

const DAY = 86_400_000
/** How a format is named to a reader of the scorecard. */
const FORMATS: Record<string, string> = { meme: 'Memes', fastStory: 'Fast stories', photoCard: 'Story cards', dailyFive: 'The Daily Five', morningTen: 'The Morning Ten', sectorFive: 'The sector five', voiceBrief: 'The Brief', bigNumber: 'Big Number videos', explainer: 'Explainer videos', termCard: 'Explainer cards', leagueChart: 'League chart', leagueQuiz: 'Weekend quiz', weekNumbers: 'Week in Five Numbers', translated: 'Translated', eventsWeek: 'On the Calendar', dealTicket: 'The Ticket', quiz: 'Quiz', storyCard: 'Story card' }
const NETWORKS: Record<string, string> = { tiktok: 'TikTok', linkedin: 'LinkedIn', instagram: 'Instagram', youtube: 'YouTube' }
/** The formats new on 2026-10-22, called out in the letter until they have a record of their own. */
export const NEW_FORMATS = ['meme', 'fastStory'] as const
/** The signup forms (lib/newsletter/interests.ts SIGNUP_FORMS), as the letter names them. */
const FORM_NAMES: Record<string, string> = { popup: 'the signup box', firstvisit: 'the first-visit ask', events: 'the events offer', hero: 'the homepage field', feed: 'the field in the feed', widget: 'the side panel', rail: 'the rail panel', submit: 'the news submission form', takeover: 'the welcome screen', join: 'the join page', 'inline-story': 'the line under a story', 'inline-event': 'the line under an event', 'inline-firm': 'the line on a firm page', 'inline-league': 'the line on the league tables' }
/** Always listed, at 0 too, when anyone joined: the box, the two forms new on 2026-10-22 and the welcome screen that replaced the box's asks. */
const FORMS_ALWAYS = ['takeover', 'popup', 'firstvisit', 'events']
/** The conversion section lists these at 0 too: the welcome screen and the in-page lines, all new on 2026-10-22. */
const CONVERSION_ALWAYS = ['takeover', 'inline-story', 'inline-event', 'inline-firm', 'inline-league']
const PROGRAMS: [string, string][] = [['sponsor_pitch', 'Sponsor pitches'], ['news_note', 'News notes'], ['organizer_note', 'Organizer notes']]

const median = (xs: number[]) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2) }
const count = <T,>(xs: T[], key: (x: T) => string) => { const m = new Map<string, number>(); for (const x of xs) m.set(key(x), (m.get(key(x)) ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])) }

/** How far a post travelled: TikTok counts views, LinkedIn impressions. */
export const viewsOf = (m: MetricRow['metrics']) => Number(m?.views ?? m?.impressions ?? 0) || 0
/** Whether a reading has a measure of reach at all (a post with none is left out of an average, not counted as 0). */
export const hasViews = (m: MetricRow['metrics'] | undefined) => m?.views != null || m?.impressions != null
const actsOf = (m: MetricRow['metrics']) => (Number(m?.reactions ?? 0) || 0) + (Number(m?.comments ?? 0) || 0) + (Number(m?.shares ?? 0) || 0)

/** One form's week (2026-10-22): who joined through it, and how many of them are confirmed now (the rest left or are pending). */
export interface FormConversion { form: string; name: string; joined: number; confirmed: number }
export interface Conversion {
  forms: FormConversion[]
  /** The first page of the visit they joined on (signup_landing_path), the week's joiners. */
  landings: [string, number][]
  /** Where they came from and where they landed, together ("linkedin → /story/x"). */
  sourceLandings: [string, number][]
}

/**
 * The week's signups as a conversion report (2026-10-22, Danny: "we're getting visitors. We need to convert more of
 * them"): by form, confirmed and not; by the page the visit began on; and by source and landing page together.
 * Rows of the form `test` are left out, as everywhere in the scorecard.
 */
export function conversionWeek(joined: SubscriberRow[]): Conversion {
  const key = (s: SubscriberRow) => (s.signup_form ?? '').trim() || 'not recorded'
  const by = new Map<string, SubscriberRow[]>()
  for (const s of joined) by.set(key(s), [...(by.get(key(s)) ?? []), s])
  if (joined.length) for (const f of CONVERSION_ALWAYS) if (!by.has(f)) by.set(f, [])
  const forms = [...by]
    .map(([form, rows]) => ({ form, name: FORM_NAMES[form] ?? form, joined: rows.length, confirmed: rows.filter((s) => s.status === 'confirmed').length }))
    .sort((a, b) => b.joined - a.joined || a.name.localeCompare(b.name))
  const landing = (s: SubscriberRow) => (s.signup_landing_path ?? '').trim() || 'not recorded'
  const source = (s: SubscriberRow) => (s.signup_source ?? '').trim().toLowerCase() || 'not recorded'
  return { forms, landings: count(joined, landing), sourceLandings: count(joined, (s) => `${source(s)} → ${landing(s)}`) }
}

export interface FormatWeek { format: string; name: string; posts: number; measured: number; average: number; isNew: boolean }

export interface Scorecard {
  from: string; to: string
  list: { confirmed: number; joined: number; joinedBefore: number; left: number; sources: [string, number][]; forms: [string, number][]; /** Which post or link brought them (utm_campaign), the week's joiners only. */ campaigns: [string, number][]; /** The page the form was on (signup_page), the week's joiners only. */ pages: [string, number][]; unsubSpike: UnsubSpike }
  /** The week's signups by form (confirmed and not), landing page and source (2026-10-22). */
  conversion: Conversion
  /** Requests on the sponsor page in the week. */
  sponsorRequests: number
  /** Outreach v2 sends in the week and what happened to them, against the week before (null when nothing went either week). */
  outreach: { week: OutreachWeek; before: OutreachWeek } | null
  networks: { channel: string; name: string; posts: number; views: number; typical: number; acts: number; postsBefore: number; viewsBefore: number; typicalBefore: number }[]
  formats: { name: string; channel: string; posts: number; typical: number }[]
  /** Every format posted in the week, all networks together: posts, how many have a reading, their average views (2026-10-22). */
  formatWeek: FormatWeek[]
  best: { title: string; channel: string; views: number; link: string | null }[]
  /** The daily email: people who clicked a link, edition by edition, against the week before (lib/scorecard/engagement.ts). */
  email: EmailWeek
  sponsorLooks: number
  // ── SITE TRAFFIC: NOT BUILT YET (left for later, 2026-10-14) ──
  // Visits to fundopshq.com for the week against the week before belong here, as a `site` field, summed by a pure
  // function beside emailWeek and drawn in scorecardMail at the marked place. Vercel's analytics have them today;
  // nothing reads them into the scorecard.
}

/**
 * The week that ended at `now` (seven days), beside the week before it. A post counts in the week it went out; its
 * numbers are the latest reading Buffer has given. A post still waiting, a test's, a skipped or failed one: not counted.
 */
export function outreachWeek(messages: OutreachMessageRow[], events: OutreachEventRow[], start: number, end: number): OutreachWeek {
  const sent = messages.filter((m) => m.sent_at && Date.parse(m.sent_at) >= start && Date.parse(m.sent_at) < end && ['sent', 'sending'].includes(m.status))
  const ids = new Set(sent.map((m) => m.id))
  const withEvent = (type: string) => new Set(events.filter((e) => e.message_id && ids.has(e.message_id) && e.type === type).map((e) => e.message_id)).size
  return {
    sent: sent.length,
    pitches: sent.filter((m) => m.program === 'sponsor_pitch' && m.kind === 'initial').length,
    notes: sent.filter((m) => m.program === 'news_note').length,
    organizerNotes: sent.filter((m) => m.program === 'organizer_note').length,
    followups: sent.filter((m) => m.kind !== 'initial').length,
    delivered: withEvent('email.delivered'), opened: withEvent('email.opened'), clicked: withEvent('email.clicked'),
    replied: sent.filter((m) => m.replied_at).length,
    bounced: withEvent('email.bounced'), complained: withEvent('email.complained'),
    programs: PROGRAMS.map(([program]) => {
      const of = sent.filter((m) => m.program === program)
      const mine = new Set(of.map((m) => m.id))
      const bounced = new Set(events.filter((e) => e.type === 'email.bounced' && e.message_id && mine.has(e.message_id)).map((e) => e.message_id)).size
      return { program, sent: of.length, replied: of.filter((m) => m.replied_at).length, bounced }
    }),
  }
}

/**
 * The week's posts by format, all networks together (2026-10-22): how many went out, how many have a reading with
 * views or impressions, and the average of those. The new formats come first, so a week's verdict on them is the
 * first thing read; then the most posted.
 */
export function formatWeek(posts: PostRow[], latest: Map<string, MetricRow>): FormatWeek[] {
  const by = new Map<string, PostRow[]>()
  for (const p of posts) by.set(p.format, [...(by.get(p.format) ?? []), p])
  for (const f of NEW_FORMATS) if (!by.has(f)) by.set(f, [])
  return [...by].map(([format, ps]) => {
    const read = ps.map((p) => latest.get(p.id)?.metrics).filter(hasViews)
    const average = read.length ? Math.round(read.reduce((n, m) => n + viewsOf(m ?? null), 0) / read.length) : 0
    return { format, name: FORMATS[format] ?? format, posts: ps.length, measured: read.length, average, isNew: (NEW_FORMATS as readonly string[]).includes(format) }
  }).sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.posts - a.posts || a.name.localeCompare(b.name))
}

/** Unsubscribes in the week against the four weeks before it. */
export function unsubSpike(subscribers: Pick<SubscriberRow, 'unsubscribed_at' | 'signup_form'>[], now: number): UnsubSpike {
  const left = (a: number, b: number) => subscribers.filter((s) => s.signup_form !== 'test' && s.unsubscribed_at && Date.parse(s.unsubscribed_at) >= a && Date.parse(s.unsubscribed_at) < b).length
  const week = left(now - 7 * DAY, now)
  const before = [1, 2, 3, 4].map((w) => left(now - (w + 1) * 7 * DAY, now - w * 7 * DAY))
  const averageBefore = Math.round((before.reduce((n, x) => n + x, 0) / 4) * 10) / 10
  return { left: week, averageBefore, flagged: week >= 3 && week > 2 * averageBefore }
}

export function scorecard({ subscribers, posts, metrics, editions = [], sponsorLooks, sponsorRequests = 0, outreachMessages = [], outreachEvents = [], now }: { subscribers: SubscriberRow[]; posts: PostRow[]; metrics: MetricRow[]; editions?: Pick<EditionRow, 'edition_date' | 'status' | 'engagement'>[]; sponsorLooks: number; sponsorRequests?: number; outreachMessages?: OutreachMessageRow[]; outreachEvents?: OutreachEventRow[]; now: number }): Scorecard {
  const start = now - 7 * DAY, before = now - 14 * DAY
  const within = (iso: string | null, a: number, b: number) => { const t = iso ? Date.parse(iso) : NaN; return t >= a && t < b }
  const real = subscribers.filter((s) => s.signup_form !== 'test')
  const joined = real.filter((s) => within(s.created_at, start, now))
  const source = (s: SubscriberRow) => (s.signup_source ?? '').trim().toLowerCase() || 'not recorded'
  // A form the letter has no name for is shown as it is stored, never folded into "not recorded" (only a blank is).
  const form = (s: SubscriberRow) => { const f = (s.signup_form ?? '').trim(); return f ? FORM_NAMES[f] ?? f : 'not recorded' }
  const forms = count(joined, form)
  for (const f of FORMS_ALWAYS) if (!forms.some(([k]) => k === FORM_NAMES[f])) forms.push([FORM_NAMES[f], 0])
  const page = (s: SubscriberRow) => (s.signup_page ?? '').trim() || 'not recorded'
  const campaign = (s: SubscriberRow) => (s.signup_campaign ?? '').trim().toLowerCase() || 'not recorded'

  // The latest reading for each post.
  const latest = new Map<string, MetricRow>()
  for (const m of metrics) { const had = latest.get(m.post_id); if (!had || m.captured_at > had.captured_at) latest.set(m.post_id, m) }
  const out = posts.filter((p) => p.status === 'posted' && !p.slug.startsWith('test-'))
  const day = (p: PostRow) => Date.parse(`${p.post_date}T12:00:00Z`)
  const thisWeek = out.filter((p) => day(p) >= start && day(p) < now), lastWeek = out.filter((p) => day(p) >= before && day(p) < start)
  const views = (p: PostRow) => viewsOf(latest.get(p.id)?.metrics ?? null)
  const sum = (ps: PostRow[]) => ps.reduce((n, p) => n + views(p), 0)

  const channels = [...new Set(out.map((p) => p.channel))].sort((a, b) => (a === 'tiktok' ? -1 : b === 'tiktok' ? 1 : a.localeCompare(b)))
  const title = (p: PostRow) => (p.caption ?? '').split('\n')[0].replace(/\s+/g, ' ').trim().slice(0, 90) || p.slug

  const from = new Date(start).toISOString().slice(0, 10), to = new Date(now - DAY).toISOString().slice(0, 10)
  return {
    from, to,
    list: {
      confirmed: real.filter((s) => s.status === 'confirmed').length,
      joined: joined.length, joinedBefore: real.filter((s) => within(s.created_at, before, start)).length,
      left: real.filter((s) => within(s.unsubscribed_at, start, now)).length,
      sources: count(joined, source), forms,
      campaigns: count(joined, campaign),
      pages: count(joined, page),
      unsubSpike: unsubSpike(real, now),
    },
    conversion: conversionWeek(joined),
    sponsorRequests,
    outreach: (() => {
      const week = outreachWeek(outreachMessages, outreachEvents, start, now), b = outreachWeek(outreachMessages, outreachEvents, before, start)
      return week.sent || b.sent ? { week, before: b } : null
    })(),
    networks: channels.map((channel) => {
      const a = thisWeek.filter((p) => p.channel === channel), b = lastWeek.filter((p) => p.channel === channel)
      return { channel, name: NETWORKS[channel] ?? channel, posts: a.length, views: sum(a), typical: median(a.map(views)), acts: a.reduce((n, p) => n + actsOf(latest.get(p.id)?.metrics ?? null), 0), postsBefore: b.length, viewsBefore: sum(b), typicalBefore: median(b.map(views)) }
    }).filter((n) => n.posts || n.postsBefore),
    // A format is compared only where it has had three posts on a network in the week: fewer says nothing.
    formats: channels.flatMap((channel) => count(thisWeek.filter((p) => p.channel === channel), (p) => p.format).filter(([, n]) => n >= 3).map(([f, n]) => ({ name: FORMATS[f] ?? f, channel: NETWORKS[channel] ?? channel, posts: n, typical: median(thisWeek.filter((p) => p.channel === channel && p.format === f).map(views)) }))).sort((x, y) => y.typical - x.typical),
    formatWeek: formatWeek(thisWeek, latest),
    best: [...thisWeek].sort((x, y) => views(y) - views(x)).slice(0, 3).filter((p) => views(p) > 0).map((p) => ({ title: title(p), channel: NETWORKS[p.channel] ?? p.channel, views: views(p), link: p.permalink })),
    email: emailWeek(editions, from, to),
    sponsorLooks,
  }
}

const INK = '#13233A', MUTED = '#55647A', CREAM = '#F8F5EC', AMBER = '#E6B045', RULE = '#DDD5C3'
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif", SERIF = "Georgia,'Times New Roman',serif"
const n = (x: number) => x.toLocaleString('en-US')
const change = (now: number, before: number) => (before ? ` <span style="color:${MUTED};">(${n(before)} the week before)</span>` : '')
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const h = (text: string) => `<h2 style="margin:22px 0 8px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};">${esc(text)}</h2>`
const line = (html: string) => `<p style="margin:0 0 8px;font-family:${SANS};font-size:15px;line-height:1.55;color:${INK};">${html}</p>`
const weekday = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', '')
const list = (pairs: [string, number][]) => pairs.map(([k, v]) => `${esc(k)} ${n(v)}`).join(' · ')

/** The daily email's clicks, as lines of the Monday letter. */
function emailLines(e: EmailWeek): string[] {
  const out = [h('The daily email: who clicked')]
  if (!e.editions.length) {
    out.push(line(e.unmeasured.length ? 'Not counted yet: each edition’s clicks are counted from a day after it goes out.' : 'No edition went out this week.'))
    return out
  }
  const before = e.before.editions ? ` <span style="color:${MUTED};">(${n(e.before.perEdition)}, ${e.before.share}%, the week before)</span>` : ''
  out.push(line(`<b>${n(e.perEdition)}</b> people clicked a link in an average edition by Resend’s last event, <b>${e.share}%</b> of those it went to${before}.`))
  if (e.humanEditions) {
    const hb = e.before.humanEditions ? ` <span style="color:${MUTED};">(${n(e.before.humanPerEdition)} the week before)</span>` : ''
    out.push(line(`<b>${n(e.humanPerEdition)}</b> of them were people, not link scanners, in an average edition (<b>${e.humanShare}%</b>; a click more than a minute after delivery, not in the same instant as an open; ${n(e.humanEditions)} of ${n(e.editions.length)} editions have the count)${hb}.`))
  }
  out.push(line(`Edition by edition: ${e.editions.map((x) => `${esc(weekday(x.date))} ${n(x.clicked)} of ${n(x.recipients)} (${x.share}%)${x.human != null ? `, ${n(x.human)} people` : ''}${x.final ? '' : ' so far'}`).join(' · ')}.`))
  if (e.unmeasured.length) out.push(line(`<span style="color:${MUTED};">Not counted yet: ${e.unmeasured.map((d) => esc(weekday(d))).join(', ')}.</span>`))
  return out
}

/** The week's posts by format with their average views, the new formats first and in bold (2026-10-22). */
function formatLines(f: FormatWeek[]): string[] {
  if (!f.some((x) => x.posts)) return []
  const avg = (x: FormatWeek) => (x.measured ? `${n(x.average)} average views${x.measured < x.posts ? ` (${n(x.measured)} with numbers)` : ''}` : 'no numbers yet')
  const fresh = f.filter((x) => x.isNew)
  const rest = f.filter((x) => !x.isNew && x.posts)
  return [
    h('Posts by format (all networks)'),
    line(`New: ${fresh.map((x) => (x.posts ? `<b>${esc(x.name)}</b> ${n(x.posts)} post${x.posts === 1 ? '' : 's'}, <b>${avg(x)}</b>` : `<b>${esc(x.name)}</b> none posted`)).join(' · ')}.`),
    rest.length ? line(`${rest.map((x) => `${esc(x.name)} ${n(x.posts)}, ${avg(x)}`).join(' · ')}.`) : '',
  ].filter(Boolean)
}

/** Outreach v2 (sponsor pitches, news notes and organizer notes), as lines of the Monday letter. */
function outreachLines(o: Scorecard['outreach']): string[] {
  if (!o) return []
  const w = o.week, b = o.before
  const what = [w.pitches ? `${n(w.pitches)} sponsor pitch${w.pitches === 1 ? '' : 'es'}` : '', w.followups ? `${n(w.followups)} follow-up${w.followups === 1 ? '' : 's'}` : '', w.notes ? `${n(w.notes)} news note${w.notes === 1 ? '' : 's'}` : '', w.organizerNotes ? `${n(w.organizerNotes)} organizer note${w.organizerNotes === 1 ? '' : 's'}` : ''].filter(Boolean).join(', ')
  const name = (p: string) => PROGRAMS.find(([k]) => k === p)?.[1] ?? p
  return [
    h('Outreach'),
    line(w.sent ? `<b>${n(w.sent)}</b> sent${what ? ` (${what})` : ''}${change(w.sent, b.sent)}: ${n(w.delivered)} delivered, <b>${n(w.opened)}</b> opened, <b>${n(w.clicked)}</b> clicked, <b>${n(w.replied)}</b> replied${w.bounced ? `, ${n(w.bounced)} bounced` : ''}${w.complained ? `, <b style="color:#9C2F1A;">${n(w.complained)} marked as spam</b>` : ''}.` : `Nothing went out this week${b.sent ? ` <span style="color:${MUTED};">(${n(b.sent)} the week before: ${n(b.opened)} opened, ${n(b.clicked)} clicked, ${n(b.replied)} replied)</span>` : ''}.`),
    line(`By program: ${w.programs.map((p) => (p.sent ? `${esc(name(p.program))} ${n(p.sent)} sent, <b>${n(p.replied)}</b> replied, ${n(p.bounced)} bounced` : `${esc(name(p.program))} none sent`)).join(' · ')}.`),
  ].filter(Boolean)
}

/** The conversion report, as lines of the Monday letter (2026-10-22). Nothing when nobody joined. */
function conversionLines(c: Conversion): string[] {
  if (!c.forms.some((f) => f.joined)) return []
  const form = (f: FormConversion) => (f.joined ? `${esc(f.name)} <b>${n(f.joined)}</b> (${n(f.confirmed)} confirmed${f.joined > f.confirmed ? `, ${n(f.joined - f.confirmed)} not` : ''})` : `${esc(f.name)} 0`)
  return [
    h('Conversion: where this week’s readers signed up'),
    line(`By form: ${c.forms.map(form).join(' · ')}.`),
    line(`The page their visit began on: ${list(c.landings.slice(0, 8))}.`),
    line(`Source and landing page: ${list(c.sourceLandings.slice(0, 6))}.`),
    `<p style="margin:0 0 8px;font-family:${SANS};font-size:12px;line-height:1.5;color:${MUTED};">Confirmed is the row’s status now: signup is single opt-in, so “not” means they have since left (or the row is pending).</p>`,
  ]
}

/** The scorecard as the Monday email. */
export function scorecardMail(s: Scorecard): Mail {
  const body = [
    h('The email list'),
    line(`<b>${n(s.list.confirmed)}</b> readers. <b>${n(s.list.joined)}</b> joined this week${change(s.list.joined, s.list.joinedBefore)}${s.list.left ? `; ${n(s.list.left)} left` : ''}.`),
    s.list.joined ? line(`Where they came from: ${list(s.list.sources)}.`) : '',
    s.list.joined ? line(`Where they signed up: ${list(s.list.forms)}.`) : '',
    s.list.joined && s.list.campaigns.some(([k]) => k !== 'not recorded') ? line(`Which post or link (utm_campaign): ${list(s.list.campaigns)}.`) : '',
    s.list.joined && s.list.pages.some(([k]) => k !== 'not recorded') ? line(`On which page: ${list(s.list.pages.slice(0, 6))}.`) : '',
    ...conversionLines(s.conversion),
    s.list.unsubSpike.flagged ? line(`<b style="color:#9C2F1A;">Unsubscribes are up:</b> ${n(s.list.unsubSpike.left)} this week against ${s.list.unsubSpike.averageBefore} a week on average over the four before. Look at what changed in the editions.`) : '',
    ...emailLines(s.email),
    // ── SITE TRAFFIC goes here, between the email and the posts, once it is built (see the Scorecard type). ──
    h('The posts'),
    ...(s.networks.length ? s.networks.map((x) => line(`<b>${esc(x.name)}</b>: ${n(x.posts)} posts${change(x.posts, x.postsBefore)}, ${n(x.views)} views in all${change(x.views, x.viewsBefore)}, ${n(x.typical)} for a typical post${change(x.typical, x.typicalBefore)}, ${n(x.acts)} likes, comments and shares.`)) : [line('No post went out this week.')]),
    s.formats.length ? h('What kind of post travelled (a typical post, three or more in the week)') : '',
    ...s.formats.map((f) => line(`${esc(f.name)} on ${esc(f.channel)}: ${n(f.typical)} views (${n(f.posts)} posts)`)),
    ...formatLines(s.formatWeek),
    s.best.length ? h('The week’s best') : '',
    ...s.best.map((b) => line(`${n(b.views)} views on ${esc(b.channel)}: ${b.link ? `<a href="${esc(b.link)}" style="color:${INK};">${esc(b.title)}</a>` : esc(b.title)}`)),
    h('Sponsors'),
    line(s.sponsorLooks ? `${n(s.sponsorLooks)} look${s.sponsorLooks === 1 ? '' : 's'} at the sponsor page from readers’ own copies of the email.` : 'No reader opened the sponsor page from the email this week.'),
    line(s.sponsorRequests ? `<b>${n(s.sponsorRequests)}</b> sponsor request${s.sponsorRequests === 1 ? '' : 's'} on the sponsor page this week.` : 'No sponsor request this week.'),
    ...outreachLines(s.outreach),
    `<p style="margin:18px 0 0;font-family:${SANS};font-size:12px;line-height:1.5;color:${MUTED};">A post’s numbers are the latest the scheduler has read; the last day or two are still rising. Followers are not here: neither network gives them to the scheduler, and nothing stores them. Outreach opens and clicks are Resend’s webhook events per message, first of each. An email click is a reader whose last event at Resend was a click, counted up to three days after the send (“so far” means the count is younger than that); a reader who clicked and opened it again later can show as an open, so the clicks are a floor. Visits to the site from each network are in Vercel’s analytics (the LinkedIn links say where a reader came from).</p>`,
  ].filter(Boolean).join('\n')
  const html = `<!doctype html><html lang="en"><body style="margin:0;padding:0;background:${CREAM};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFDF8;border:1px solid ${RULE};">
<tr><td style="background:${INK};border-left:4px solid ${AMBER};padding:12px 20px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${CREAM};">FundOpsHQ &nbsp;·&nbsp; The week</td></tr>
<tr><td style="padding:24px 24px 22px;">
<h1 style="margin:0 0 4px;font-family:${SERIF};font-size:24px;line-height:1.2;font-weight:700;color:${INK};">The week of ${esc(day(s.from))} to ${esc(day(s.to))}</h1>
${body}
</td></tr></table></td></tr></table></body></html>`
  return { to: OWNER_EMAIL(), replyTo: OWNER_EMAIL(), subject: `FundOpsHQ, the week: ${n(s.list.joined)} new readers, ${n(s.networks.reduce((t, x) => t + x.views, 0))} views`, html }
}
