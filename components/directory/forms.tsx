'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { EDIT_LIMITS, type ProfileEdits } from '@/lib/directory/edit-shape'
import { PRACTICES } from '@/lib/directory/taxonomy'

// The directory's four small forms (2026-10-24): claim, confirm a claim, edit a
// claimed profile, and ask for a correction or removal. Plain labelled fields,
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

export function ClaimForm({ slug, domain }: { slug: string; domain: string }) {
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
          We sent a link to <strong>{email}</strong>. Open it and press the button to confirm. It works once, for seven days.
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
        It must be at {domain}. We email you a one-time link; nothing changes until you confirm.
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
  already: { title: 'This link has been used.', body: 'Each link works once. To edit your profile again, claim it again from its page and we will send a fresh link.' },
  expired: { title: 'This link has expired.', body: 'Links work for seven days. Claim the profile again from its page and we will send a fresh one.' },
  invalid: { title: "This link doesn't work.", body: 'It may be incomplete: try copying the whole link from the email.' },
  error: { title: 'Something went wrong.', body: 'Please try again in a minute.' },
}

export function ConfirmClaim({ token }: { token: string }) {
  const router = useRouter()
  const [state, setState] = useState<string>(token ? 'idle' : 'invalid')

  async function confirm() {
    if (state === 'sending') return
    setState('sending')
    const { json } = await post('/api/directory/claim/confirm', { token })
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
}: {
  initial: ProfileEdits
  hidden: boolean
  hiddenByOwner: boolean
  profileHref: string
  pending: boolean
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
            {PRACTICES.filter((p) => p.id !== 'other').map((p) => (
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
        <p className="font-news text-[18px] font-semibold text-foreground">{kind === 'removal' ? 'Done. The profile is hidden while we review your request.' : 'Thank you. We will check it against the source.'}</p>
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
        {kind === 'removal' && <p className={hintClass}>The profile comes off the site as soon as you send this, while we review the request.</p>}
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
