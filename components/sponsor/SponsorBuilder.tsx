'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2, Mail, Upload, X } from 'lucide-react'
import { signupSourceForRequest } from '@/lib/newsletter/signup-source'
import { LIMITS, LOGO_OUT, LOGO_RULES, NO_LOGO, PACKAGES, asUrl, checkBooking, emailLogoWidth, isWebUrl, longDay, openMondays, packageOf, runEnd, runIsFree, usd, wordCount, type Taken } from '@/lib/sponsor/packages'
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
 *
 * What makes it trustworthy to play with (second pass, same day: "they should
 * feel confident their ad's going to show up the way they want"): the preview
 * is the real components and the real email, not a sketch; the limits are
 * shown as they are approached, not after; a logo is measured as it is
 * chosen and the buyer is told how it will sit; the link is shown as it will
 * be opened; only start dates that are free for the chosen length are
 * offered; and the draft is kept on their device until it is sent.
 */

/** Where an unfinished ad is kept on the visitor's own device, so a reload or a second visit does not lose it. */
const DRAFT_KEY = 'fops_sponsor_draft_v1'
/** The email is 680 px wide in a shell with a little room each side; the small preview is that page scaled to the column. */
const EMAIL_WIDTH = 700
const EMAIL_SHOWN = 640
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

const inputClass =
  'mt-1 block w-full rounded-sm border border-foreground/30 bg-background px-3 py-2 font-ui text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none'
const labelClass = 'font-ui text-[12.5px] font-bold text-foreground'
const hintClass = 'font-ui text-[11.5px] font-normal text-muted-foreground'
const stepClass = 'font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400'

/** "23 / 60 words", in red once past the limit. */
function Count({ n, max, unit = '' }: { n: number; max: number; unit?: string }) {
  return (
    <span className={`float-right font-ui text-[11.5px] font-normal tabular-nums ${n > max ? 'font-bold text-red-400' : 'text-muted-foreground'}`}>
      {n} / {max}
      {unit}
    </span>
  )
}

function Field({ label, hint, error, count, children }: { label: string; hint?: string; error?: string; count?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label} {hint && <span className={hintClass}>{hint}</span>}
        {count}
      </span>
      {children}
      {error && <span className="mt-1 block font-ui text-[12px] text-red-400" role="alert">{error}</span>}
    </label>
  )
}

