'use client'

import { useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2, Mail, Upload, X } from 'lucide-react'
import { signupSourceForRequest } from '@/lib/newsletter/signup-source'
import { LIMITS, PACKAGES, checkBooking, longDay, packageOf, runEnd, usd, wordCount } from '@/lib/sponsor/packages'
import { SponsorCardView, SponsorStripView, type SlotSponsor } from './SponsorViews'

/**
 * The ad builder on /sponsor (2026-10-09). Danny: "a sponsor can come and
 * essentially fully design their ad and placement... see what it would look
 * like live... play around with the copy... then submit it for approval."
 *
 * One form, in the order a buyer decides: how long, from when, what the ad
 * says, who is asking. Beside it the ad is drawn as it will run, with the
 * site's own components, and re-drawn on every keystroke; one button shows
 * it inside today's real email. Submitting files a request for the owner's
 * yes (lib/sponsor/requests.ts). Nothing here charges anyone.
 */

const LOGO_MAX_BYTES = 400_000
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

const inputClass =
  'mt-1 block w-full rounded-sm border border-foreground/30 bg-background px-3 py-2 font-ui text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none'
const labelClass = 'font-ui text-[12.5px] font-bold text-foreground'
const hintClass = 'font-ui text-[11.5px] font-normal text-muted-foreground'
const stepClass = 'font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400'

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label} {hint && <span className={hintClass}>{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block font-ui text-[12px] text-red-400" role="alert">{error}</span>}
    </label>
  )
}

