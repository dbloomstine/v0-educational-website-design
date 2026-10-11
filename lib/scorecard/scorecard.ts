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

export interface SubscriberRow { status: string; created_at: string; unsubscribed_at: string | null; signup_source: string | null; signup_form: string | null }
export interface PostRow { id: string; post_date: string; slug: string; format: string; channel: string; status: string; permalink: string | null; caption: string | null }
export interface MetricRow { post_id: string; captured_at: string; metrics: Record<string, number | null> | null }

const DAY = 86_400_000
/** How a format is named to a reader of the scorecard. */
const FORMATS: Record<string, string> = { photoCard: 'Story cards', dailyFive: 'The Daily Five', morningTen: 'The Morning Ten', sectorFive: 'The sector five', voiceBrief: 'The Brief', bigNumber: 'Big Number videos', explainer: 'Explainer videos', termCard: 'Explainer cards', leagueChart: 'League chart', leagueQuiz: 'Weekend quiz', weekNumbers: 'Week in Five Numbers', translated: 'Translated', eventsWeek: 'On the Calendar', dealTicket: 'The Ticket', quiz: 'Quiz', storyCard: 'Story card' }
const NETWORKS: Record<string, string> = { tiktok: 'TikTok', linkedin: 'LinkedIn', instagram: 'Instagram' }

const median = (xs: number[]) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2) }
const count = <T,>(xs: T[], key: (x: T) => string) => { const m = new Map<string, number>(); for (const x of xs) m.set(key(x), (m.get(key(x)) ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])) }

/** How far a post travelled: TikTok counts views, LinkedIn impressions. */
export const viewsOf = (m: MetricRow['metrics']) => Number(m?.views ?? m?.impressions ?? 0) || 0
const actsOf = (m: MetricRow['metrics']) => (Number(m?.reactions ?? 0) || 0) + (Number(m?.comments ?? 0) || 0) + (Number(m?.shares ?? 0) || 0)

export interface Scorecard {
  from: string; to: string
  list: { confirmed: number; joined: number; joinedBefore: number; left: number; sources: [string, number][]; forms: [string, number][] }
  networks: { channel: string; name: string; posts: number; views: number; typical: number; acts: number; postsBefore: number; viewsBefore: number; typicalBefore: number }[]
  formats: { name: string; channel: string; posts: number; typical: number }[]
  best: { title: string; channel: string; views: number; link: string | null }[]
  sponsorLooks: number
}

/**
 * The week that ended at `now` (seven days), beside the week before it. A post counts in the week it went out; its
 * numbers are the latest reading Buffer has given. A post still waiting, a test's, a skipped or failed one: not counted.
 */
export function scorecard({ subscribers, posts, metrics, sponsorLooks, now }: { subscribers: SubscriberRow[]; posts: PostRow[]; metrics: MetricRow[]; sponsorLooks: number; now: number }): Scorecard {
  const start = now - 7 * DAY, before = now - 14 * DAY
  const within = (iso: string | null, a: number, b: number) => { const t = iso ? Date.parse(iso) : NaN; return t >= a && t < b }
  const real = subscribers.filter((s) => s.signup_form !== 'test')
  const joined = real.filter((s) => within(s.created_at, start, now))
  const source = (s: SubscriberRow) => (s.signup_source ?? '').trim().toLowerCase() || 'not recorded'
  const form = (s: SubscriberRow) => ({ popup: 'the signup box', hero: 'the homepage field', feed: 'the field in the feed', widget: 'the side panel', rail: 'the rail panel' } as Record<string, string>)[s.signup_form ?? ''] ?? 'not recorded'

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

  return {
    from: new Date(start).toISOString().slice(0, 10), to: new Date(now - DAY).toISOString().slice(0, 10),
    list: {
      confirmed: real.filter((s) => s.status === 'confirmed').length,
      joined: joined.length, joinedBefore: real.filter((s) => within(s.created_at, before, start)).length,
      left: real.filter((s) => within(s.unsubscribed_at, start, now)).length,
      sources: count(joined, source), forms: count(joined, form),
    },
    networks: channels.map((channel) => {
      const a = thisWeek.filter((p) => p.channel === channel), b = lastWeek.filter((p) => p.channel === channel)
      return { channel, name: NETWORKS[channel] ?? channel, posts: a.length, views: sum(a), typical: median(a.map(views)), acts: a.reduce((n, p) => n + actsOf(latest.get(p.id)?.metrics ?? null), 0), postsBefore: b.length, viewsBefore: sum(b), typicalBefore: median(b.map(views)) }
    }).filter((n) => n.posts || n.postsBefore),
    // A format is compared only where it has had three posts on a network in the week: fewer says nothing.
    formats: channels.flatMap((channel) => count(thisWeek.filter((p) => p.channel === channel), (p) => p.format).filter(([, n]) => n >= 3).map(([f, n]) => ({ name: FORMATS[f] ?? f, channel: NETWORKS[channel] ?? channel, posts: n, typical: median(thisWeek.filter((p) => p.channel === channel && p.format === f).map(views)) }))).sort((x, y) => y.typical - x.typical),
    best: [...thisWeek].sort((x, y) => views(y) - views(x)).slice(0, 3).filter((p) => views(p) > 0).map((p) => ({ title: title(p), channel: NETWORKS[p.channel] ?? p.channel, views: views(p), link: p.permalink })),
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
const list = (pairs: [string, number][]) => pairs.map(([k, v]) => `${esc(k)} ${n(v)}`).join(' · ')

/** The scorecard as the Monday email. */
export function scorecardMail(s: Scorecard): Mail {
  const body = [
    h('The email list'),
    line(`<b>${n(s.list.confirmed)}</b> readers. <b>${n(s.list.joined)}</b> joined this week${change(s.list.joined, s.list.joinedBefore)}${s.list.left ? `; ${n(s.list.left)} left` : ''}.`),
    s.list.joined ? line(`Where they came from: ${list(s.list.sources)}.`) : '',
    s.list.joined ? line(`Where they signed up: ${list(s.list.forms)}.`) : '',
    h('The posts'),
    ...(s.networks.length ? s.networks.map((x) => line(`<b>${esc(x.name)}</b>: ${n(x.posts)} posts${change(x.posts, x.postsBefore)}, ${n(x.views)} views in all${change(x.views, x.viewsBefore)}, ${n(x.typical)} for a typical post${change(x.typical, x.typicalBefore)}, ${n(x.acts)} likes, comments and shares.`)) : [line('No post went out this week.')]),
    s.formats.length ? h('What kind of post travelled (a typical post, three or more in the week)') : '',
    ...s.formats.map((f) => line(`${esc(f.name)} on ${esc(f.channel)}: ${n(f.typical)} views (${n(f.posts)} posts)`)),
    s.best.length ? h('The week’s best') : '',
    ...s.best.map((b) => line(`${n(b.views)} views on ${esc(b.channel)}: ${b.link ? `<a href="${esc(b.link)}" style="color:${INK};">${esc(b.title)}</a>` : esc(b.title)}`)),
    h('Sponsors'),
    line(s.sponsorLooks ? `${n(s.sponsorLooks)} look${s.sponsorLooks === 1 ? '' : 's'} at the sponsor page from readers’ own copies of the email.` : 'No reader opened the sponsor page from the email this week.'),
    `<p style="margin:18px 0 0;font-family:${SANS};font-size:12px;line-height:1.5;color:${MUTED};">A post’s numbers are the latest the scheduler has read; the last day or two are still rising. Followers are not here: neither network gives them to the scheduler. Visits to the site from each network are in Vercel’s analytics (the LinkedIn links say where a reader came from).</p>`,
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
