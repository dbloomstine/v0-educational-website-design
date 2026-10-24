import type { PersonCard } from '../people'

let n = 0
export function card(over: Partial<PersonCard> = {}): PersonCard {
  n++
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    category: 'fund_lawyer',
    slug: `person-${n}`,
    full_name: `Jane Person${n}`,
    title: 'Partner',
    firm_name: 'Kirkland & Ellis',
    firm_domain: 'kirkland.com',
    offices: [{ city: 'New York', state: 'NY' }],
    practice_areas: ['fund_formation'],
    client_focus: [],
    represents: [],
    status: 'published',
    missing_since: null,
    claimed_at: null,
    claimed_practice_areas: null,
    ...over,
  }
}
