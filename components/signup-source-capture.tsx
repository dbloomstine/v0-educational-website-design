'use client'

import { useEffect } from 'react'
import { captureSignupSource } from '@/lib/newsletter/signup-source'

/**
 * Renders nothing. On the first page view of a session it notes how the
 * visitor arrived (see lib/newsletter/signup-source.ts), so the subscribe
 * forms can say where a signup came from. Mounted once, in the root layout.
 */
export function SignupSourceCapture() {
  useEffect(() => {
    captureSignupSource()
  }, [])
  return null
}