export function SponsorBuilder({ openWeeks }: { openWeeks: string[] }) {
  const [packageId, setPackageId] = useState<string>('month')
  const [startsOn, setStartsOn] = useState(openWeeks[0] ?? '')
  const [company, setCompany] = useState('')
  const [tagline, setTagline] = useState('')
  const [blurb, setBlurb] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [logoData, setLogoData] = useState<string | null>(null)
  const [logoName, setLogoName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [notes, setNotes] = useState('')
  const [fax, setFax] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [emailHtml, setEmailHtml] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const pkg = packageOf(packageId) ?? PACKAGES[1]
  const words = wordCount(blurb)

  // The ad as the site would draw it right now. Until there is a name it is the dashed "your logo here" stand-in.
  const draft: SlotSponsor = useMemo(
    () => ({
      name: company.trim() || 'Your firm',
      tagline: tagline.trim() || null,
      blurb: blurb.trim() || 'Your copy appears here: up to 60 words, in your own voice, on what your firm does for the people who run private funds.',
      ctaUrl: '#',
      ctaText: ctaText.trim() || undefined,
      logoUrl: logoData ?? undefined,
      sample: !company.trim() && !logoData,
    }),
    [company, tagline, blurb, ctaText, logoData],
  )

  function onLogo(file: File | undefined) {
    setErrors((e) => ({ ...e, logo: '' }))
    if (!file) return
    if (!/^image\/(png|jpeg)$/.test(file.type)) return setErrors((e) => ({ ...e, logo: 'A PNG or JPEG file, please.' }))
    if (file.size > LOGO_MAX_BYTES) return setErrors((e) => ({ ...e, logo: 'Keep the file under 400 KB.' }))
    const reader = new FileReader()
    reader.onload = () => {
      setLogoData(String(reader.result))
      setLogoName(file.name)
    }
    reader.readAsDataURL(file)
  }

  async function showInEmail() {
    setEmailLoading(true)
    try {
      const res = await fetch('/api/sponsor/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company, blurb, ctaText, logoData }) })
      if (!res.ok) throw new Error()
      setEmailHtml(await res.text())
    } catch {
      setMessage('The email preview could not be made just now. The rest of the form still works.')
    } finally {
      setEmailLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const fields = { packageId, startsOn, company, contactName, email, website, tagline, blurb, ctaUrl, ctaText, logoLink: '', notes }
    const checked = checkBooking(fields, today())
    if (Object.keys(checked.errors).length) {
      setErrors(checked.errors)
      setStatus('error')
      setMessage('Some fields need another look.')
      formRef.current?.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    setErrors({})
    setStatus('sending')
    setMessage('')
    try {
      const from = signupSourceForRequest()
      const res = await fetch('/api/sponsor/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, logoData, fax, arrivedFrom: from ? [from.source, from.medium, from.campaign].filter(Boolean).join(' / ') : undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrors(data.errors ?? {})
        throw new Error(data.error || 'That could not be sent.')
      }
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'That could not be sent.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="panel panel-pad">
        <p className="flex items-start gap-2 font-news text-[26px] font-medium leading-tight">
          <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-400" aria-hidden />
          It is with us.
        </p>
        <p className="mt-2 max-w-[60ch] font-news text-[17px] leading-[1.45] text-foreground/85">
          {company} for {pkg.name.toLowerCase()} from {longDay(startsOn)}. A copy is on its way to {email}. We read every ad before it runs: you will
          have a yes or a no within one business day, and nothing is charged until then.
        </p>
      </div>
    )
  }

  if (openWeeks.length === 0) {
    return (
      <div className="panel panel-pad">
        <p className="font-news text-[18px] leading-[1.45]">The space is booked for the weeks ahead. Write to sponsor@fundopshq.com and we will tell you the first open date.</p>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ─── The form ─── */}
      <div className="space-y-7">
        <fieldset>
          <legend className={stepClass}>1 · How long</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {PACKAGES.map((p) => {
              const on = p.id === pkg.id
              return (
                <label key={p.id} className={`cursor-pointer rounded-sm border-2 px-3.5 py-3 transition-colors ${on ? 'border-foreground bg-card' : 'border-border bg-card/60 hover:border-foreground/50'}`}>
                  <input type="radio" name="package" value={p.id} checked={on} onChange={() => setPackageId(p.id)} className="sr-only" />
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-ui text-[13px] font-extrabold uppercase tracking-[0.06em]">{p.name}</span>
                    {on && <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />}
                  </span>
                  <span className="mt-1 block font-news text-[30px] font-medium leading-none tracking-[-0.02em]">{usd(p.priceUsd)}</span>
                  <span className="mt-1 block font-ui text-[11.5px] text-muted-foreground">
                    {p.editions} editions · about {usd(Math.round(p.priceUsd / p.editions))} each
                  </span>
                </label>
              )
            })}
          </div>
          <p className="mt-2 font-news text-[15px] leading-snug text-foreground/75">{pkg.line}</p>
        </fieldset>

        <fieldset>
          <legend className={stepClass}>2 · From when</legend>
          <Field label="First day" hint="Runs start on a Monday." error={errors.startsOn}>
            <select value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className={inputClass}>
              {openWeeks.map((d) => (
                <option key={d} value={d}>
                  {longDay(d)}
                </option>
              ))}
            </select>
          </Field>
          {startsOn && <p className="mt-1.5 font-ui text-[12.5px] text-muted-foreground">Your last day would be {longDay(runEnd(startsOn, pkg))}.</p>}
        </fieldset>

        <fieldset className="space-y-3.5">
          <legend className={stepClass}>3 · Your ad</legend>
          <Field label="Firm name" hint="As it should appear." error={errors.company}>
            <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={LIMITS.company} autoComplete="organization" className={inputClass} placeholder="Northgate Fund Services" />
          </Field>
          <div>
            <span className={labelClass}>
              Logo <span className={hintClass}>PNG or JPEG, under 400 KB. Optional: without one your name is set as a wordmark.</span>
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm border border-foreground/30 bg-card px-3.5 font-ui text-[12px] font-bold uppercase tracking-[0.06em] hover:border-foreground">
                <Upload className="h-3.5 w-3.5" aria-hidden />
                {logoData ? 'Replace' : 'Choose a file'}
                <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} />
              </label>
              {logoData && (
                <span className="inline-flex items-center gap-1.5 font-ui text-[12.5px] text-muted-foreground">
                  {logoName}
                  <button type="button" onClick={() => { setLogoData(null); setLogoName('') }} aria-label="Remove the logo" className="rounded-sm p-0.5 hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
            {errors.logo && <span className="mt-1 block font-ui text-[12px] text-red-400" role="alert">{errors.logo}</span>}
          </div>
          <Field label="Your copy" hint={`${words} of ${LIMITS.blurbWords} words`} error={errors.blurb}>
            <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} rows={4} maxLength={LIMITS.blurbChars} className={`${inputClass} resize-y font-news text-[16px] leading-[1.4]`} placeholder="What your firm does for the people who run private funds, and why they should look this morning." />
          </Field>
          <Field label="One line for the top of the site" hint="Optional. Shown beside your name above the stories." error={errors.tagline}>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={LIMITS.tagline} className={inputClass} placeholder="Fund administration for managers raising their first three funds." />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1fr)_170px]">
            <Field label="Where your link goes" error={errors.ctaUrl}>
              <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} inputMode="url" autoCapitalize="none" className={inputClass} placeholder="yourfirm.com/funds" />
            </Field>
            <Field label="Button" hint="Optional." error={errors.ctaText}>
              <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} maxLength={LIMITS.ctaText} className={inputClass} placeholder="Learn more" />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-3.5">
          <legend className={stepClass}>4 · You</legend>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Your name" error={errors.contactName}>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" className={inputClass} />
            </Field>
            <Field label="Work email" error={errors.email}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" className={inputClass} />
            </Field>
          </div>
          <Field label="Firm website" error={errors.website}>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} inputMode="url" autoCapitalize="none" autoComplete="url" className={inputClass} placeholder="yourfirm.com" />
          </Field>
          <Field label="Anything we should know" hint="Optional.">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={LIMITS.notes} className={`${inputClass} resize-y`} />
          </Field>
          {/* Not for people: left empty by anyone who can see the form. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Fax
              <input tabIndex={-1} autoComplete="off" value={fax} onChange={(e) => setFax(e.target.value)} />
            </label>
          </div>
        </fieldset>

        <div>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="group inline-flex h-12 items-center gap-2 rounded-sm px-6 font-ui text-[13.5px] font-extrabold uppercase tracking-[0.06em] transition-[filter] hover:brightness-95 disabled:opacity-50"
            style={{ background: 'var(--tab)', color: 'var(--ink)' }}
          >
            {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Submit for approval · {usd(pkg.priceUsd)} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></>}
          </button>
          <p className="mt-2 max-w-[52ch] font-ui text-[12.5px] leading-snug text-muted-foreground">
            Nothing is charged now. We read every ad and answer within one business day; payment is due once we say yes, before your first edition.
          </p>
          {message && <p className="mt-2 font-ui text-[13px] text-red-400" role="alert">{message}</p>}
        </div>
      </div>

      {/* ─── The ad, as it will run ─── */}
      <div className="lg:sticky lg:top-16 lg:self-start">
        <p className={stepClass}>Your ad, as it will run</p>
        <figure className="mt-2">
          <figcaption className="pb-1.5 font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">On the site · above the stories, on every page</figcaption>
          <div inert aria-hidden="true" className="pointer-events-none select-none">
            <SponsorStripView sponsor={draft} line="" />
          </div>
        </figure>
        <figure className="mt-5">
          <figcaption className="pb-1.5 font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">On the site · beside the stories</figcaption>
          <div inert aria-hidden="true" className="pointer-events-none max-w-[340px] select-none">
            <SponsorCardView sponsor={draft} />
          </div>
        </figure>
        <div className="mt-5">
          <p className="pb-1.5 font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">In the email · under the masthead and at the foot</p>
          <button
            type="button"
            onClick={showInEmail}
            disabled={emailLoading}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-foreground/30 bg-card px-4 font-ui text-[12.5px] font-bold uppercase tracking-[0.06em] transition-colors hover:border-foreground disabled:opacity-60"
          >
            {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" aria-hidden />}
            See it in today&rsquo;s email
          </button>
          <p className="mt-1.5 max-w-[46ch] font-ui text-[12px] leading-snug text-muted-foreground">This morning&rsquo;s real edition, with what you have typed so far in the sponsor&rsquo;s place.</p>
        </div>
      </div>

      {emailHtml && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-[rgba(15,28,48,0.72)] p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Your ad in today's email">
          <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-3 bg-[var(--ink)] px-4 py-2 text-[var(--ink-foreground)]">
            <p className="font-ui text-[11.5px] font-bold uppercase tracking-[0.12em]">Today&rsquo;s edition, with your ad</p>
            <button type="button" onClick={() => setEmailHtml(null)} className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-ui text-[12px] font-bold uppercase tracking-[0.06em] hover:bg-white/10">
              Close <X className="h-4 w-4" />
            </button>
          </div>
          <iframe title="Your ad in today's email" srcDoc={emailHtml} sandbox="" className="mx-auto w-full max-w-[760px] flex-1 bg-white" />
        </div>
      )}
    </form>
  )
}
