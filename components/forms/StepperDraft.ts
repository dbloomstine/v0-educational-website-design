'use client'

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * A form's answers kept in sessionStorage, so a reload (or a tap on a link and
 * back) doesn't lose them. Per tab, gone when the tab closes. Storage can be
 * blocked (private windows, strict settings): every read and write is in a
 * try/catch and the form works without it.
 *
 * The saved copy is read after the first render (never during it), so the
 * page the server sent and the first render in the browser agree.
 */
export function readSession<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeSession(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage blocked or full: the answers still live in memory for this page
  }
}

export function removeSession(...keys: string[]): void {
  try {
    for (const k of keys) window.sessionStorage.removeItem(k)
  } catch {
    // nothing to clear
  }
}

/** The key the stepper keeps its place under, next to the answers. */
export const positionKey = (key: string) => `${key}:pos`

export function useSessionDraft<T extends object>(
  key: string,
  initial: T,
  restore: (saved: Partial<T>, initial: T) => T = (saved, init) => ({ ...init, ...saved }),
): [T, Dispatch<SetStateAction<T>>, { clear: () => void }] {
  const [values, setValues] = useState<T>(initial)
  const restored = useRef(false)
  const restoreRef = useRef(restore)
  const initialRef = useRef(initial)

  useEffect(() => {
    const saved = readSession<Partial<T>>(key)
    if (saved && typeof saved === 'object') setValues(restoreRef.current(saved, initialRef.current))
    restored.current = true
  }, [key])

  useEffect(() => {
    if (restored.current) writeSession(key, values)
  }, [key, values])

  const clear = useCallback(() => {
    removeSession(key, positionKey(key))
  }, [key])

  return [values, setValues, { clear }]
}
