#!/usr/bin/env node
/**
 * Generates CRM_PASSWORD_HASH and CRM_SESSION_SECRET for Lead Desk.
 *
 *   node scripts/hash-desk-password.mjs
 *
 * The plaintext password is never stored anywhere — only the scrypt hash goes
 * into the environment. Keep the password in your password manager.
 */
import { scryptSync, randomBytes } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const rl = createInterface({ input: stdin, output: stdout })
const pw = await rl.question('New Lead Desk password: ')
rl.close()

if (!pw || pw.length < 16) {
  console.error('\nUse at least 16 characters. Generate one in your password manager.')
  process.exit(1)
}

const salt = randomBytes(16)
const hash = scryptSync(pw, salt, 64)

console.log('\nAdd these to .env.local and to Vercel (Production + Preview):\n')
console.log(`CRM_PASSWORD_HASH=scrypt:${salt.toString('hex')}:${hash.toString('hex')}`)
console.log(`CRM_SESSION_SECRET=${randomBytes(32).toString('hex')}`)
console.log('\nAlso needed:')
console.log('CRM_SUPABASE_URL=https://chyawefctesysoioxuwl.supabase.co')
console.log('CRM_SUPABASE_SERVICE_ROLE_KEY=<from the danny-lead-crm dashboard>\n')
