'use client'

import { useEffect, useRef, useState } from 'react'
import { INTERESTS, ROLES } from '@/lib/newsletter/interests'
import { ChoiceChips } from './ChoiceChips'

/**
 * The tick-boxes a new subscriber sees straight after signing up. Each tick
 * is saved on its own a moment later, so there is no button to press: the
 * reader ticks what they follow and carries on. `token` is the one the
 * subscribe route hands back for a subscription it has just started.
 */
export function FollowChoices({ token, onChange }: { token: string; onChange?: (interests: string[]) => void }) {
  const [interests, setInterests] = useState<string[]>([])
  const [role, setRole] = useState<string[]>([])
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const touched = useRef(false)

  useEffect(() => {
    if (!touched.current) return
    setState('saving')
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/newsletter/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, interests, role: role[0] }),
        })
        setState(res.ok ? 'saved' : 'error')
      } catch {
        setState('error')
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [token, interests, role])

  return (
    <div>
      <div className="space-y-2.5">
        <ChoiceChips
          legend="I follow"
          options={INTERESTS}
          selected={interests}
          compact
          onChange={(next) => {
            touched.current = true
            setInterests(next)
            onChange?.(next)
          }}
        />
        <ChoiceChips
          legend="I’m at a"
          options={ROLES}
          selected={role}
          single
          compact
          inline
          onChange={(next) => {
            touched.current = true
            setRole(next)
          }}
        />
      </div>
      <p className="mt-2 h-4 font-ui text-[12px] text-muted-foreground" role="status">
        {state === 'saved' && 'Saved.'}
        {state === 'error' && 'Could not save that. You can set it from the link in any edition.'}
      </p>
    </div>
  )
}
