/**
 * Holds the ads while the signup takeover covers the page (2026-10-23).
 *
 * The takeover (components/newsletter/SignupTakeover.tsx) is a full page over
 * the site. An ad requested behind it would be an impression nobody can see,
 * which AdSense counts against the site. So the takeover calls `holdAds()` the
 * moment it decides to open (before its short wait for data) and
 * `releaseAds()` when it closes; an ad slot asks `whenAdsClear` before it
 * requests its ad.
 */

let held = false
const waiting = new Set<() => void>()

export function holdAds(): void {
  held = true
}

export function releaseAds(): void {
  held = false
  const run = [...waiting]
  waiting.clear()
  for (const fn of run) fn()
}

export function adsHeld(): boolean {
  return held
}

/** Runs `fn` now if nothing covers the page, else when it clears. Returns a cancel. */
export function whenAdsClear(fn: () => void): () => void {
  if (!held) {
    fn()
    return () => {}
  }
  waiting.add(fn)
  return () => {
    waiting.delete(fn)
  }
}
