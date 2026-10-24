'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FACETS, facetLabel, type FacetKey, type FacetValue, type PracticeMode, type XQuery } from '@/lib/directory/explore'
import css from './explore.module.css'

/**
 * The explorer's filters: one group of tick-boxes per facet, each saying how many people choosing it would leave
 * (lib/directory/explore.ts exploreCounts). Any of a group's ticks will do; every group must hold. A long group
 * (cities, firms, schools) shows its biggest values and a box to find the rest.
 *
 * Every box is a real form field (name = the facet, value = the key), so without JavaScript the form still submits
 * to the server, which renders the same query.
 */

const SHOW = 8

export function FacetRail({
  facets,
  counts,
  query,
  firmName,
  onToggle,
  onClear,
  onPracticeMode,
  hasPrimary,
  loading,
}: {
  facets: FacetKey[]
  counts: Record<FacetKey, FacetValue[]>
  query: XQuery
  firmName: (d: string) => string | undefined
  onToggle: (k: FacetKey, v: string) => void
  onClear: (k: FacetKey) => void
  onPracticeMode: (pm: PracticeMode) => void
  hasPrimary: boolean
  loading: boolean
}) {
  return (
    <div aria-busy={loading || undefined}>
      {FACETS.filter((f) => facets.includes(f.key)).map((f) => (
        <FacetGroup
          key={f.key}
          facet={f.key}
          label={f.label}
          many={Boolean(f.many)}
          values={counts[f.key] ?? []}
          chosen={query.f[f.key] ?? []}
          firmName={firmName}
          onToggle={onToggle}
          onClear={onClear}
          extra={
            f.key === 'practice' && hasPrimary ? (
              <div role="group" aria-label="Which practice counts" className="mb-1.5 flex gap-1">
                {(['any', 'primary'] as PracticeMode[]).map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    aria-pressed={query.pm === pm}
                    onClick={() => onPracticeMode(pm)}
                    className={`h-7 flex-1 rounded-[3px] border font-ui text-[12px] font-semibold ${query.pm === pm ? 'border-foreground bg-foreground text-background' : 'border-foreground/30 text-foreground hover:border-foreground'}`}
                  >
                    {pm === 'any' ? 'Any listed' : 'Primary only'}
                  </button>
                ))}
              </div>
            ) : null
          }
        />
      ))}
      {loading && <p className="pt-2 font-ui text-[12.5px] text-foreground/65">Counting everyone…</p>}
      {query.pm === 'primary' && <input type="hidden" form="xp-form" name="pm" value="primary" />}
      <noscript>
        <button type="submit" form="xp-form" className="mt-3 h-10 w-full rounded-[3px] bg-foreground font-ui text-[13px] font-bold text-background">
          Apply filters
        </button>
      </noscript>
    </div>
  )
}

function FacetGroup({
  facet,
  label,
  many,
  values,
  chosen,
  firmName,
  onToggle,
  onClear,
  extra,
}: {
  facet: FacetKey
  label: string
  many: boolean
  values: FacetValue[]
  chosen: string[]
  firmName: (d: string) => string | undefined
  onToggle: (k: FacetKey, v: string) => void
  onClear: (k: FacetKey) => void
  extra: React.ReactNode
}) {
  const id = useId()
  const [open, setOpen] = useState(true)
  const [all, setAll] = useState(false)
  const [find, setFind] = useState('')
  const picked = new Set(chosen)
  // Values that would leave nobody are not offered (a ticked one stays, so it can be unticked).
  const offered = values.filter((v) => v.count > 0 || picked.has(v.key))
  const label_ = (k: string) => facetLabel(facet, k, firmName)
  const needle = find.trim().toLowerCase()
  const matched = needle ? offered.filter((v) => label_(v.key).toLowerCase().includes(needle)) : offered
  // Ticked values first in a long list, so a choice never hides below "Show all".
  const ordered = many ? [...matched.filter((v) => picked.has(v.key)), ...matched.filter((v) => !picked.has(v.key))] : matched
  const shown = all || needle ? ordered : ordered.slice(0, SHOW)
  if (!offered.length) return null
  return (
    <fieldset className={css.facet}>
      <legend className="sr-only">{label}</legend>
      <div className="flex items-center gap-2">
        <button type="button" className={css.facetHead} aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen((o) => !o)}>
          <span>
            {label}
            {chosen.length > 0 && <span className="ml-1.5 font-ui text-[12px] font-semibold text-foreground/70">({chosen.length})</span>}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} aria-hidden="true" />
        </button>
        {chosen.length > 0 && (
          <button type="button" onClick={() => onClear(facet)} className="shrink-0 font-ui text-[12px] font-semibold text-foreground/75 underline underline-offset-2 hover:text-foreground">
            Clear<span className="sr-only"> {label}</span>
          </button>
        )}
      </div>
      <div id={`${id}-body`} hidden={!open} className="mt-1.5">
        {extra}
        {many && offered.length > 12 && (
          <input
            type="search"
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder={`Find a ${label.toLowerCase()}`}
            aria-label={`Find a ${label.toLowerCase()}`}
            className="mb-1 h-8 w-full rounded-[3px] border border-foreground/25 bg-card px-2 font-ui text-[13px] text-foreground focus:border-foreground focus:outline-none"
          />
        )}
        <ul>
          {shown.map((v) => (
            <li key={v.key}>
              <label className={`${css.opt} ${v.count === 0 ? css.optZero : ''}`}>
                <input type="checkbox" form="xp-form" name={facet} value={v.key} checked={picked.has(v.key)} onChange={() => onToggle(facet, v.key)} />
                <span className="truncate" title={label_(v.key)}>
                  {label_(v.key)}
                </span>
                <span className={css.ct}>{v.count.toLocaleString('en-US')}</span>
              </label>
            </li>
          ))}
        </ul>
        {needle && !matched.length && <p className="py-1 font-ui text-[12.5px] text-foreground/65">None by that name.</p>}
        {!needle && ordered.length > SHOW && (
          <button type="button" onClick={() => setAll((a) => !a)} className="mt-0.5 min-h-[28px] font-ui text-[12.5px] font-semibold text-foreground underline underline-offset-2">
            {all ? 'Show fewer' : `Show all ${ordered.length.toLocaleString('en-US')}`}
          </button>
        )}
      </div>
    </fieldset>
  )
}
