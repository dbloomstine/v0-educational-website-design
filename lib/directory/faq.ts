/**
 * The questions a landing page or a firm list answers (2026-10-24), each answer computed from the page's own list or
 * a plain fact about how the directory works. No answer is written by a model, and none claims anything the list
 * below it does not show. A question is left out when the list cannot answer it (one city, one firm).
 *
 * Plain HTML only, no FAQPage markup: Google limited FAQ rich results to government and health sites in August
 * 2023 and stopped showing them at all on 2026-05-07 (developers.google.com/search/docs/appearance/structured-data/
 * faqpage, checked 2026-10-24). The questions still answer the searches as plain text.
 * Pure, so tested.
 */
import { intentFor } from './intent'
import { firmListTitle, type RankedFirm } from './firm-lists'
import type { LandingKey } from './landing'
import { cityTally, listJoin, practiceAreas, practiceTally, type PersonCard } from './people'
import { PLACES } from './places'
import { SENIOR_ONLY, practiceLower, lowerNoun, type Category } from './taxonomy'

export interface Faq {
  q: string
  a: string
  link?: { href: string; text: string }
}

const n = (x: number) => x.toLocaleString('en-US')
/** The fund strategies: a fund of each kind is something a lawyer sets up. */
const STRATEGY_IDS = new Set(['buyout_funds', 'venture_funds', 'private_credit_funds', 'real_estate_funds', 'infrastructure_funds', 'hedge_funds', 'secondaries'])
const lowerWords = (s: string) =>
  s
    .split(' ')
    .map((w) => (/^[A-Z]{2,}s?$/.test(w) ? w : w.toLowerCase()))
    .join(' ')

const partnerWord = (c: Category, x: number) => (SENIOR_ONLY.includes(c.id) ? (x === 1 ? 'partner' : 'partners') : x === 1 ? 'person' : 'people')

/** How the page's people are named in a question: "hedge fund formation attorneys", "fund lawyers". */
export function peoplePhrase(category: Category, k: LandingKey): string {
  const i = k.topic && k.topic.kind !== 'side' ? intentFor(category, k.topic.id) : !k.topic ? intentFor(category, null) : null
  return i?.people || lowerNoun(category, 2)
}

/** "hedge fund law firms": the firm list's name in a sentence, without its place. */
export const firmsPhrase = (category: Category, k: LandingKey) => lowerWords(firmListTitle(category, { topic: k.topic, place: null }))

/** What qualifies someone for the page, as a clause: "their firm's own bio page names hedge fund work". */
function basis(k: LandingKey): string {
  if (!k.topic) return k.place ? `their firm's website lists an office in ${k.place.name}` : "their firm's own website lists them"
  if (k.topic.kind === 'practice') return `their firm's own bio page names ${k.topic.work} work`
  if (k.topic.kind === 'focus') return `their firm's own bio page names ${k.topic.label.toLowerCase()} among their clients`
  return `their firm's own bio page says they act for ${k.topic.label.replace(/ and (\w)/, (_m, c: string) => ` and ${c.toLowerCase()}`)}`
}

export interface LandingFaqInput {
  category: Category
  key: LandingKey
  people: PersonCard[]
  ranked: RankedFirm[]
  verified: string | null
  /** This page's firm list, when it has one. */
  firmList: { path: string; firms: number } | null
  /** The same topic in other cities, biggest first (a city page's "which other cities"). */
  elsewhere: { name: string; count: number }[]
}

