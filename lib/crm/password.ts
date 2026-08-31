import { scryptSync, timingSafeEqual, randomBytes } from 'node:crypto'

/**
 * Node-only. Never import from middleware (edge runtime has no node:crypto).
 * Stored format: `scrypt:<saltHex>:<hashHex>`
 *
 * Separator is ':' not '$' on purpose — dotenv expansion in .env files treats
 * `$name` as a variable reference and would silently eat the salt and hash.
 *
 * Generate a hash with:  node scripts/hash-desk-password.mjs
 */

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false
  const parts = stored.split(':')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  try {
    const salt = Buffer.from(parts[1], 'hex')
    const expected = Buffer.from(parts[2], 'hex')
    if (expected.length === 0) return false
    const actual = scryptSync(password, salt, expected.length)
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}
