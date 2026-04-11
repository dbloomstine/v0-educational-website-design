#!/usr/bin/env npx tsx
/**
 * Preview the FundOps Daily welcome email (sent on single-opt-in
 * signup) by rendering it to a local HTML file and opening it.
 *
 * Usage:
 *   npx tsx scripts/preview-welcome-email.ts
 */

import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { renderWelcomeEmail } from '../lib/newsletter/welcome-email'

const OUTPUT_PATH = '/tmp/fundops-welcome-preview.html'

const html = renderWelcomeEmail('https://fundopshq.com/api/newsletter/unsubscribe?token=PREVIEW')
writeFileSync(OUTPUT_PATH, html, 'utf8')
console.log(`Wrote ${OUTPUT_PATH} (${(html.length / 1024).toFixed(1)} KB)`)

try {
  execSync(`open "${OUTPUT_PATH}"`)
  console.log('Opened in default browser.')
} catch {
  console.log(`Open manually: file://${OUTPUT_PATH}`)
}
