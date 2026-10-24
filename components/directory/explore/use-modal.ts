'use client'

import { useEffect, type RefObject } from 'react'

/** Focus into a dialog, keep it there, Escape closes, and the page behind does not scroll. */
export function useModal(ref: RefObject<HTMLElement | null>, onClose: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const el = ref.current
    const before = document.activeElement as HTMLElement | null
    ;(el?.querySelector('h2[tabindex="-1"]') as HTMLElement | null)?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !el) return
      const f = [...el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, [tabindex="0"]')].filter((x) => x.offsetParent !== null)
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('keydown', key)
      document.body.style.overflow = prev
      before?.focus?.({ preventScroll: true })
    }
  }, [ref, onClose, active])
}