export function SponsorBuilder({ openWeeks, taken }: { openWeeks: string[]; taken: Taken[] }) {
  const [packageId, setPackageId] = useState<string>('month')
  const [startsOn, setStartsOn] = useState(openWeeks[0] ?? '')
  const [logoSize, setLogoSize] = useState<{ w: number; h: number } | null>(null)
  const [restored, setRestored] = useState(false)
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
  // The newsletter half of the takeover, drawn small beside the form: today's real edition with the ad in it.
  const [mini, setMini] = useState<string | null>(null)
  const [miniBusy, setMiniBusy] = useState(false)
  const [inView, setInView] = useState(false)
  const [scale, setScale] = useState(0.6)
  const miniRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const pkg = packageOf(packageId) ?? PACKAGES[1]
  const words = wordCount(blurb)

  // The Mondays this length could start on: every day of the run has to be free, not only its first week.
  const starts = useMemo(() => openWeeks.filter((d) => runIsFree(d, pkg, taken)), [openWeeks, pkg, taken])
  useEffect(() => {
    if (starts.length && !starts.includes(startsOn)) setStartsOn(starts[0])
  }, [starts, startsOn])

  // An unfinished ad is kept on this device and put back on the next visit.
  useEffect(() => {
    try {
      const d = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? 'null')
      if (d && typeof d === 'object') {
        if (packageOf(d.packageId)) setPackageId(d.packageId)
        if (typeof d.startsOn === 'string' && openMondays(today(), taken).includes(d.startsOn)) setStartsOn(d.startsOn)
        const put = (v: unknown, set: (s: string) => void) => { if (typeof v === 'string' && v) set(v) }
        put(d.company, setCompany); put(d.tagline, setTagline); put(d.blurb, setBlurb); put(d.ctaUrl, setCtaUrl); put(d.ctaText, setCtaText)
        put(d.contactName, setContactName); put(d.email, setEmail); put(d.website, setWebsite); put(d.notes, setNotes)
        if (typeof d.logoData === 'string' && d.logoData.startsWith('data:image/')) { setLogoData(d.logoData); put(d.logoName, setLogoName); if (d.logoSize?.w) setLogoSize(d.logoSize) }
        if (d.company || d.blurb || d.logoData) setRestored(true)
      }
    } catch {
      // nothing kept, or storage blocked: start empty
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (status === 'sent') return
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ packageId, startsOn, company, tagline, blurb, ctaUrl, ctaText, contactName, email, website, notes, logoData, logoName, logoSize }))
      } catch {
        // storage full or blocked: the form still works, it just will not survive a reload
      }
    }, 500)
    return () => window.clearTimeout(timer)
  }, [status, packageId, startsOn, company, tagline, blurb, ctaUrl, ctaText, contactName, email, website, notes, logoData, logoName, logoSize])

  // The email preview is asked for only once the builder is on screen (a visitor who never scrolls this far costs
  // nothing), then again a moment after the ad stops changing.
  useEffect(() => {
    const el = miniRef.current
    if (!el) return
    const fit = () => setScale(Math.min(1, el.clientWidth / EMAIL_WIDTH))
    fit()
    const size = new ResizeObserver(fit)
    size.observe(el)
    // Two ways of noticing the preview has come near the screen: the observer, and a plain look once a second for
    // browsers (and background tabs) where the observer is slow to speak.
    const near = () => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight + 200 && r.bottom > -200 }
    const seen = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) setInView(true) }, { rootMargin: '200px' })
    seen.observe(el)
    const look = window.setInterval(() => { if (near()) { setInView(true); window.clearInterval(look) } }, 1000)
    return () => { size.disconnect(); seen.disconnect(); window.clearInterval(look) }
  }, [])
  useEffect(() => {
    if (!inView || status === 'sent') return
    const stop = new AbortController()
    const timer = window.setTimeout(async () => {
      setMiniBusy(true)
      try {
        const res = await fetch('/api/sponsor/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company, blurb, ctaText, logoData }), signal: stop.signal })
        if (res.ok) setMini(await res.text())
      } catch {
        // superseded by a newer draft, or offline: the last picture stays
      } finally {
        if (!stop.signal.aborted) setMiniBusy(false)
      }
    }, mini === null ? 0 : 800)
    return () => { window.clearTimeout(timer); stop.abort() }
    // `mini` is left out on purpose: it is what this effect sets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, status, company, blurb, ctaText, logoData])

  function startOver() {
    try { window.localStorage.removeItem(DRAFT_KEY) } catch { /* nothing to clear */ }
    setCompany(''); setTagline(''); setBlurb(''); setCtaUrl(''); setCtaText(''); setLogoData(null); setLogoName(''); setLogoSize(null)
    setContactName(''); setEmail(''); setWebsite(''); setNotes(''); setErrors({}); setMessage(''); setRestored(false)
  }

  // The link as it will be opened, once it is one.
  const link = asUrl(ctaUrl)
  const linkOk = isWebUrl(link)

  // The ad as the site would draw it right now. Until there is a name it is the dashed "your logo here" stand-in.
  const draft: SlotSponsor = useMemo(
    () => ({
      name: logoData ? company.trim() || 'Your firm' : 'Your logo here',
      tagline: tagline.trim() || null,
      blurb: blurb.trim() || 'Your copy appears here: up to 60 words, in your own voice, on what your firm does for the people who run private funds.',
      ctaUrl: '#',
      ctaText: ctaText.trim() || undefined,
      logoUrl: logoData ?? undefined,
      logoWidth: logoData && logoSize ? emailLogoWidth(logoSize.w, logoSize.h) : undefined,
      // Until a logo is chosen the mark is the dashed "your logo here" box: an ad has its logo.
      sample: !logoData,
    }),
    [company, tagline, blurb, ctaText, logoData, logoSize],
  )

  /**
   * Whatever picture file the sponsor has (PNG, JPEG, SVG, WebP), it is redrawn here as a PNG of a sensible size:
   * the one kind every mail app shows. So a logo straight from a brand kit works, and what is sent is what was previewed.
   */
  function onLogo(file: File | undefined) {
    setErrors((e) => ({ ...e, logo: '' }))
    if (!file) return
    if (!file.type.startsWith('image/')) return setErrors((e) => ({ ...e, logo: 'That is not a picture file. A PNG, JPEG, SVG or WebP, please.' }))
    if (file.size > LOGO_OUT.pickBytes) return setErrors((e) => ({ ...e, logo: 'That file is very large. Use one under 12 MB.' }))
    const vector = file.type === 'image/svg+xml'
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // A vector has no size of its own worth trusting; anything else has to be big enough to stay sharp.
        const w0 = img.naturalWidth || 800, h0 = img.naturalHeight || 200
        if (!vector && w0 < LOGO_RULES.minWidth) return setErrors((e) => ({ ...e, logo: `That file is only ${w0} pixels wide. Use one at least ${LOGO_RULES.minWidth} pixels wide so it stays sharp.` }))
        let w = vector ? LOGO_OUT.maxWidth : Math.min(w0, LOGO_OUT.maxWidth)
        let h = Math.round((w * h0) / w0)
        if (h > LOGO_OUT.maxHeight) { h = LOGO_OUT.maxHeight; w = Math.round((h * w0) / h0) }
        let data = ''
        // Drawn smaller until it is light enough to send (a photograph saved as a logo can be heavy).
        for (let tries = 0; tries < 5; tries++) {
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) break
          ctx.drawImage(img, 0, 0, w, h)
          data = canvas.toDataURL('image/png')
          if (data.length * 0.75 <= LOGO_RULES.maxBytes) break
          w = Math.round(w * 0.75)
          h = Math.round(h * 0.75)
        }
        if (!data || data.length * 0.75 > LOGO_RULES.maxBytes || w < LOGO_RULES.minWidth) return setErrors((e) => ({ ...e, logo: 'That picture is too detailed to use as a logo. Try a simpler file, or a PNG of the logo alone.' }))
        setLogoData(data)
        setLogoName(file.name)
        setLogoSize({ w, h })
      }
      img.onerror = () => setErrors((e) => ({ ...e, logo: 'That file could not be read as a picture. Try saving it again as a PNG.' }))
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  async function showInEmail() {
    // The small preview is the same page: when it is up to date, open that.
    if (mini && !miniBusy) return setEmailHtml(mini)
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
    if (!logoData) checked.errors.logo = NO_LOGO
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
      try { window.localStorage.removeItem(DRAFT_KEY) } catch { /* nothing to clear */ }
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
          have a yes or a no within one business day. Nothing is charged now; if it is a yes, an invoice follows.
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
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-x-8 gap-y-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ─── The strip, at its real width, and it stays in view while the ad is written: it is the first thing every visitor sees ─── */}
      <figure className="sticky top-[46px] z-20 -mx-1 bg-background/95 px-1 pb-2 pt-2 backdrop-blur-sm lg:col-span-2">
        <figcaption className="pb-1.5 font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          The website · above the stories, on every page
        </figcaption>
        <div inert aria-hidden="true" className="pointer-events-none select-none">
          <SponsorStripView sponsor={draft} line="" />
        </div>
      </figure>

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
              {starts.map((d) => (
                <option key={d} value={d}>
                  {longDay(d)}
                </option>
              ))}
            </select>
          </Field>
          {starts.length === 0 ? (
            <p className="mt-1.5 font-ui text-[12.5px] text-red-400" role="alert">No {pkg.name.toLowerCase()} run is free in the weeks ahead. Choose a shorter length, or write to sponsor@fundopshq.com.</p>
          ) : (
            startsOn && <p className="mt-1.5 font-ui text-[12.5px] text-muted-foreground">Your last day would be {longDay(runEnd(startsOn, pkg))}.{starts.length < openWeeks.length ? ' Some Mondays are not offered because part of the run is already booked.' : ''}</p>
          )}
        </fieldset>

        <fieldset className="space-y-3.5">
          <legend className={stepClass}>3 · Your ad</legend>
          {restored && (
            <p className="font-ui text-[12.5px] text-muted-foreground">
              Your draft from last time is back, kept on this device.{' '}
              <button type="button" onClick={startOver} className="underline underline-offset-2 hover:text-foreground">Start over</button>
            </p>
          )}
          <Field label="Firm name" hint="As it should appear." error={errors.company} count={<Count n={company.length} max={LIMITS.company} />}>
            <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={LIMITS.company} autoComplete="organization" className={inputClass} placeholder="Northgate Fund Services" />
          </Field>
          <div>
            <span className={labelClass}>
              Logo <span className={hintClass}>PNG, JPEG, SVG or WebP: we size it for you. A wide logo on a white or clear background works best.</span>
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm border border-foreground/30 bg-card px-3.5 font-ui text-[12px] font-bold uppercase tracking-[0.06em] hover:border-foreground">
                <Upload className="h-3.5 w-3.5" aria-hidden />
                {logoData ? 'Replace' : 'Choose a file'}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} />
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
            {logoData && logoSize && !errors.logo && (
              <span className="mt-1 block font-ui text-[12px] text-muted-foreground">
                {logoSize.h > logoSize.w * 0.8 ? 'In. It is close to square, so it sits smaller than a wide logo would: see the previews.' : 'In. It is drawn in the previews exactly as it will run.'}
              </span>
            )}
          </div>
          <Field label="Your copy" error={errors.blurb} count={<Count n={words} max={LIMITS.blurbWords} unit=" words" />}>
            <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} rows={4} maxLength={LIMITS.blurbChars} className={`${inputClass} resize-y font-news text-[16px] leading-[1.4]`} placeholder="What your firm does for the people who run private funds, and why they should look this morning." />
          </Field>
          <Field label="One line for the top of the site" hint="Optional. Beside your name above the stories; your copy is used if this is empty." error={errors.tagline} count={<Count n={tagline.length} max={LIMITS.tagline} />}>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={LIMITS.tagline} className={inputClass} placeholder="Fund administration for managers raising their first three funds." />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1fr)_170px]">
            <Field label="Where your link goes" error={errors.ctaUrl}>
              <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} inputMode="url" autoCapitalize="none" maxLength={300} className={inputClass} placeholder="yourfirm.com/funds" />
            </Field>
            <Field label="Button" hint="Optional." error={errors.ctaText} count={<Count n={ctaText.length} max={LIMITS.ctaText} />}>
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
          <dl className="mb-3 border-y border-border/70 py-2.5 font-ui text-[13.5px] leading-relaxed">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Run</dt><dd className="text-right font-semibold">{pkg.name}{startsOn ? `, ${longDay(startsOn)} to ${longDay(runEnd(startsOn, pkg))}` : ''}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Where</dt><dd className="text-right font-semibold">{pkg.editions} editions of the email, and the site every day</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Price</dt><dd className="text-right font-semibold">{usd(pkg.priceUsd)}, invoiced after we say yes</dd></div>
          </dl>
          <button
            type="submit"
            disabled={status === 'sending' || starts.length === 0}
            className="group inline-flex h-12 items-center gap-2 rounded-sm px-6 font-ui text-[13.5px] font-extrabold uppercase tracking-[0.06em] transition-[filter] hover:brightness-95 disabled:opacity-50"
            style={{ background: 'var(--tab)', color: 'var(--ink)' }}
          >
            {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Submit for approval · {usd(pkg.priceUsd)} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></>}
          </button>
          <p className="mt-2 max-w-[52ch] font-ui text-[12.5px] leading-snug text-muted-foreground">
            Nothing is charged now. We read every ad and answer within one business day. If it is a yes, the dates are yours and we send an invoice.
          </p>
          {message && <p className="mt-2 font-ui text-[13px] text-red-400" role="alert">{message}</p>}
        </div>
      </div>

      {/* ─── The ad, as it will run ─── */}
      <div className="lg:sticky lg:top-[150px] lg:self-start">
        <p className={stepClass}>The rest of your takeover</p>
        <figure className="mt-2">
          <figcaption className="pb-1.5 font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">The website · beside the stories</figcaption>
          <div inert aria-hidden="true" className="pointer-events-none max-w-[340px] select-none">
            <SponsorCardView sponsor={draft} />
          </div>
        </figure>
        <p className="mt-3 break-all font-ui text-[12.5px] leading-snug text-muted-foreground">
          {linkOk ? (
            <>Your name, logo and button all open <span className="font-semibold text-foreground">{link}</span></>
          ) : (
            'Your name, logo and button will open the link you give in step 3.'
          )}
        </p>
        <figure className="mt-5">
          <figcaption className="flex items-baseline justify-between gap-3 pb-1.5 font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <span>The newsletter · top and foot of every edition</span>
            {miniBusy && mini && <span className="font-semibold normal-case tracking-normal">updating…</span>}
          </figcaption>
          <div ref={miniRef} className="relative overflow-hidden border border-border bg-[#0F1E33]" style={{ height: Math.round(EMAIL_SHOWN * scale) }}>
            {mini ? (
              <iframe
                title="Your ad in today's newsletter"
                srcDoc={mini}
                sandbox=""
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 border-0 bg-white"
                style={{ width: EMAIL_WIDTH, height: EMAIL_SHOWN, transform: `scale(${scale})`, transformOrigin: 'top left' }}
              />
            ) : (
              <p className="flex h-full items-center justify-center gap-2 font-ui text-[12.5px] text-white/70">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Drawing this morning&rsquo;s edition with your ad
              </p>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <button
              type="button"
              onClick={showInEmail}
              disabled={emailLoading}
              className="inline-flex h-9 items-center gap-2 rounded-sm border border-foreground/30 bg-card px-3.5 font-ui text-[12px] font-bold uppercase tracking-[0.06em] transition-colors hover:border-foreground disabled:opacity-60"
            >
              {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" aria-hidden />}
              Open the whole edition
            </button>
            <p className="font-ui text-[12px] leading-snug text-muted-foreground">This morning&rsquo;s real edition, with your ad as typed.</p>
          </div>
        </figure>
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
