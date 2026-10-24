'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { EDIT_LIMITS, type ProfileEdits } from '@/lib/directory/edit-shape'
import { completeness } from '@/lib/directory/completeness'
import { PRACTICES } from '@/lib/directory/taxonomy'
import { CompletenessMeter } from './owner'

// The directory's small forms (2026-10-24): claim (or sign in to edit), confirm,
// edit a claimed profile, ask for a correction or removal, and suggest a firm
// or add yourself. Plain labelled fields,
// errors tied to their field (aria-describedby) and announced (role="alert"),
// a hidden field for bots, 16px inputs so a phone does not zoom.

const inputClass =
  'w-full rounded-sm border border-foreground/25 bg-card px-3 py-2 font-ui text-[16px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground'
const labelClass = 'mb-1 block font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/75'
const hintClass = 'mt-1 font-ui text-[12.5px] text-muted-foreground'
const buttonClass =
  'inline-flex items-center gap-2 rounded-sm bg-foreground px-5 py-2.5 font-ui text-[12.5px] font-bold uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90 disabled:opacity-60'

function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}

function ErrorText({ id, error }: { id: string; error: string | null }) {
  if (!error) return null
  return (
    <p id={id} role="alert" className="mt-1.5 font-ui text-[13px] font-semibold text-[#9b1c1c]">
      {error}
    </p>
  )
}

async function post(url: string, body: unknown): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return { ok: res.ok, json: (await res.json().catch(() => ({}))) as Record<string, unknown> }
  } catch {
    return { ok: false, json: { error: 'Could not reach FundOpsHQ. Check your connection and try again.' } }
  }
}

// ── Claim ───────────────────────────────────────────────────────────────────

