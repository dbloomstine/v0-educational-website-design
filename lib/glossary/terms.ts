/**
 * The glossary (2026-10-12): 88 private-markets terms, at /glossary and
 * /glossary/<slug>, for the reader who searches "what is a clawback".
 *
 * The terms are the social desk's (fundopshq-social, engine/terms.mjs): one is
 * explained a day in a short video, so its definition, example and "why it
 * matters" were written once and checked by a person, and the two texts stay
 * the same word for word. The explanation and the related terms were written
 * here by the Claude API (scripts/glossary/write-terms.mjs) and read through.
 * `terms.json` is the committed source; edit it, not this file, to correct a
 * term, and keep the definition in step with the social desk's copy.
 */
import data from './terms.json'

export interface GlossaryTerm {
  /** The address: /glossary/<slug>. The social desk's id for the same term. */
  slug: string
  term: string
  /** The question people search: "What is a clawback?" */
  title: string
  group: string
  /** What it is, in one or two sentences, as a careful practitioner would accept it. */
  define: string
  /** Two or three sentences more: how it works in practice, where it turns up, what varies. */
  explanation: string
  /** Round, illustrative numbers, framed as an example. Never a real fund. */
  example: string
  /** One sentence on why it matters or who it bites. */
  why: string
  /** Slugs of the terms a reader of this one would want next. */
  related: string[]
  /** When a story's headline or summary uses the term (a JavaScript regular expression). */
  match: { source: string; flags: string }
  /** The term is common in ordinary headlines, so a match is a weaker signal. */
  generic?: boolean
}

export const GLOSSARY_GROUPS: readonly string[] = data.groups
export const GLOSSARY_TERMS: readonly GlossaryTerm[] = data.terms as GlossaryTerm[]

const BY_SLUG = new Map(GLOSSARY_TERMS.map((t) => [t.slug, t]))

export function getTerm(slug: string): GlossaryTerm | undefined {
  return BY_SLUG.get(slug)
}

export const glossaryHref = (slug: string) => `/glossary/${slug}`

/** The related terms, resolved; an unknown slug is dropped rather than shown as a dead link. */
export function relatedTerms(t: GlossaryTerm): GlossaryTerm[] {
  return t.related.map((s) => BY_SLUG.get(s)).filter((x): x is GlossaryTerm => !!x && x.slug !== t.slug)
}

/** The terms in their groups, in the groups' order, alphabetical within each. */
export function termsByGroup(): { group: string; terms: GlossaryTerm[] }[] {
  return GLOSSARY_GROUPS.map((group) => ({
    group,
    terms: GLOSSARY_TERMS.filter((t) => t.group === group).sort((a, b) => a.term.localeCompare(b.term, 'en-US', { sensitivity: 'base' })),
  })).filter((g) => g.terms.length > 0)
}

/** A term's pattern, compiled: the social desk's own test for whether a story uses it. */
export function termMatcher(t: GlossaryTerm): RegExp {
  return new RegExp(t.match.source, t.match.flags)
}

/** The stories (headline and summary) that use the term, newest first, at most `max`. */
export function storiesUsing<S extends { headline: string; summary?: string | null }>(t: GlossaryTerm, stories: readonly S[], max = 6): S[] {
  const re = termMatcher(t)
  const out: S[] = []
  for (const s of stories) {
    if (re.test(`${s.headline}\n${s.summary ?? ''}`)) out.push(s)
    if (out.length >= max) break
  }
  return out
}

/** "What is a clawback? | FundOpsHQ" (the layout adds the suffix) fits a search result's title. */
export const termPageTitle = (t: GlossaryTerm) => t.title
