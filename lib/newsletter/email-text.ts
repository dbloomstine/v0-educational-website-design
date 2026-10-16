/**
 * The plain-text part of FundOps Daily (2026-10-14, Danny).
 *
 * Every edition goes out as HTML and as text. A text part is what a mail
 * client without HTML shows, what a screen reader or a watch may read, and
 * what spam filters expect beside the HTML. It is built from the same data
 * and the same choices as the HTML (lib/newsletter/email-template.ts): the
 * same top stories in the same order with the same kicker and summary line,
 * the same sections, the reader's own "What you follow", the Monday recap,
 * the same events, the sponsor or the house notice, and the footer with the
 * reader's own unsubscribe link. Nothing is stripped out of the HTML.
 *
 * Links are written out in full, one to a line, under what they open. Lines
 * are not hard-wrapped: phones wrap them, and a wrapped URL breaks.
 */

import type { ArticleGroup } from './query-articles'
import { EMAIL_FOLLOW_ROW } from './interests'
import { interestLink } from './interest-link'
import { formatEventDates, formatEventLocation, formatEventDayHeading, eventTimeLabel, isVerifiedFree } from '@/lib/events/constants'
import { cleanEntityName } from '@/lib/news/constants'
import type { IndustryEvent } from '@/lib/events/types'
import { DEFAULT_SPONSOR_SLATE, type SponsorSlate } from './sponsors'
import { arrangeEdition, kickerParts, sizeWords, type TopPick } from './top-stories'
import { pullFollowed } from './personalize'
import { pickEventsForEmail } from './email-events'
import { FOLLOW } from '@/lib/brand/social'
import { formatDate, readerLine, sponsorsInTheNews, topStoryLine, type TemplateParams, type WeekRecap } from './email-template'

/** Plain-text twin of the HTML's FROM_EMAIL: marks a visit from the reader's own copy. */
const FROM_EMAIL = '?utm_source=newsletter&utm_medium=email'
const SPONSOR_PAGE = 'https://fundopshq.com/sponsor'
const RULE = '----------------------------------------'

/** A heading: the words, then a rule under them. */
function heading(text: string): string {
  return `${text}\n${'-'.repeat(Math.min(text.length, RULE.length))}`
}

/** The sponsor page, with where the click came from and, when given, the reader's tag (`r=`, as in tagSponsorLinks). */
function sponsorPage(ref: string, readerTag?: string): string {
  return `${SPONSOR_PAGE}?ref=${ref}${readerTag ? `&r=${readerTag}` : ''}`
}

/** A link from the site's own pages carries the tag too, in the HTML; so it does here. */
function tagIfSponsor(url: string, readerTag?: string): string {
  if (!readerTag || !url.startsWith(SPONSOR_PAGE)) return url
  return `${url}${url.includes('?') ? '&' : '?'}r=${readerTag}`
}

function topStoryText(pick: TopPick): string {
  const kicker = kickerParts(pick).join(' · ').toUpperCase()
  const line = topStoryLine(pick.article)
  return [kicker, pick.article.title, line, pick.article.sourceUrl].filter(Boolean).join('\n')
}

function sectionText(group: ArticleGroup): string {
  const rows = group.articles.map((a) => `- ${a.title}\n  ${a.sourceUrl}`)
  return `${heading(group.label.toUpperCase())}\n${rows.join('\n\n')}`
}

function recapText(recap: WeekRecap | null | undefined): string {
  // The HTML shows the table from three rows; so does this.
  if (!recap || recap.rows.length < 3) return ''
  const rows = recap.rows.map((r, i) => {
    const what = [r.fund, r.stage].filter(Boolean).join(' · ')
    const size = `${r.converted ? '~' : ''}${sizeWords(r.sizeUsdM)}`
    return `${i + 1}. ${r.firm}, ${size}${what ? `\n   ${what}` : ''}\n   https://fundopshq.com/story/${r.id}`
  })
  const total =
    recap.finals > 0
      ? `${sizeWords(recap.capitalUsdM)} in ${recap.finals} final ${recap.finals === 1 ? 'close' : 'closes'} last week, as reported.\n`
      : ''
  return `${heading('LAST WEEK’S LARGEST CLOSES')}\n${rows.join('\n')}\n\n${total}The league tables: https://fundopshq.com/league-tables`
}

function eventText(event: IndustryEvent): string {
  const time = eventTimeLabel(event)
  const isRange = event.endDate && event.endDate !== event.startDate
  const when = time ?? (isRange ? formatEventDates(event.startDate, event.endDate) : 'All day')
  const under = [cleanEntityName(event.organizerName), formatEventLocation(event), isVerifiedFree(event) ? 'Free' : undefined]
    .filter(Boolean)
    .join(' · ')
  return `- ${when}: ${event.name}${under ? `\n  ${under}` : ''}\n  https://fundopshq.com/events/${event.slug}`
}