export function ClaimForm({ slug, domain, signin = false }: { slug: string; domain: string; /** The profile is claimed: this is "Sign in to edit". */ signin?: boolean }) {
  const id = useId()
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setError(null)
    const website = (new FormData(e.currentTarget).get('website') as string) ?? ''
    const { ok, json } = await post('/api/directory/claim', { slug, email, website })
    if (ok) return setState('sent')
    setError(typeof json.error === 'string' ? json.error : 'Something went wrong. Please try again.')
    setState('idle')
  }

  if (state === 'sent') {
    return (
      <div role="status">
        <p className="font-news text-[18px] font-semibold text-foreground">Check your inbox.</p>
        <p className="mt-2 font-ui text-[14px] leading-relaxed text-foreground/75">
          We sent a link to <strong>{email}</strong>. Open it and press the button{signin ? ' to edit your profile' : ' to confirm'}. It works once, for seven days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="relative">
      <Honeypot />
      <label htmlFor={`${id}-email`} className={labelClass}>
        Your work email
      </label>
      <input
        id={`${id}-email`}
        type="email"
        name="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={`you@${domain}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint${error ? ` ${id}-err` : ''}`}
        className={inputClass}
      />
      <p id={`${id}-hint`} className={hintClass}>
        {signin
          ? `Use the address you claimed it with and we email you a link to sign in. No password. Someone else at ${domain}? Your own work address there works too.`
          : `It must be at ${domain}. We email you a one-time link; nothing changes until you confirm.`}
      </p>
      <ErrorText id={`${id}-err`} error={error} />
      <button type="submit" disabled={state === 'sending' || !email.trim()} className={`${buttonClass} mt-4`}>
        {state === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
        Email me the link
      </button>
    </form>
  )
}

// ── Confirm ─────────────────────────────────────────────────────────────────

const CONFIRM_MESSAGES: Record<string, { title: string; body: string }> = {
  already: { title: 'This link has been used.', body: 'Each link works once. To edit your profile again, choose “Sign in to edit” on it and we will send a fresh link.' },
  expired: { title: 'This link has expired.', body: 'Links work for seven days. Choose “Sign in to edit” (or “Is this you?”) on your profile and we will send a fresh one.' },
  invalid: { title: "This link doesn't work.", body: 'It may be incomplete: try copying the whole link from the email.' },
  error: { title: 'Something went wrong.', body: 'Please try again in a minute.' },
}

export function ConfirmClaim({ token, offerNewsletter = false }: { token: string; /** Ask "Also send me FundOps Daily?" (not shown to a current subscriber). */ offerNewsletter?: boolean }) {
  const router = useRouter()
  const id = useId()
  const [state, setState] = useState<string>(token ? 'idle' : 'invalid')
  const [newsletter, setNewsletter] = useState(false)

  async function confirm() {
    if (state === 'sending') return
    setState('sending')
    const { json } = await post('/api/directory/claim/confirm', { token, newsletter: offerNewsletter && newsletter })
    const o = typeof json.outcome === 'string' ? json.outcome : 'error'
    if (o === 'confirmed') return router.push('/directory/edit')
    setState(CONFIRM_MESSAGES[o] ? o : 'error')
  }

  if (state === 'idle' || state === 'sending') {
    return (
      <div>
        <p className="font-news text-[16.5px] leading-snug text-foreground/80">
          Press the button to confirm this is your profile. You can then add to it, or hide it.
        </p>
        {offerNewsletter && (
          <label htmlFor={`${id}-nl`} className="mt-4 flex items-start gap-2.5 font-ui text-[14px] leading-snug text-foreground">
            <input id={`${id}-nl`} type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#13233A]" />
            <span>
              Also send me <strong>FundOps Daily</strong>, the free morning news brief for GPs, LPs and fund service providers. Unsubscribe in one click.
            </span>
          </label>
        )}
        <button type="button" onClick={confirm} disabled={state === 'sending'} className={`${buttonClass} mt-4`}>
          {state === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          Confirm my profile
        </button>
      </div>
    )
  }
  const m = CONFIRM_MESSAGES[state]
  return (
    <div role="status">
      <p className="font-news text-[18px] font-semibold text-foreground">{m.title}</p>
      <p className="mt-2 font-ui text-[14px] text-foreground/75">{m.body}</p>
    </div>
  )
}

// ── Edit ────────────────────────────────────────────────────────────────────

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

export function EditProfileForm({
  initial,
  hidden,
  hiddenByOwner,
  profileHref,
  pending,
  practices = PRACTICES.filter((p) => p.id !== 'other'),
}: {
  initial: ProfileEdits
  hidden: boolean
  hiddenByOwner: boolean
  profileHref: string
  pending: boolean
  /** The trade's own practice areas (lib/directory/taxonomy.ts practicesFor). */
  practices?: { id: string; label: string }[]
}) {
  const id = useId()
  const [d, setD] = useState<ProfileEdits>(initial)
  // Five rows at most; one empty row more than are filled.
  const [notes, setNotes] = useState(() =>
    Array.from({ length: EDIT_LIMITS.notable }, (_, i) => ({ text: initial.notable[i]?.text ?? '', year: initial.notable[i]?.year ? String(initial.notable[i].year) : '' })),
  )
  const lastFilled = notes.reduce((m, n, i) => (n.text.trim() ? i : m), -1)
  const notableRows = notes.slice(0, Math.min(EDIT_LIMITS.notable, lastFilled + 2))
  const setNote = (i: number, patch: Partial<{ text: string; year: string }>) => setNotes(notes.map((n, j) => (j === i ? { ...n, ...patch } : n)))
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'saved'>('idle')
  const [error, setError] = useState<{ field: string; text: string } | null>(null)
  const [isHidden, setHidden] = useState(hidden)
  const [visState, setVisState] = useState<'idle' | 'sending'>('idle')
  const [visError, setVisError] = useState<string | null>(null)

  const meter = completeness({ ...d, photo_data: photoData, notable: notes.filter((x) => x.text.trim()).map((x) => ({ text: x.text, year: null })) })

  const err = (field: string) => (error?.field === field ? error.text : null)
  const described = (field: string, hint = true) => [hint ? `${id}-${field}-hint` : '', err(field) ? `${id}-${field}-err` : ''].filter(Boolean).join(' ') || undefined

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setError(null)
    if (!file) return setPhotoData(null)
    if (!/^image\/(png|jpeg)$/.test(file.type)) return setError({ field: 'photo', text: 'The photo must be a PNG or JPEG file.' })
    if (file.size > 1_000_000) return setError({ field: 'photo', text: 'The photo is too large: keep it under 1 MB.' })
    setPhotoData(await readFile(file))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setError(null)
    const { ok, json } = await post('/api/directory/edit', {
      ...d,
      notable: notes.filter((n) => n.text.trim()).map((n) => ({ text: n.text.trim(), year: /^\d{4}$/.test(n.year) ? Number(n.year) : null })),
      photo_data: photoData,
    })
    if (ok) return setState('saved')
    setError({ field: typeof json.field === 'string' ? json.field : 'form', text: typeof json.error === 'string' ? json.error : 'Something went wrong. Please try again.' })
    setState('idle')
  }

  async function toggleHidden() {
    setVisState('sending')
    setVisError(null)
    const { ok, json } = await post('/api/directory/visibility', { hidden: !isHidden })
    if (ok) setHidden(!isHidden)
    else setVisError(typeof json.error === 'string' ? json.error : 'Something went wrong. Please try again.')
    setVisState('idle')
  }

  if (state === 'saved') {
    return (
      <div role="status" className="panel panel-lead">
        <p className="font-news text-[18px] font-semibold text-foreground">Thank you. Your changes are with us for review.</p>
        <p className="mt-2 font-ui text-[14px] leading-relaxed text-foreground/75">
          We check every change before it appears, usually within two business days. Nothing on your profile changes until then.{' '}
          <Link href={profileHref} className="font-semibold text-foreground underline underline-offset-2">
            Back to your profile
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {pending && (
        <p role="note" className="border-l-4 border-[#E6B045] bg-card px-3 py-2 font-ui text-[13px] text-foreground/80">
          You have changes waiting for review. Saving again replaces them.
        </p>
      )}
      <CompletenessMeter c={meter} />
      <form onSubmit={save} noValidate className="space-y-5">
        <div>
          <label htmlFor={`${id}-headline`} className={labelClass}>
            Headline
          </label>
          <input
            id={`${id}-headline`}
            value={d.headline ?? ''}
            maxLength={EDIT_LIMITS.headline}
            onChange={(e) => setD({ ...d, headline: e.target.value })}
            aria-describedby={described('headline')}
            aria-invalid={err('headline') ? true : undefined}
            className={inputClass}
          />
          <p id={`${id}-headline-hint`} className={hintClass}>
            One line, facts only: &ldquo;Forms first-time venture and growth funds&rdquo;. Up to {EDIT_LIMITS.headline} characters.
          </p>
          <ErrorText id={`${id}-headline-err`} error={err('headline')} />
        </div>

        <div>
          <label htmlFor={`${id}-description`} className={labelClass}>
            Description
          </label>
          <textarea
            id={`${id}-description`}
            rows={5}
            value={d.description ?? ''}
            maxLength={EDIT_LIMITS.description}
            onChange={(e) => setD({ ...d, description: e.target.value })}
            aria-describedby={described('description')}
            aria-invalid={err('description') ? true : undefined}
            className={inputClass}
          />
          <p id={`${id}-description-hint`} className={hintClass}>
            {(d.description ?? '').length} of {EDIT_LIMITS.description} characters. No superlatives or rankings; we edit them out.
          </p>
          <ErrorText id={`${id}-description-err`} error={err('description')} />
        </div>

        <fieldset>
          <legend className={labelClass}>Practice areas</legend>
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {practices.map((p) => (
              <label key={p.id} className="flex min-h-9 items-center gap-2 font-ui text-[14px] text-foreground">
                <input
                  type="checkbox"
                  checked={d.practice_areas.includes(p.id)}
                  onChange={(e) =>
                    setD({ ...d, practice_areas: e.target.checked ? [...d.practice_areas, p.id] : d.practice_areas.filter((x) => x !== p.id) })
                  }
                  className="h-4 w-4 accent-[#13233A]"
                />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${id}-photo`} className={labelClass}>
            Photo
          </label>
          <input
            id={`${id}-photo`}
            type="file"
            accept="image/png,image/jpeg"
            onChange={onPhoto}
            aria-describedby={described('photo')}
            className="block w-full font-ui text-[14px] text-foreground file:mr-3 file:rounded-sm file:border file:border-foreground/30 file:bg-card file:px-3 file:py-1.5 file:font-ui file:text-[13px] file:font-semibold"
          />
          <p id={`${id}-photo-hint`} className={hintClass}>
            A PNG or JPEG of you, under 1 MB, at least 200 pixels a side. Or paste a link to one below.
          </p>
          <ErrorText id={`${id}-photo-err`} error={err('photo')} />
          <label htmlFor={`${id}-photo-url`} className="sr-only">
            Photo link
          </label>
          <input
            id={`${id}-photo-url`}
            type="url"
            placeholder="https://"
            value={d.photo_url ?? ''}
            onChange={(e) => setD({ ...d, photo_url: e.target.value })}
            aria-describedby={err('photo_url') ? `${id}-photo_url-err` : undefined}
            className={`${inputClass} mt-2`}
          />
          <ErrorText id={`${id}-photo_url-err`} error={err('photo_url')} />
        </div>

        <div>
          <label htmlFor={`${id}-contact`} className={labelClass}>
            Contact link
          </label>
          <input
            id={`${id}-contact`}
            type="url"
            placeholder="https://"
            value={d.contact_url ?? ''}
            onChange={(e) => setD({ ...d, contact_url: e.target.value })}
            aria-describedby={described('contact_url')}
            className={inputClass}
          />
          <p id={`${id}-contact_url-hint`} className={hintClass}>
            Where people should reach you: your page on the firm&rsquo;s site, a booking page. We never show an email address or phone number.
          </p>
          <ErrorText id={`${id}-contact_url-err`} error={err('contact_url')} />
        </div>

        <fieldset>
          <legend className={labelClass}>Notable matters (shown as self-reported)</legend>
          <p className={`${hintClass} mb-2`}>Public matters only: &ldquo;Fund counsel to Example Partners Fund III, $450M final close&rdquo;. Up to {EDIT_LIMITS.notable}.</p>
          <div className="space-y-2">
            {notableRows.map((n, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
                <label className="sr-only" htmlFor={`${id}-n${i}`}>
                  Matter {i + 1}
                </label>
                <input
                  id={`${id}-n${i}`}
                  value={n.text}
                  maxLength={EDIT_LIMITS.notableText}
                  onChange={(e) => setNote(i, { text: e.target.value })}
                  className={inputClass}
                />
                <label className="sr-only" htmlFor={`${id}-ny${i}`}>
                  Year of matter {i + 1}
                </label>
                <input
                  id={`${id}-ny${i}`}
                  inputMode="numeric"
                  placeholder="Year"
                  maxLength={4}
                  value={n.year}
                  onChange={(e) => setNote(i, { year: e.target.value.replace(/\D/g, '') })}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <ErrorText id={`${id}-notable-err`} error={err('notable')} />
        </fieldset>

        <ErrorText id={`${id}-form-err`} error={err('form')} />
        <button type="submit" disabled={state === 'sending'} className={buttonClass}>
          {state === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          Send for review
        </button>
      </form>

      <section aria-labelledby={`${id}-vis`} className="border-t border-border pt-5">
        <h2 id={`${id}-vis`} className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
          {isHidden ? 'Your profile is hidden' : 'Hide your profile'}
        </h2>
        <p className="mt-1.5 font-ui text-[13.5px] leading-relaxed text-foreground/75">
          {isHidden
            ? hiddenByOwner || !hidden
              ? 'Nobody can see it, and it is out of search results. You can show it again at any time.'
              : 'It is hidden while we review a request about it.'
            : 'It comes off the site at once, and out of search results as they refresh. You can show it again later.'}
        </p>
        {(!isHidden || hiddenByOwner || !hidden) && (
          <button
            type="button"
            onClick={toggleHidden}
            disabled={visState === 'sending'}
            className="mt-3 inline-flex items-center gap-2 rounded-sm border border-foreground/40 px-4 py-2 font-ui text-[12.5px] font-bold uppercase tracking-[0.08em] text-foreground hover:border-foreground disabled:opacity-60"
          >
            {visState === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            {isHidden ? 'Show my profile again' : 'Hide my profile'}
          </button>
        )}
        {visError && (
          <p role="alert" className="mt-2 font-ui text-[13px] font-semibold text-[#9b1c1c]">
            {visError}
          </p>
        )}
      </section>
    </div>
  )
}

// ── Correction or removal ───────────────────────────────────────────────────

export function RequestForm({ slug, name }: { slug: string; name: string }) {
  const id = useId()
  const [kind, setKind] = useState<'correction' | 'removal'>('correction')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<{ field: string; text: string } | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setError(null)
    const website = (new FormData(e.currentTarget).get('website') as string) ?? ''
    const { ok, json } = await post('/api/directory/request', { slug, kind, message, contact_email: email, website })
    if (ok) return setState('sent')
    setError({ field: typeof json.field === 'string' ? json.field : 'form', text: typeof json.error === 'string' ? json.error : 'Something went wrong. Please try again.' })
    setState('idle')
  }

  if (state === 'sent') {
    return (
      <div role="status">
        <p className="font-news text-[18px] font-semibold text-foreground">{kind === 'removal' ? 'Thank you. We review removal requests within two business days. If this is your own profile, you can hide it at once by claiming it with your work email.' : 'Thank you. We will check it against the source.'}</p>
        <p className="mt-2 font-ui text-[14px] leading-relaxed text-foreground/75">We reply to {email} within two business days.</p>
      </div>
    )
  }

  const err = (f: string) => (error?.field === f ? error.text : null)
  return (
    <form onSubmit={submit} noValidate className="relative space-y-5">
      <Honeypot />
      <fieldset>
        <legend className={labelClass}>What do you need?</legend>
        <div className="space-y-1">
          {(
            [
              ['correction', `Correct something on ${name}'s profile`],
              ['removal', `Remove ${name}'s profile`],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex min-h-10 items-center gap-2 font-ui text-[14.5px] text-foreground">
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="h-4 w-4 accent-[#13233A]" />
              {label}
            </label>
          ))}
        </div>
        {kind === 'removal' && <p className={hintClass}>We review removal requests within two business days. If it is your own profile, claim it with your work email to hide it at once.</p>}
      </fieldset>
      <div>
        <label htmlFor={`${id}-message`} className={labelClass}>
          {kind === 'correction' ? 'What is wrong, and what should it say?' : 'Anything we should know (optional)'}
        </label>
        <textarea
          id={`${id}-message`}
          rows={5}
          value={message}
          maxLength={2000}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={err('message') ? true : undefined}
          aria-describedby={err('message') ? `${id}-message-err` : undefined}
          className={inputClass}
        />
        <ErrorText id={`${id}-message-err`} error={err('message')} />
      </div>
      <div>
        <label htmlFor={`${id}-email`} className={labelClass}>
          Your email
        </label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={err('contact_email') ? true : undefined}
          aria-describedby={`${id}-email-hint${err('contact_email') ? ` ${id}-email-err` : ''}`}
          className={inputClass}
        />
        <p id={`${id}-email-hint`} className={hintClass}>
          Only to reply to you. It is never shown.
        </p>
        <ErrorText id={`${id}-email-err`} error={err('contact_email')} />
      </div>
      <ErrorText id={`${id}-form-err`} error={err('form') ?? err('slug') ?? err('kind')} />
      <button type="submit" disabled={state === 'sending'} className={buttonClass}>
        {state === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
        Send
      </button>
    </form>
  )
}

// ── Suggest a firm or add yourself ──────────────────────────────────────────

const SUGGEST_KINDS = [
  { id: 'add_self', label: 'Add myself' },
  { id: 'person', label: 'Suggest someone' },
  { id: 'firm', label: 'Suggest a firm' },
] as const
type SuggestKind = (typeof SUGGEST_KINDS)[number]['id']

export function SuggestForm({
  trades,
  initialTrade,
  fromQuery = '',
}: {
  trades: { id: string; label: string }[]
  initialTrade?: string
  /** The search that found nobody, when they came from one: kept with the suggestion. */
  fromQuery?: string
}) {
  const id = useId()
  const [kind, setKind] = useState<SuggestKind>('add_self')
  const [v, setV] = useState({ category: initialTrade && trades.some((t) => t.id === initialTrade) ? initialTrade : (trades[0]?.id ?? ''), full_name: '', firm_name: '', firm_website: '', bio_url: '', contact_email: '', message: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<{ field: string; text: string } | null>(null)
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value })
  const err = (f: string) => (error?.field === f ? error.text : null)
  const field = (f: string, hint?: boolean) => ({
    'aria-invalid': err(f) ? true : undefined,
    'aria-describedby': [hint ? `${id}-${f}-hint` : '', err(f) ? `${id}-${f}-err` : ''].filter(Boolean).join(' ') || undefined,
  })

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    setError(null)
    const website = (new FormData(e.currentTarget).get('website') as string) ?? ''
    const { ok, json } = await post('/api/directory/suggest', { kind, ...v, from_query: fromQuery, website })
    if (ok) return setState('sent')
    setError({ field: typeof json.field === 'string' ? json.field : 'form', text: typeof json.error === 'string' ? json.error : 'Something went wrong. Please try again.' })
    setState('idle')
  }

  if (state === 'sent') {
    return (
      <div role="status">
        <p className="font-news text-[18px] font-semibold text-foreground">Thank you. It is with us.</p>
        <p className="mt-2 font-ui text-[14px] leading-relaxed text-foreground/75">
          We check every suggestion against the firm&rsquo;s own site and the directory&rsquo;s rules (partner level or above, a fund practice), and reply to{' '}
          {v.contact_email} within a few business days.
        </p>
      </div>
    )
  }

  const self = kind === 'add_self'
  return (
    <form onSubmit={submit} noValidate className="relative space-y-5">
      <Honeypot />
      <fieldset>
        <legend className={labelClass}>What would you like to do?</legend>
        <div className="space-y-1">
          {SUGGEST_KINDS.map((k) => (
            <label key={k.id} className="flex min-h-10 items-center gap-2 font-ui text-[14.5px] text-foreground">
              <input type="radio" name="kind" value={k.id} checked={kind === k.id} onChange={() => setKind(k.id)} className="h-4 w-4 accent-[#13233A]" />
              {k.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${id}-category`} className={labelClass}>
          Trade
        </label>
        <select id={`${id}-category`} value={v.category} onChange={set('category')} {...field('category')} className={inputClass}>
          {trades.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <ErrorText id={`${id}-category-err`} error={err('category')} />
      </div>
      {kind !== 'firm' && (
        <div>
          <label htmlFor={`${id}-full_name`} className={labelClass}>
            {self ? 'Your name' : 'Their name'}
          </label>
          <input id={`${id}-full_name`} value={v.full_name} onChange={set('full_name')} autoComplete={self ? 'name' : 'off'} maxLength={120} {...field('full_name')} className={inputClass} />
          <ErrorText id={`${id}-full_name-err`} error={err('full_name')} />
        </div>
      )}
      <div>
        <label htmlFor={`${id}-firm_name`} className={labelClass}>
          Firm
        </label>
        <input id={`${id}-firm_name`} value={v.firm_name} onChange={set('firm_name')} autoComplete={self ? 'organization' : 'off'} maxLength={160} {...field('firm_name')} className={inputClass} />
        <ErrorText id={`${id}-firm_name-err`} error={err('firm_name')} />
      </div>
      <div>
        <label htmlFor={`${id}-firm_website`} className={labelClass}>
          Firm website
        </label>
        <input id={`${id}-firm_website`} value={v.firm_website} onChange={set('firm_website')} placeholder="example.com" inputMode="url" {...field('firm_website')} className={inputClass} />
        <ErrorText id={`${id}-firm_website-err`} error={err('firm_website')} />
      </div>
      {kind !== 'firm' && (
        <div>
          <label htmlFor={`${id}-bio_url`} className={labelClass}>
            {self ? 'Your bio on the firm’s site' : 'Their bio on the firm’s site'}
          </label>
          <input id={`${id}-bio_url`} type="url" value={v.bio_url} onChange={set('bio_url')} placeholder="https://" {...field('bio_url', true)} className={inputClass} />
          <p id={`${id}-bio_url-hint`} className={hintClass}>
            The directory lists only what a firm publishes on its own site, so this is what we read.
          </p>
          <ErrorText id={`${id}-bio_url-err`} error={err('bio_url')} />
        </div>
      )}
      <div>
        <label htmlFor={`${id}-message`} className={labelClass}>
          Anything we should know (optional)
        </label>
        <textarea id={`${id}-message`} rows={4} value={v.message} onChange={set('message')} maxLength={1500} {...field('message')} className={inputClass} />
        <ErrorText id={`${id}-message-err`} error={err('message')} />
      </div>
      <div>
        <label htmlFor={`${id}-contact_email`} className={labelClass}>
          {self ? 'Your work email' : 'Your email'}
        </label>
        <input id={`${id}-contact_email`} type="email" autoComplete="email" value={v.contact_email} onChange={set('contact_email')} {...field('contact_email', true)} className={inputClass} />
        <p id={`${id}-contact_email-hint`} className={hintClass}>
          {self ? 'At your firm, so we know it is you. Only to reply; never shown.' : 'Only to reply to you. It is never shown.'}
        </p>
        <ErrorText id={`${id}-contact_email-err`} error={err('contact_email')} />
      </div>
      <ErrorText id={`${id}-form-err`} error={err('form') ?? err('kind')} />
      <button type="submit" disabled={state === 'sending'} className={buttonClass}>
        {state === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
        Send
      </button>
    </form>
  )
}
