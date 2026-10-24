/**
 * What people type, mapped to the one page that answers it (2026-10-24, Danny: "optimize for someone googling like
 * 'venture capital lawyer' or 'hedge fund law firm' or 'lawyer to help set up a private equity fund'").
 *
 * The research behind every name here is ~/fundopshq-workspace/docs/directory/research/2026-10-24-intent-map.md
 * (Google autocomplete and who ranks; no volumes). Its findings, as rules:
 *   - "lawyer" and "law firm" are two searches: a person list (/fund-lawyers/hedge-funds) and a firm list
 *     (/fund-lawyers/hedge-funds/firms) answer them, one page each;
 *   - "venture capital lawyer" is mostly the startup side; the fund side types "venture fund" or "VC fund", so the
 *     heading says "Venture Fund Lawyers" and the variants carry "VC fund formation";
 *   - "attorney" is the title tag's second word, "lawyer" the heading's; "CPA" and "accountant" are real fund-tax
 *     searches, "fund tax advisor" barely is;
 *   - auditor searches are almost all firm searches, so an auditor page puts its firms high.
 *
 * Each intent has ONE canonical page. A variant phrase appears once, where it reads naturally (a subhead, a question):
 * never a list of keywords (Google's spam policies: developers.google.com/search/docs/essentials/spam-policies).
 * Pure, so tested.
 */
import { PRACTICE_BY_ID, type Category, type CategoryId } from './taxonomy'

export interface Intent {
  /** The page's heading, the phrase with the best demand: "Hedge Fund Lawyers". */
  head: string
  /** The heading tried first in the title tag (it may not fit): "Hedge Fund Lawyers & Attorneys". */
  titleAlt: string | null
  /** The people, as a variant phrase in a sentence: "hedge fund attorneys". */
  people: string
  /** The firm search's name: "Hedge Fund Law Firms" (the /firms page's heading). */
  firms: string
}

type Override = Partial<Intent>

/** Words a trade uses for its people and its firms. */
const TRADE_WORDS: Record<CategoryId, { person: string; alt: string | null; firm: string; peopleAlt: (adj: string) => string }> = {
  fund_lawyer: { person: 'Lawyers', alt: 'Lawyers & Attorneys', firm: 'Law Firms', peopleAlt: (a) => `${a} attorneys` },
  fund_auditor: { person: 'Auditors', alt: 'Auditors & Audit Partners', firm: 'Audit Firms', peopleAlt: (a) => `${a} audit partners` },
  fund_tax_advisor: { person: 'Tax Advisors', alt: 'Tax Advisors & Accountants', firm: 'Tax and Accounting Firms', peopleAlt: (a) => `${a} tax accountants` },
  placement_agent: { person: 'Placement Agents', alt: null, firm: 'Placement Firms', peopleAlt: (a) => `${a} placement agents` },
  fund_finance_banker: { person: 'Bankers', alt: null, firm: 'Banks', peopleAlt: (a) => `${a} bankers` },
}

/** The trade as a whole: the hub (lawyers' hub heading comes from the folded practice) and /<trade>/firms. */
const ROOT: Partial<Record<CategoryId, Override>> = {
  fund_lawyer: { people: 'private fund attorneys', firms: 'Private Fund Law Firms' },
  fund_auditor: { people: 'private fund audit partners', firms: 'Private Fund Audit Firms' },
  fund_tax_advisor: { people: 'fund tax accountants', firms: 'Fund Tax and Accounting Firms' },
}

/** Where the default ("<Adj> <Trade>") is not what people type. Keyed `<trade>:<practice or focus id>`. */
const OVERRIDES: Record<string, Override> = {
  'fund_lawyer:venture_funds': { people: 'VC fund attorneys', firms: 'Venture Capital Fund Law Firms' },
  'fund_lawyer:buyout_funds': { people: 'private equity fund attorneys', firms: 'Private Equity Fund Law Firms' },
    'fund_lawyer:real_estate_funds': { people: 'real estate fund attorneys' },
  'fund_lawyer:private_credit_funds': { firms: 'Private Credit Law Firms' },
  'fund_lawyer:funds_regulatory': {
    head: 'Investment Adviser and Fund Regulatory Lawyers',
    titleAlt: 'SEC and Investment Adviser Lawyers',
    people: 'investment adviser regulatory attorneys',
    firms: 'Investment Adviser Regulatory Law Firms',
  },
  'fund_lawyer:emerging_managers': { head: 'Lawyers for Emerging Fund Managers', titleAlt: 'Emerging Manager Fund Lawyers', people: 'attorneys for emerging managers' },
  'fund_lawyer:first_time_funds': { head: 'Lawyers for First-Time Funds', titleAlt: 'First-Time Fund Lawyers', people: 'first-time fund attorneys' },
  'fund_auditor:venture_funds': { firms: 'Venture Capital Fund Audit Firms', people: 'VC fund audit partners' },
  'fund_auditor:buyout_funds': { people: 'PE fund audit partners' },
  'fund_tax_advisor:hedge_funds': { titleAlt: 'Hedge Fund Tax Advisors & CPAs', people: 'hedge fund tax accountants' },
  'fund_tax_advisor:venture_funds': { titleAlt: 'Venture Fund Tax Advisors & CPAs', people: 'VC fund tax accountants' },
  'fund_tax_advisor:buyout_funds': { titleAlt: 'Private Equity Tax Advisors & CPAs', people: 'private equity tax accountants' },
}

