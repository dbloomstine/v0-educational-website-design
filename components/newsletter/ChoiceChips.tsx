'use client'

import { useId } from 'react'
import { Check } from 'lucide-react'

/**
 * A row of tick-boxes drawn as chips. Real checkboxes underneath, so they
 * work from the keyboard and read correctly to a screen reader. With
 * `single`, ticking one clears the others (and ticking it again clears it).
 * `inline` puts the label on the same line as the chips, where height is short.
 */
export function ChoiceChips({
  legend,
  options,
  selected,
  onChange,
  single = false,
  compact = false,
  inline = false,
}: {
  legend: string
  options: ReadonlyArray<{ id: string; label: string }>
  selected: string[]
  onChange: (next: string[]) => void
  single?: boolean
  compact?: boolean
  inline?: boolean
}) {
  const labelId = useId()
  function toggle(id: string) {
    const on = selected.includes(id)
    if (single) onChange(on ? [] : [id])
    else onChange(on ? selected.filter((s) => s !== id) : [...selected, id])
  }

  return (
    <div role="group" aria-labelledby={labelId} className={inline ? `flex flex-wrap items-center ${compact ? 'gap-1.5' : 'gap-2'}` : 'min-w-0'}>
      <p id={labelId} className={`font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground ${inline ? 'mr-1' : ''}`}>
        {legend}
      </p>
      <div className={inline ? 'contents' : `mt-1.5 flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {options.map((o) => {
          const on = selected.includes(o.id)
          return (
            <label key={o.id} className="cursor-pointer select-none">
              <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggle(o.id)} />
              <span
                className={`inline-flex items-center gap-1 rounded-sm border font-ui font-semibold leading-none transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground ${
                  compact ? 'h-[30px] px-2.5 text-[12.5px]' : 'h-9 px-3 text-[13.5px]'
                } ${
                  on
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-foreground/30 bg-background text-foreground hover:border-foreground'
                }`}
              >
                {on && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
                {o.label}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