export function landingFaq({ category, key, people, ranked, verified, firmList, elsewhere }: LandingFaqInput): Faq[] {
  const out: Faq[] = []
  const where = key.place ? ` in ${key.place.name}` : ''
  const who = peoplePhrase(category, key)
  const senior = SENIOR_ONLY.includes(category.id)
  const firmCount = ranked.length

  out.push({
    q: `How many ${who} does FundOpsHQ list${where}?`,
    a: `${n(people.length)} ${partnerWord(category, people.length)} at ${n(firmCount)} ${firmCount === 1 ? 'firm' : 'firms'}.${verified ? ` Last checked ${verified}.` : ''} Each one is ${senior ? 'at partner level, and ' : 'listed because '}${basis(key)}.`,
  })

  if (firmCount >= 2) {
    const top = ranked.slice(0, 3)
    out.push({
      q: `Which ${firmsPhrase(category, key)} have the most ${senior ? 'partners' : 'people'} listed${where}?`,
      a: `${listJoin(top.map((f) => `${f.name} (${n(f.count)})`))}, counting the ${senior ? 'partners' : 'people'} each firm's own website lists${key.topic?.kind === 'practice' ? ` for ${key.topic.work} work` : ''}${where}.`,
      ...(firmList ? { link: { href: firmList.path, text: `All ${n(firmList.firms)} firms, ranked` } } : {}),
    })
  }

  if (!key.place || key.place.kind === 'state') {
    const cities = cityTally(people)
      .filter((t) => !key.place || PLACES.find((p) => p.slug === t.key)?.state === key.place.state)
      .slice(0, 3)
    if (cities.length >= 2) out.push({ q: `Where${key.place ? ` in ${key.place.name}` : ''} are ${who} based?`, a: `The cities with the most: ${listJoin(cities.map((t) => `${t.label} (${n(t.count)})`))}.` })
  } else if (elsewhere.length >= 2) {
    out.push({ q: `Which other cities have the most ${who}?`, a: `${listJoin(elsewhere.slice(0, 3).map((e) => `${e.name} (${n(e.count)})`))}.` })
  }

  const practices = practiceTally(people)
    .filter((t) => !(key.topic?.kind === 'practice' && t.key === key.topic.id))
    .slice(0, 3)
  if (practices.length >= 2) {
    out.push({
      q: `What else do these ${category.trade.toLowerCase()} work on?`,
      a: `The practices they list most${key.topic?.kind === 'practice' ? ` alongside ${key.topic.work} work` : ''}: ${listJoin(practices.map((t) => `${practiceLower(t.key)} (${n(t.count)})`))}.`,
    })
  }

  // "A lawyer to help set up a private equity fund" (the intent map): how many on a strategy page also list fund
  // formation, the setting up of the fund itself. Lawyers only; the fund formation page is that list already.
  if (category.id === 'fund_lawyer' && key.topic?.kind === 'practice' && STRATEGY_IDS.has(key.topic.id)) {
    const forming = people.filter((p) => practiceAreas(p).includes('fund_formation')).length
    if (forming > 0)
      out.push({
        q: `How many of these lawyers help set up new ${key.topic.id === 'secondaries' ? 'secondaries funds' : key.topic.noun.toLowerCase()}?`,
        a: `${n(forming)} of the ${n(people.length)} also list fund formation work, the setting up of a fund and its terms with investors.`,
      })
  }

  out.push(howListed(category))
  return out
}

/** The plain facts of how anyone gets on a list (the about page says the rest). */
function howListed(category: Category): Faq {
  const senior = SENIOR_ONLY.includes(category.id)
  return {
    q: `How does a ${category.singular.toLowerCase()} get on this list?`,
    a: `By being ${senior ? 'a partner, principal, shareholder or member' : 'someone'} whose firm's own website lists them for this work. FundOpsHQ reads each firm's public bio pages and dates every check. Nobody pays to be listed or to rank, and anyone listed can claim, correct or remove their profile.`,
    link: { href: '/directory/about', text: 'How the directory works' },
  }
}

export interface FirmListFaqInput {
  category: Category
  key: LandingKey
  ranked: RankedFirm[]
  verified: string | null
}

export function firmListFaq({ category, key, ranked, verified }: FirmListFaqInput): Faq[] {
  const out: Faq[] = []
  const where = key.place ? ` in ${key.place.name}` : ''
  const firms = firmsPhrase(category, key)
  const senior = SENIOR_ONLY.includes(category.id)
  const total = ranked.reduce((s, f) => s + f.count, 0)
  const what = key.topic?.kind === 'practice' ? ` for ${key.topic.work} work` : ''
  if (ranked.length >= 2) {
    out.push({
      q: `Which ${firms} have the most ${senior ? 'partners' : 'people'}${where}?`,
      a: `${listJoin(ranked.slice(0, 3).map((f) => `${f.name} (${n(f.count)})`))}. The counts are of ${senior ? 'partners' : 'people'} each firm's own website lists${what}${where}.`,
    })
  }
  out.push({
    q: `How many ${firms} does FundOpsHQ list${where}?`,
    a: `${n(ranked.length)} ${ranked.length === 1 ? 'firm' : 'firms'}, with ${n(total)} ${partnerWord(category, total)} between them.${verified ? ` Last checked ${verified}.` : ''}`,
  })
  if (!key.place) {
    const spread = [...ranked].filter((f) => f.cities.length >= 2).sort((a, b) => b.cities.length - a.cities.length || b.count - a.count || a.name.localeCompare(b.name, 'en')).slice(0, 3)
    if (spread.length >= 2)
      out.push({
        q: `Which firms have ${key.topic?.kind === 'practice' ? `${key.topic.work} ` : ''}${senior ? 'partners' : 'people'} in the most cities?`,
        a: `${listJoin(spread.map((f) => `${f.name} (${f.cities.length} cities)`))}, counting the US cities where the ${senior ? 'partners' : 'people'} listed here have an office.`,
      })
  }
  out.push({
    q: 'How is this list ordered?',
    a: `By the number of ${senior ? 'partners' : 'people'} each firm's own website lists${what}${where}, most first. Firms with the same number share a rank. It is a count, not a rating, and no firm pays to appear or to rank.`,
  })
  return out
}