const lowerWords = (s: string) =>
  s
    .split(' ')
    .map((w) => (/^[A-Z]{2,}s?$/.test(w) || /^[A-Z]{2,}-/.test(w) ? w : w.toLowerCase()))
    .join(' ')

/**
 * The intent behind a trade's page for a topic (a practice or a client focus), or the trade itself (null).
 * Sides (GP / LP counsel) and other client focuses keep their plain names.
 */
export function intentFor(category: Category, topicId: string | null): Intent {
  const w = TRADE_WORDS[category.id]
  if (!topicId) {
    const r = ROOT[category.id] ?? {}
    return { head: category.plural, titleAlt: null, people: r.people ?? category.plural.toLowerCase(), firms: r.firms ?? `${category.plural} by Firm` }
  }
  const o = OVERRIDES[`${category.id}:${topicId}`] ?? {}
  const p = PRACTICE_BY_ID.get(topicId as never)
  if (p && p.adj && category.topicStyle === 'adj') {
    const head = o.head ?? `${p.adj} ${w.person}`
    return {
      head,
      titleAlt: o.titleAlt !== undefined ? o.titleAlt : w.alt ? `${p.adj} ${w.alt}` : null,
      people: o.people ?? w.peopleAlt(lowerWords(p.adj)),
      firms: o.firms ?? `${p.adj} ${w.firm}`,
    }
  }
  return { head: o.head ?? '', titleAlt: o.titleAlt ?? null, people: o.people ?? '', firms: o.firms ?? '' }
}

/** The intent's heading for a topic, or null where the plain name stands (lib/directory/landing.ts topicTitle). */
export function intentHead(category: Category, topicId: string): string | null {
  return intentFor(category, topicId).head || null
}

// ── The search box: synonyms (2026-10-24) ───────────────────────────────────
// Typing "VC", "PE" or "attorney" works: a strategy's everyday words find its people, and the trade's own words
// ("lawyer", "law firm", "CPA") and filler ("to help set up a") are soft: they count when they match a name or a
// firm, and never empty the list when they do not.

/** A practice's everyday words, folded (lower case, no punctuation). Whole words only. */
export const PRACTICE_WORDS: Record<string, string[]> = {
  venture_funds: ['vc', 'vcs', 'venture', 'ventures'],
  buyout_funds: ['pe', 'buyout', 'buyouts', 'lbo', 'equity'],
  hedge_funds: ['hedge', 'hedgefund', 'hedgefunds'],
  real_estate_funds: ['real', 'estate', 'realestate', 'reit', 'reits', 'property'],
  private_credit_funds: ['credit', 'debt', 'bdc', 'bdcs'],
  infrastructure_funds: ['infrastructure', 'infra'],
  secondaries: ['secondaries', 'secondary', 'continuation'],
  fund_formation: ['formation', 'formations', 'forming', 'launch', 'launching', 'setup'],
  fund_finance: ['finance', 'financing', 'subscription', 'nav'],
  funds_regulatory: ['regulatory', 'sec', 'compliance', 'ria', 'registration'],
  tax_funds: ['taxation'],
  subscription_lines: ['subscription', 'sub'],
  nav_lending: ['nav'],
  gp_financing: ['gp'],
}

/** Words that never exclude anyone: the trades' own nouns and the filler of a typed question. */
export const SOFT_WORDS = new Set(
  (
    'lawyer lawyers attorney attorneys counsel law legal firm firms auditor auditors audit audits auditing accountant accountants accounting ' +
    'cpa cpas tax taxes advisor advisors adviser advisers advisory fund funds private partner partners investment investments capital ' +
    'the a an for of to in at near me best top help helping set up setting start starting my our who with and services service specialist ' +
    'specialists manager managers management lawfirm emerging first time new'
  ).split(' '),
)

/** A person's practices as searchable words. */
export function practiceWords(practices: string[]): string[] {
  return [...new Set(practices.flatMap((p) => PRACTICE_WORDS[p] ?? []))]
}
