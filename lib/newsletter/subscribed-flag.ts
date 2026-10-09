/**
 * "This browser belongs to a subscriber": set when any subscribe form
 * succeeds, read by the signup card so it never asks someone who has already
 * said yes. Stays on the device; nothing is sent anywhere.
 */
import { SUBSCRIBED_KEY } from './prompt-rules'

export function markSubscribed(): void {
  try {
    window.localStorage.setItem(SUBSCRIBED_KEY, '1')
  } catch {
    // storage blocked: the card may ask again on a later visit
  }
}

export function isMarkedSubscribed(): boolean {
  try {
    return window.localStorage.getItem(SUBSCRIBED_KEY) === '1'
  } catch {
    return false
  }
}
