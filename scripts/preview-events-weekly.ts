/**
 * Renders the Monday events email (lib/events/weekly-email.ts) to /tmp. Sends nothing.
 *
 *   npx tsx --env-file=.env.local scripts/preview-events-weekly.ts            the board as it is, no city
 *   CITY=chicago npx tsx --env-file=.env.local scripts/preview-events-weekly.ts
 *   FIXTURE=1 CITY=chicago npx tsx scripts/preview-events-weekly.ts           the test fixture, no database
 *
 * Writes /tmp/fundops-events-weekly.html and .txt (subject on the first line of the .txt).
 */
import { writeFileSync } from 'node:fs'
import { planForReader, renderWeeklyEmail, renderWeeklyText, selectWeeklyEvents, weeklySubject } from '../lib/events/weekly-email'
import { FIXTURE_EVENTS, FIXTURE_TODAY } from '../lib/events/__tests__/weekly-fixture'

async function main() {
  const city = (process.env.CITY ?? '').trim().toLowerCase()
  const fixture = process.env.FIXTURE === '1'
  let events = FIXTURE_EVENTS
  let todayIso = FIXTURE_TODAY
  if (!fixture) {
    const { loadUpcomingEvents } = await import('../lib/events/weekly-send')
    const { newYorkToday } = await import('../lib/events/highlights')
    events = await loadUpcomingEvents()
    todayIso = newYorkToday()
  }
  const plan = planForReader(selectWeeklyEvents(events, todayIso), city ? [city] : [])
  const params = { plan, todayIso, eventsUnsubscribeUrl: 'https://fundopshq.com/api/newsletter/events-unsubscribe?token=TOKEN', unsubscribeAllUrl: 'https://fundopshq.com/api/newsletter/unsubscribe?token=TOKEN' }
  const html = renderWeeklyEmail(params)
  const text = `Subject: ${weeklySubject(plan)}\n\n${renderWeeklyText(params)}`
  writeFileSync('/tmp/fundops-events-weekly.html', html)
  writeFileSync('/tmp/fundops-events-weekly.txt', text)
  console.log(`${weeklySubject(plan)}\n${plan.sections.map((s) => `  ${s.title}: ${s.events.length}`).join('\n')}\nHTML ${Buffer.byteLength(html)} bytes → /tmp/fundops-events-weekly.html, text → /tmp/fundops-events-weekly.txt`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
