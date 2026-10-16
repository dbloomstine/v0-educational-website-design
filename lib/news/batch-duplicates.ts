/**
 * In-batch duplicates the classifier points out.
 *
 * The classifier reads up to fifteen articles in one call and, since
 * classification_note exists (2026-10-14), says when one of them is a copy of
 * another in the batch: "Duplicate of article ID 5; …", "Duplicate of id 0:
 * …", "Duplicate/abbreviated version of article id=5", "… Duplicate of id 8."
 * Until 2026-10-16 nothing read the note, and news_items.is_duplicate was
 * never set by the pipeline (0 rows in the seven days before).
 *
 * The note is the model's word, so a flagged pair is marked only when the two
 * rows corroborate it: the same story by the site's own rules, near-identical
 * headlines, or the same outlet with headlines that overlap. The noted row
 * (the copy, in the model's reading) is the lesser one; the row it points at
 * is kept and becomes canonical_article_id. When each points at the other,
 * the one with less text is the copy.
 *
 * Pure: the classifier passes what it has and applies the answer.
 */
import { isSameStory, titleJaccard } from './story-dedup'

/** Batch ids ("id" echoed in the prompt, 0-based) a note says this article duplicates. Empty when it says nothing of the kind. */
export function duplicateNoteTargets(note: string | null | undefined): number[] {
  if (!note) return []
  const out = new Set<number>()
  // "duplicate … id 5", "duplicate … ID=5", "duplicate … article 5", "duplicates ids 5 and 7"
  const re = /\bdup(?:licate|licates|licated|e)\b[^.;]*?\b(?:articles?|items?|ids?)\s*(?:ids?)?\s*[=:#]?\s*(\d{1,2}(?:\s*(?:,|and|&|\/)\s*(?:id\s*)?\d{1,2})*)/gi
  for (const m of note.matchAll(re)) {
    for (const n of m[1].match(/\d{1,2}/g) ?? []) out.add(Number(n))
  }
  return Array.from(out).sort((a, b) => a - b)
}

export interface BatchRow {
  id: string
  title: string
  sourceName: string | null
  /** Characters of description and stored text, for choosing the thinner copy. */
  textLength: number
  firmName: string | null
  fundName: string | null
  fundSizeUsdMillions: number | null
  personName?: string | null
  closeType?: string | null
  eventType?: string | null
  /** The classification note the model wrote for this row. */
  note: string | null
}

export interface DuplicateMark {
  /** The row to mark is_duplicate. */
  id: string
  /** The row it duplicates (canonical_article_id). */
  canonicalId: string
  reason: string
}

const outletKey = (s: string | null) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

/** Would the site's own rules, or the headlines, call these one article? */
export function corroborated(a: BatchRow, b: BatchRow): string | null {
  const j = titleJaccard(a.title, b.title)
  if (j >= 0.7) return 'near-identical headlines'
  if (outletKey(a.sourceName) && outletKey(a.sourceName) === outletKey(b.sourceName) && j >= 0.3) return 'same outlet, overlapping headlines'
  if (isSameStory(a, b)) return 'same story by the site’s rules'
  return null
}

/**
 * The marks to apply for one classified batch, in batch order. `rows[i]` is
 * the article the prompt called id i. A target outside the batch, the row
 * itself, or a pair the rows do not bear out is ignored. One mark per row.
 */
export function batchDuplicateMarks(rows: BatchRow[]): DuplicateMark[] {
  const marks = new Map<string, DuplicateMark>()
  const marked = new Set<string>()
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    for (const t of duplicateNoteTargets(row.note)) {
      if (t === i || t < 0 || t >= rows.length) continue
      const target = rows[t]
      if (marked.has(row.id) || marked.has(target.id)) continue
      const why = corroborated(row, target)
      if (!why) continue
      // Mutual notes: the thinner row is the copy.
      const mutual = duplicateNoteTargets(target.note).includes(i)
      const copy = mutual && target.textLength < row.textLength ? target : row
      const kept = copy === row ? target : row
      marks.set(copy.id, { id: copy.id, canonicalId: kept.id, reason: why })
      marked.add(copy.id)
      break
    }
  }
  return Array.from(marks.values())
}