function eventsText(events: IndustryEvent[]): string {
  if (events.length === 0) return ''
  const days = pickEventsForEmail(events, (e) => formatEventDayHeading(e.startDate))
  const blocks = days.map((day) => {
    const more = day.more > 0 ? `\n  ${day.more === 1 ? 'One more' : `${day.more} more`} on the calendar: https://fundopshq.com/events` : ''
    return `${day.heading}\n${day.shown.map(eventText).join('\n')}${more}`
  })
  return [
    heading('THE WEEK AHEAD'),
    'Every date verified at the organizer.',
    '',
    blocks.join('\n\n'),
    '',
    'Full calendar: https://fundopshq.com/events',
    'Submit an event, free: https://fundopshq.com/events/submit',
  ].join('\n')
}

function sponsorTopText(slate: SponsorSlate, readerTag?: string): string {
  // The house notice is one slim line in the HTML; in text it waits for the foot.
  return slate.sponsors
    .map((s) => [slate.label.toUpperCase(), s.name, s.blurb, tagIfSponsor(s.ctaUrl, readerTag)].join('\n'))
    .join('\n\n')
}

function sponsorBottomText(slate: SponsorSlate, readerFirms: number | undefined, readerTag?: string): string {
  if (slate.sponsors.length === 0) {
    return [
      'SPACE AVAILABLE: Your firm here.',
      readerLine(readerFirms),
      `Sponsor FundOps Daily: ${sponsorPage('email', readerTag)}`,
    ].join('\n')
  }
  const cards = slate.sponsors.map((s) =>
    [slate.label.toUpperCase(), s.name, s.blurb, `${s.ctaText ? `${s.ctaText}: ` : ''}${tagIfSponsor(s.ctaUrl, readerTag)}`].join('\n'),
  )
  if (!slate.sample) cards.push(`Your firm here next. Sponsor FundOps Daily: ${sponsorPage('email', readerTag)}`)
  return cards.join('\n\n')
}

/**
 * The text part of an edition. Takes exactly what renderNewsletterEmail takes,
 * so the send hands both the same parameters (and the same sentinels for the
 * reader's own links).
 */
export function renderNewsletterText(params: TemplateParams): string {
  const {
    groups,
    totalArticles,
    editionDate,
    unsubscribeUrl,
    sponsorSlate = DEFAULT_SPONSOR_SLATE,
    events = [],
    readerFirms,
    recap,
    interests,
    preferencesUrl,
    readerTag,
    interestToken,
  } = params
  const arranged = arrangeEdition(groups, totalArticles)
  const top = arranged.top
  const { followed, sections } = pullFollowed(arranged.sections, interests)
  const covered = sponsorsInTheNews(sponsorSlate, groups)

  const blocks: string[] = []

  // The date alone: the "Read at N firms" line left the masthead on 2026-10-16
  // (email-template.ts says why). The house notice still states the figure.
  blocks.push([`FUNDOPS DAILY`, formatDate(editionDate)].join('\n'))

  const sponsorTop = sponsorTopText(sponsorSlate, readerTag)
  if (sponsorTop) blocks.push(sponsorTop)

  if (top.length > 0) {
    blocks.push(`${heading('THIS MORNING’S TOP STORIES')}\n\n${top.map(topStoryText).join('\n\n')}`)
  }
  if (followed) blocks.push(sectionText(followed))
  for (const group of sections) blocks.push(sectionText(group))

  blocks.push(`Read the full feed: https://fundopshq.com/news${FROM_EMAIL}`)

  if (interestToken && !(interests && interests.length > 0)) {
    blocks.push(['One click and it leads your edition. Follow:', ...EMAIL_FOLLOW_ROW.map((f) => `${f.label}: ${interestLink(interestToken, f.id)}`)].join('\n'))
  }

  const recapBlock = recapText(recap)
  if (recapBlock) blocks.push(recapBlock)
  const eventsBlock = eventsText(events)
  if (eventsBlock) blocks.push(eventsBlock)

  blocks.push(sponsorBottomText(sponsorSlate, readerFirms, readerTag))

  blocks.push(
    [
      heading('SHARE THIS EDITION'),
      'If today’s brief was useful, forward it to a peer. That’s how this list grows.',
      'Forwarded to you? Subscribe: https://fundopshq.com/?ref=fwd',
    ].join('\n'),
  )

  const footer = [
    RULE,
    'FundOps Daily, by FundOpsHQ',
    `On the site: https://fundopshq.com/news${FROM_EMAIL}`,
    `League tables: https://fundopshq.com/league-tables${FROM_EMAIL}`,
  ]
  if (covered.length > 0) {
    footer.push(
      `${covered.join(' and ')} ${covered.length === 1 ? 'sponsors' : 'sponsor'} this edition and ${covered.length === 1 ? 'is' : 'are'} in today’s news. Coverage is not traded for sponsorship.`,
    )
  }
  footer.push(`Through the day: ${FOLLOW.map((f) => `${f.label} ${f.href}`).join(' · ')}`)
  footer.push('You’re receiving this because you subscribed at fundopshq.com.')
  footer.push(`Unsubscribe: ${unsubscribeUrl}`)
  if (preferencesUrl) footer.push(`Choose what you follow: ${preferencesUrl}`)
  footer.push(`Sponsor: ${tagIfSponsor(SPONSOR_PAGE, readerTag)}`)
  blocks.push(footer.join('\n'))

  return `${blocks.join('\n\n')}\n`
}
