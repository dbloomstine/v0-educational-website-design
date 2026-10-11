/**
 * FundOpsHQ's own accounts on the networks where the day's stories are posted (the social desk, a separate
 * repository, posts about thirteen times a day to each). One place for the addresses, so the footer, the
 * structured data and anything added later agree.
 */
export const SOCIAL = [
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/fundopshq' },
  { name: 'TikTok', href: 'https://www.tiktok.com/@fundopshq' },
] as const

/** The editor's own profile. Danny (2026-10-11): wherever the site points at LinkedIn it shows his profile and the page. */
export const EDITOR = { name: 'Danny Bloomstine', href: 'https://www.linkedin.com/in/danny-bloomstine/' } as const

/** The follow line, in the one order it is always written: the page, TikTok, then the editor. */
export const FOLLOW = [
  { label: 'FundOpsHQ on LinkedIn', href: SOCIAL[0].href },
  { label: 'TikTok', href: SOCIAL[1].href },
  { label: `${EDITOR.name} on LinkedIn`, href: EDITOR.href },
] as const
