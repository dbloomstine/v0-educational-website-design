/**
 * The places a directory landing page can be about: a known list of US cities
 * (the fund-law markets), and every state for the smaller ones.
 *
 * Closed lists, so an address is never guessed from data: /fund-lawyers/<x>
 * is a city only when <x> is one of these. A state's address never equals a
 * city's: the state of New York is "new-york-state", Washington state is
 * "washington-state", and the capital is "washington-dc".
 */

export interface Office {
  city: string
  state: string
}

export interface City {
  slug: string
  name: string
  /** Two-letter code. */
  state: string
  /** Other names for the same market, lower case ("century city" is Los Angeles). */
  aliases?: string[]
}

export const CITIES: City[] = [
  { slug: 'new-york', name: 'New York', state: 'NY', aliases: ['new york city', 'nyc', 'manhattan'] },
  { slug: 'boston', name: 'Boston', state: 'MA' },
  { slug: 'chicago', name: 'Chicago', state: 'IL' },
  { slug: 'los-angeles', name: 'Los Angeles', state: 'CA', aliases: ['century city', 'santa monica'] },
  { slug: 'san-francisco', name: 'San Francisco', state: 'CA' },
  { slug: 'palo-alto', name: 'Palo Alto', state: 'CA' },
  { slug: 'menlo-park', name: 'Menlo Park', state: 'CA' },
  { slug: 'san-diego', name: 'San Diego', state: 'CA' },
  { slug: 'orange-county', name: 'Orange County', state: 'CA', aliases: ['irvine', 'newport beach', 'costa mesa'] },
  { slug: 'washington-dc', name: 'Washington, D.C.', state: 'DC', aliases: ['washington', 'washington dc', 'washington d c'] },
  { slug: 'houston', name: 'Houston', state: 'TX' },
  { slug: 'dallas', name: 'Dallas', state: 'TX' },
  { slug: 'austin', name: 'Austin', state: 'TX' },
  { slug: 'miami', name: 'Miami', state: 'FL' },
  { slug: 'west-palm-beach', name: 'West Palm Beach', state: 'FL', aliases: ['palm beach'] },
  { slug: 'atlanta', name: 'Atlanta', state: 'GA' },
  { slug: 'philadelphia', name: 'Philadelphia', state: 'PA' },
  { slug: 'pittsburgh', name: 'Pittsburgh', state: 'PA' },
  { slug: 'charlotte', name: 'Charlotte', state: 'NC' },
  { slug: 'denver', name: 'Denver', state: 'CO' },
  { slug: 'seattle', name: 'Seattle', state: 'WA' },
  { slug: 'minneapolis', name: 'Minneapolis', state: 'MN' },
  { slug: 'wilmington', name: 'Wilmington', state: 'DE' },
  { slug: 'stamford', name: 'Stamford', state: 'CT' },
  { slug: 'greenwich', name: 'Greenwich', state: 'CT' },
  { slug: 'cleveland', name: 'Cleveland', state: 'OH' },
  { slug: 'columbus', name: 'Columbus', state: 'OH' },
  { slug: 'detroit', name: 'Detroit', state: 'MI' },
  { slug: 'nashville', name: 'Nashville', state: 'TN' },
  { slug: 'baltimore', name: 'Baltimore', state: 'MD' },
  { slug: 'phoenix', name: 'Phoenix', state: 'AZ' },
  { slug: 'salt-lake-city', name: 'Salt Lake City', state: 'UT' },
  { slug: 'st-louis', name: 'St. Louis', state: 'MO', aliases: ['saint louis', 'st louis'] },
  { slug: 'kansas-city', name: 'Kansas City', state: 'MO' },
  { slug: 'milwaukee', name: 'Milwaukee', state: 'WI' },
  { slug: 'richmond', name: 'Richmond', state: 'VA' },
  { slug: 'portland', name: 'Portland', state: 'OR' },
  { slug: 'princeton', name: 'Princeton', state: 'NJ' },
  { slug: 'newark', name: 'Newark', state: 'NJ' },
]

export const STATES: { code: string; name: string }[] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'],
  ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'],
  ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
].map(([code, name]) => ({ code, name }))

const STATE_BY_CODE = new Map(STATES.map((s) => [s.code, s]))
const STATE_BY_NAME = new Map(STATES.map((s) => [s.name.toLowerCase(), s]))

const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const CITY_SLUGS = new Set(CITIES.map((c) => c.slug))

/** A state's page address: its name, unless a city has that address ("new-york-state", "washington-state"). */
export function stateSlug(code: string): string | null {
  const s = STATE_BY_CODE.get(code)
  if (!s) return null
  if (s.code === 'DC') return null // the District is the city page, washington-dc
  const base = slugify(s.name)
  return CITY_SLUGS.has(base) || base === 'washington' ? `${base}-state` : base
}

export interface Place {
  kind: 'city' | 'state'
  slug: string
  /** "New York", "Texas". */
  name: string
  /** The two-letter state code; for a city, its state. */
  state: string
}

export const PLACES: Place[] = [
  ...CITIES.map((c): Place => ({ kind: 'city', slug: c.slug, name: c.name, state: c.state })),
  ...STATES.flatMap((s): Place[] => {
    const slug = stateSlug(s.code)
    return slug ? [{ kind: 'state', slug, name: s.name, state: s.code }] : []
  }),
]

const PLACE_BY_SLUG = new Map(PLACES.map((p) => [p.slug, p]))
export const placeBySlug = (slug: string): Place | null => PLACE_BY_SLUG.get(slug) ?? null

/** A state as the data spells it ("NY", "N.Y.", "New York", "ny") → "NY", or null outside the US list. */
export function stateCode(raw: string | null | undefined): string | null {
  const t = (raw ?? '').replace(/\./g, '').trim()
  if (!t) return null
  const up = t.toUpperCase()
  if (STATE_BY_CODE.has(up)) return up
  return STATE_BY_NAME.get(t.toLowerCase())?.code ?? null
}

const cityKey = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** The known city an office is in, or null (it then counts only toward its state). */
export function cityOf(office: Office): City | null {
  const code = stateCode(office.state)
  const key = cityKey(office.city ?? '')
  if (!key) return null
  return (
    CITIES.find((c) => (!code || c.state === code) && (cityKey(c.name) === key || c.aliases?.includes(key))) ?? null
  )
}

/** Does an office fall within a place? */
export function officeIn(office: Office, place: Place): boolean {
  if (place.kind === 'state') return stateCode(office.state) === place.state
  return cityOf(office)?.slug === place.slug
}

/** "New York, NY": a city name as the page shows it. */
export function officeLabel(o: Office): string {
  const city = cityOf(o)
  if (city) return city.state === 'DC' ? city.name : `${city.name}, ${city.state}`
  const code = stateCode(o.state)
  return [o.city?.trim(), code ?? o.state?.trim()].filter(Boolean).join(', ')
}

/** The short name: "New York". */
export function officeCity(o: Office): string {
  return cityOf(o)?.name ?? (o.city?.trim() || '')
}
