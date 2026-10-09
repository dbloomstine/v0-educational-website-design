'use client'

import { useEffect } from 'react'
import { markSubscribed } from '@/lib/newsletter/subscribed-flag'

/**
 * Renders nothing. When a subscriber reaches /sponsor from their own copy of
 * the email, the link carries `r=<their subscriber id>`: this tells the site
 * (app/api/sponsor/interest), then takes the id out of the address bar so it
 * is not passed on if they share the page.
 */
export function ReaderBeacon() {
  useEffect(() => {
    const url = new URL(window.location.href)
    const r = url.searchParams.get('r')
    if (!r) return
    markSubscribed()
    fetch('/api/sponsor/interest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ r }), keepalive: true }).catch(() => {})
    url.searchParams.delete('r')
    window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash)
  }, [])
  return null
}
