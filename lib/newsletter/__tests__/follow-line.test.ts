import { describe, it, expect } from 'vitest'
import { followLineHtml } from '../follow-line'
import { renderWelcomeEmail } from '../welcome-email'
import { renderNewsletterEmail } from '../email-template'

describe('the follow line at the foot of the emails', () => {
  const line = followLineHtml()
  it('names the page, TikTok and the editor, each with its own address', () => {
    expect(line).toContain('href="https://www.linkedin.com/company/fundopshq"')
    expect(line).toContain('href="https://www.tiktok.com/@fundopshq"')
    expect(line).toContain('href="https://www.linkedin.com/in/danny-bloomstine/"')
    expect(line.match(/<a /g)).toHaveLength(3)
  })
  it('is in the welcome email and the daily email, once each', () => {
    expect(renderWelcomeEmail('https://fundopshq.com/u').split(line)).toHaveLength(2)
    const daily = renderNewsletterEmail({ groups: [], totalArticles: 0, editionDate: '2026-10-12', unsubscribeUrl: 'https://fundopshq.com/u' })
    expect(daily.split(line)).toHaveLength(2)
  })
})
