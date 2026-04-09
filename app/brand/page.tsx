import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { ArrowDownToLine, ArrowRight, Package } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Brand Kit | FundOpsHQ',
  description:
    'Logos, monograms, patterns, backgrounds and posters for FundOpsHQ — free to download for press, partners, and guests.',
  openGraph: {
    title: 'FundOpsHQ Brand Kit',
    description: 'Logos, monograms, patterns and backgrounds for FundOpsHQ.',
    type: 'website',
    url: 'https://fundopshq.com/brand',
  },
  alternates: {
    canonical: 'https://fundopshq.com/brand',
  },
}

const today = new Date()
  .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  .toUpperCase()

// ─── Asset definitions ───────────────────────────────────────────────────────

type Surface = 'navy' | 'cream' | 'broadcast' | 'amber' | 'transparent'

interface Asset {
  src: string
  name: string
  format: string
  surface: Surface
  span?: 1 | 2 | 3 | 4
  fit?: 'contain' | 'cover'
}

const WORDMARKS: Asset[] = [
  { src: '/brand/wordmark-on-navy.svg',         name: 'Wordmark · Navy',         format: 'SVG', surface: 'navy', span: 2 },
  { src: '/brand/wordmark-on-cream.svg',        name: 'Wordmark · Cream',        format: 'SVG', surface: 'cream', span: 2 },
  { src: '/brand/wordmark-on-black.svg',        name: 'Wordmark · Black',        format: 'SVG', surface: 'broadcast', span: 2 },
  { src: '/brand/wordmark-on-broadcast.svg',    name: 'Wordmark · Broadcast',    format: 'SVG', surface: 'broadcast', span: 2 },
  { src: '/brand/wordmark-amber-on-navy.svg',   name: 'Wordmark · Amber',        format: 'SVG', surface: 'navy', span: 2 },
  { src: '/brand/wordmark-light.svg',           name: 'Wordmark · Light (transparent)', format: 'SVG', surface: 'transparent', span: 2 },
  { src: '/brand/wordmark-dark.svg',            name: 'Wordmark · Dark (transparent)',  format: 'SVG', surface: 'cream', span: 2 },
  { src: '/brand/wordmark-amber.svg',           name: 'Wordmark · Amber (transparent)', format: 'SVG', surface: 'navy', span: 2 },
]

const STACKED: Asset[] = [
  { src: '/brand/wordmark-stacked-on-navy.svg',  name: 'Stacked · Navy',  format: 'SVG', surface: 'navy', span: 2 },
  { src: '/brand/wordmark-stacked-on-cream.svg', name: 'Stacked · Cream', format: 'SVG', surface: 'cream', span: 2 },
  { src: '/brand/lockup-editorial-on-navy.svg',  name: 'Editorial Lockup · Navy',  format: 'SVG', surface: 'navy', span: 4 },
  { src: '/brand/lockup-editorial-on-cream.svg', name: 'Editorial Lockup · Cream', format: 'SVG', surface: 'cream', span: 4 },
]

const MARKS: Asset[] = [
  { src: '/brand/monogram-square-navy.svg',  name: 'Monogram · Navy',  format: 'SVG', surface: 'navy' },
  { src: '/brand/monogram-square-cream.svg', name: 'Monogram · Cream', format: 'SVG', surface: 'cream' },
  { src: '/brand/monogram-square-amber.svg', name: 'Monogram · Amber', format: 'SVG', surface: 'amber' },
  { src: '/brand/roundel-navy.svg',          name: 'Roundel Seal · Navy',  format: 'SVG', surface: 'navy' },
  { src: '/brand/roundel-cream.svg',         name: 'Roundel Seal · Cream', format: 'SVG', surface: 'cream' },
  { src: '/brand/roundel-amber.svg',         name: 'Roundel Seal · Amber', format: 'SVG', surface: 'amber' },
  { src: '/brand/italic-mark-navy.svg',      name: 'Italic F · Navy',      format: 'SVG', surface: 'navy' },
  { src: '/brand/italic-mark-cream.svg',     name: 'Italic F · Cream',     format: 'SVG', surface: 'cream' },
  { src: '/brand/italic-mark-broadcast.svg', name: 'Italic F · Broadcast', format: 'SVG', surface: 'broadcast' },
  { src: '/brand/favicon-mark.svg',          name: 'Favicon Mark',         format: 'SVG', surface: 'navy' },
]

const PATTERNS: Asset[] = [
  { src: '/brand/pattern-grid-navy.svg',         name: 'Hairline Grid · Navy',     format: 'SVG', surface: 'navy', span: 2, fit: 'cover' },
  { src: '/brand/pattern-grid-cream.svg',        name: 'Hairline Grid · Cream',    format: 'SVG', surface: 'cream', span: 2, fit: 'cover' },
  { src: '/brand/pattern-grid-broadcast.svg',    name: 'Hairline Grid · Broadcast',format: 'SVG', surface: 'broadcast', span: 2, fit: 'cover' },
  { src: '/brand/pattern-wordmark-navy.svg',     name: 'Wordmark Watermark · Navy',format: 'SVG', surface: 'navy', span: 2, fit: 'cover' },
  { src: '/brand/pattern-wordmark-cream.svg',    name: 'Wordmark Watermark · Cream',format: 'SVG', surface: 'cream', span: 2, fit: 'cover' },
  { src: '/brand/pattern-scanlines-broadcast.svg',name: 'Scan Lines · Broadcast',  format: 'SVG', surface: 'broadcast', span: 2, fit: 'cover' },
  { src: '/brand/pattern-scanlines-navy.svg',    name: 'Scan Lines · Navy',        format: 'SVG', surface: 'navy', span: 2, fit: 'cover' },
  { src: '/brand/pattern-colorbars.svg',         name: 'Broadcast Color Bars',     format: 'SVG', surface: 'broadcast', span: 4, fit: 'contain' },
  { src: '/brand/pattern-cornerticks-amber.svg', name: 'Corner Ticks · Amber',     format: 'SVG', surface: 'navy' },
  { src: '/brand/pattern-cornerticks-white.svg', name: 'Corner Ticks · White',     format: 'SVG', surface: 'broadcast' },
  { src: '/brand/pattern-editorial-rules.svg',   name: 'Editorial Rules · Navy',   format: 'SVG', surface: 'cream', span: 2, fit: 'contain' },
  { src: '/brand/pattern-editorial-rules-light.svg', name: 'Editorial Rules · Light', format: 'SVG', surface: 'navy', span: 2, fit: 'contain' },
]

const BACKGROUNDS: Asset[] = [
  { src: '/brand/bg-solid-navy.svg',       name: 'Background · Navy',       format: 'SVG', surface: 'navy', span: 2, fit: 'cover' },
  { src: '/brand/bg-solid-cream.svg',      name: 'Background · Cream',      format: 'SVG', surface: 'cream', span: 2, fit: 'cover' },
  { src: '/brand/bg-solid-broadcast.svg',  name: 'Background · Broadcast',  format: 'SVG', surface: 'broadcast', span: 2, fit: 'cover' },
  { src: '/brand/bg-solid-amber.svg',      name: 'Background · Amber',      format: 'SVG', surface: 'amber', span: 2, fit: 'cover' },
  { src: '/brand/bg-vignette-navy.svg',    name: 'Vignette · Navy',         format: 'SVG', surface: 'navy', span: 2, fit: 'cover' },
  { src: '/brand/bg-gradient-navy.svg',    name: 'Gradient · Navy',         format: 'SVG', surface: 'navy', span: 2, fit: 'cover' },
  { src: '/brand/bg-gradient-broadcast.svg',name: 'Gradient · Broadcast',   format: 'SVG', surface: 'broadcast', span: 2, fit: 'cover' },
]

const POSTERS: Asset[] = [
  { src: '/brand/poster-editorial.svg', name: 'Editorial Poster', format: 'SVG · 1200×1500', surface: 'navy', span: 2, fit: 'cover' },
  { src: '/brand/social-og-card.svg',   name: 'Social · OG Card', format: 'SVG · 1200×630',  surface: 'navy', span: 4, fit: 'cover' },
]

// ─── Color palette ───────────────────────────────────────────────────────────

const COLORS = [
  { name: 'Deep Navy',   role: 'Background',   hex: '#1E3A5F', oklch: 'oklch(0.32 0.055 250)', text: 'light' },
  { name: 'Card Navy',   role: 'Surface',      hex: '#13243C', oklch: 'oklch(0.28 0.05 250)',  text: 'light' },
  { name: 'Broadcast',   role: 'Show / Hero',  hex: '#0B1726', oklch: 'oklch(0.18 0.04 250)',  text: 'light' },
  { name: 'Amber',       role: 'Accent',       hex: '#E6B045', oklch: 'oklch(0.85 0.12 85)',   text: 'dark'  },
  { name: 'Live Red',    role: 'Broadcast',    hex: '#EF4444', oklch: 'oklch(0.63 0.22 25)',   text: 'light' },
  { name: 'Cream',       role: 'Editorial',    hex: '#F8F5EC', oklch: 'oklch(0.96 0.02 90)',   text: 'dark'  },
  { name: 'Slate',       role: 'Muted text',   hex: '#64748B', oklch: 'oklch(0.55 0.03 250)',  text: 'light' },
  { name: 'Caption',     role: 'Caption text', hex: '#94A3B8', oklch: 'oklch(0.72 0.02 250)',  text: 'dark'  },
] as const

// ─── Surface backgrounds (CSS for tiles) ─────────────────────────────────────

const SURFACE_BG: Record<Surface, string> = {
  navy: '#1E3A5F',
  cream: '#F8F5EC',
  broadcast: '#0B1726',
  amber: '#E6B045',
  transparent:
    'repeating-conic-gradient(rgba(255,255,255,0.06) 0% 25%, transparent 0% 50%) 50% / 24px 24px',
}

// ─── Asset tile component ────────────────────────────────────────────────────

function AssetTile({ asset }: { asset: Asset }) {
  const span = asset.span ?? 1
  const colSpan =
    span === 4 ? 'sm:col-span-4' : span === 3 ? 'sm:col-span-3' : span === 2 ? 'sm:col-span-2' : ''
  return (
    <a
      href={asset.src}
      download
      className={`group relative flex flex-col overflow-hidden rounded-sm border-2 border-foreground/15 bg-card/40 transition-all hover:border-amber-400/50 hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ${colSpan}`}
    >
      <div
        className="relative flex aspect-[16/10] items-center justify-center overflow-hidden"
        style={{ background: SURFACE_BG[asset.surface] }}
      >
        <img
          src={asset.src}
          alt={asset.name}
          className={`max-h-full max-w-full ${asset.fit === 'cover' ? 'h-full w-full object-cover' : 'p-8 object-contain'}`}
          loading="lazy"
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t-2 border-foreground/15 bg-background px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">
            {asset.name}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
            {asset.format}
          </p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-foreground/20 bg-card/60 text-muted-foreground transition-colors group-hover:border-amber-400/60 group-hover:bg-amber-400/10 group-hover:text-amber-400">
          <ArrowDownToLine className="h-3.5 w-3.5" />
        </div>
      </div>
    </a>
  )
}

// ─── Section masthead ─────────────────────────────────────────────────────────

function SectionMasthead({ id, no, label, right }: { id: string; no: string; label: string; right?: string }) {
  return (
    <div id={id} className="border-y border-foreground/10 scroll-mt-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
          <span className="flex items-center gap-3">
            <span className="text-foreground/80">{no}</span>
            <span aria-hidden="true" className="text-foreground/20">·</span>
            <span>{label}</span>
          </span>
          {right && <span className="hidden sm:inline">{right}</span>}
        </div>
      </div>
    </div>
  )
}

function SectionHeadline({ left, italic, right }: { left: string; italic: string; right?: string }) {
  return (
    <div className="mb-10 grid gap-6 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-8">
        <h2
          className="font-display text-foreground"
          style={{
            fontSize: 'clamp(36px, 5vw, 64px)',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          {left}{' '}
          <span
            className="italic"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
          >
            {italic}
          </span>
        </h2>
      </div>
      {right && (
        <div className="lg:col-span-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60 leading-relaxed">
            {right}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrandPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ─── Top masthead bar ─── */}
        <div className="border-b border-foreground/10">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
            <span className="flex items-center gap-3">
              <span className="text-foreground/90">Vol. I</span>
              <span aria-hidden="true" className="text-foreground/20">·</span>
              <span>{today}</span>
            </span>
            <span className="flex items-center gap-3">
              <span>Section D</span>
              <span aria-hidden="true" className="text-foreground/20">·</span>
              <span className="text-foreground/80">Brand Kit</span>
            </span>
          </div>
        </div>

        {/* ─── Hero ─── */}
        <section className="relative isolate overflow-hidden border-b-2 border-foreground/15">
          {/* Background editorial wordmark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-12 -bottom-12 flex items-end justify-center select-none"
          >
            <span
              className="font-display italic font-black tracking-[-0.05em] leading-[0.78] whitespace-nowrap"
              style={{
                fontSize: 'clamp(220px, 32vw, 520px)',
                background:
                  'linear-gradient(180deg, oklch(0.98 0 0 / 0.13) 0%, oklch(0.98 0 0 / 0.04) 60%, transparent 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                fontVariationSettings: '"opsz" 144, "SOFT" 100',
              }}
            >
              Brand Kit
            </span>
          </div>

          {/* Hairline grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(to right, oklch(0.98 0 0) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.98 0 0) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />

          <div className="relative z-10 container mx-auto px-4 py-16 sm:py-24">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <div className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                  <span className="h-px w-8 bg-foreground/40" />
                  Press Kit · Free to Download
                </div>

                <h1
                  className="font-display text-foreground"
                  style={{
                    fontSize: 'clamp(44px, 7vw, 104px)',
                    lineHeight: 0.92,
                    letterSpacing: '-0.035em',
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144, "SOFT" 30',
                  }}
                >
                  The FundOpsHQ
                  <br />
                  <span
                    className="italic"
                    style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                  >
                    brand kit.
                  </span>
                </h1>

                <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Wordmarks, monograms, patterns, backgrounds and posters — for press, partners, sponsors, and
                  anyone publishing about the show or the newsletter. Click any tile to download.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-wrap gap-3 lg:justify-end">
                <a
                  href="/brand/fundopshq-press-kit.zip"
                  download
                  className="group inline-flex items-center gap-2 rounded-sm bg-foreground px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-amber-400"
                >
                  <Package className="h-4 w-4" />
                  Download Press Kit (.zip)
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>

            {/* Quick nav */}
            <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-foreground/10 pt-6 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              {[
                ['#colors', 'Colors'],
                ['#wordmarks', 'Wordmarks'],
                ['#stacked', 'Stacked Lockups'],
                ['#marks', 'Marks & Monograms'],
                ['#patterns', 'Patterns'],
                ['#backgrounds', 'Backgrounds'],
                ['#typography', 'Typography'],
                ['#headshots', 'Headshots'],
                ['#posters', 'Posters'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="hover:text-foreground transition-colors">
                  ↓ {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Colors ─── */}
        <SectionMasthead id="colors" no="Section D.1" label="Color Palette" right="Hex · OKLCH · Surface roles" />
        <section className="border-b-2 border-foreground/15 bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <SectionHeadline
              left="A monochrome navy with"
              italic="amber accents."
              right="Deep Navy is the canvas. Amber lights the editorial italics. Live Red is reserved for the broadcast."
            />
            <div className="grid gap-px bg-foreground/10 sm:grid-cols-2 lg:grid-cols-4 border border-foreground/15">
              {COLORS.map((c) => (
                <div key={c.hex} className="flex flex-col bg-background">
                  <div
                    className="flex aspect-[16/9] items-end p-5"
                    style={{ background: c.hex, color: c.text === 'dark' ? '#0B1726' : '#FFFFFF' }}
                  >
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
                        {c.role}
                      </p>
                      <p
                        className="mt-1 font-display"
                        style={{
                          fontSize: '28px',
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                          fontVariationSettings: '"opsz" 60',
                        }}
                      >
                        {c.name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 border-t-2 border-foreground/15 px-5 py-3">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="uppercase tracking-[0.15em] text-muted-foreground/60">Hex</span>
                      <span className="font-bold text-foreground">{c.hex}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="uppercase tracking-[0.15em] text-muted-foreground/60">OKLCH</span>
                      <span className="text-foreground/80 truncate ml-3">{c.oklch}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Wordmarks ─── */}
        <SectionMasthead id="wordmarks" no="Section D.2" label="Wordmarks" right="The horizontal logo, in every flavor" />
        <section className="border-b-2 border-foreground/15 bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <SectionHeadline
              left="The wordmark, in"
              italic="every flavor."
              right="Use the variant whose background contrast matches your surface. Transparent versions for use over photography."
            />
            <div className="grid gap-4 sm:grid-cols-4">
              {WORDMARKS.map((a) => (
                <AssetTile key={a.src} asset={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Stacked & lockups ─── */}
        <SectionMasthead id="stacked" no="Section D.3" label="Stacked Lockups" right="Wordmark + tagline · Editorial lockups" />
        <section className="border-b-2 border-foreground/15 bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <SectionHeadline
              left="Stacked lockups for"
              italic="vertical layouts."
              right="The full editorial lockup includes Vol. I, the tagline, and the channel ledger."
            />
            <div className="grid gap-4 sm:grid-cols-4">
              {STACKED.map((a) => (
                <AssetTile key={a.src} asset={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Marks ─── */}
        <SectionMasthead id="marks" no="Section D.4" label="Marks & Monograms" right="Square · Roundel · Italic F" />
        <section className="border-b-2 border-foreground/15 bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <SectionHeadline
              left="Marks for avatars,"
              italic="favicons & seals."
              right="The roundel works as a publisher seal. The italic F is the most distilled form of the brand."
            />
            <div className="grid gap-4 sm:grid-cols-4 lg:grid-cols-5">
              {MARKS.map((a) => (
                <AssetTile key={a.src} asset={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Patterns ─── */}
        <SectionMasthead id="patterns" no="Section D.5" label="Patterns & Textures" right="Hairline grid · Wordmark · Scan lines · Color bars" />
        <section className="border-b-2 border-foreground/15 bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <SectionHeadline
              left="Editorial &"
              italic="broadcast textures."
              right="Use the hairline grid for editorial surfaces, scan lines for the broadcast, and color bars to flag the show."
            />
            <div className="grid gap-4 sm:grid-cols-4">
              {PATTERNS.map((a) => (
                <AssetTile key={a.src} asset={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Backgrounds ─── */}
        <SectionMasthead id="backgrounds" no="Section D.6" label="Backgrounds" right="Solid · Vignette · Gradient" />
        <section className="border-b-2 border-foreground/15 bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <SectionHeadline
              left="Backgrounds &"
              italic="surfaces."
              right="Drop-in canvas backgrounds for slides, social posts, and event materials."
            />
            <div className="grid gap-4 sm:grid-cols-4">
              {BACKGROUNDS.map((a) => (
                <AssetTile key={a.src} asset={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Typography ─── */}
        <SectionMasthead id="typography" no="Section D.7" label="Typography" right="Fraunces · Inter · JetBrains Mono" />
        <section className="border-b-2 border-foreground/15 bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <SectionHeadline
              left="Three typefaces,"
              italic="one voice."
              right="All three are free via Google Fonts. Use Fraunces for headlines, Inter for body, JetBrains Mono for editorial labels."
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Fraunces */}
              <a
                href="https://fonts.google.com/specimen/Fraunces"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-sm border-2 border-foreground/15 bg-card/40 p-7 transition-all hover:border-amber-400/50 hover:bg-card/70"
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
                  Display · Variable Serif
                </p>
                <h3 className="font-display text-5xl text-foreground" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30', letterSpacing: '-0.025em' }}>
                  Fraunces
                </h3>
                <p
                  className="mt-2 italic font-display text-3xl text-amber-400"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
                >
                  Fraunces italic.
                </p>
                <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                  Variable display serif with optical sizing and a SOFT axis. Used for editorial headlines, italic
                  accents, and the wordmark watermark.
                </p>
                <div className="mt-auto pt-6 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors group-hover:text-amber-400">
                  Google Fonts <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </a>

              {/* Inter */}
              <a
                href="https://fonts.google.com/specimen/Inter"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-sm border-2 border-foreground/15 bg-card/40 p-7 transition-all hover:border-amber-400/50 hover:bg-card/70"
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
                  Body · Sans-serif
                </p>
                <h3 className="text-5xl font-bold text-foreground tracking-tight">Inter</h3>
                <p className="mt-2 text-3xl text-foreground/70 font-medium">Inter Regular.</p>
                <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                  Body copy, paragraphs, and any longer-form reading. Already widely used and pairs cleanly with Fraunces.
                </p>
                <div className="mt-auto pt-6 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors group-hover:text-amber-400">
                  Google Fonts <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </a>

              {/* JetBrains Mono */}
              <a
                href="https://fonts.google.com/specimen/JetBrains+Mono"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-sm border-2 border-foreground/15 bg-card/40 p-7 transition-all hover:border-amber-400/50 hover:bg-card/70"
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
                  Editorial Labels · Mono
                </p>
                <h3 className="font-mono text-4xl font-bold text-foreground tracking-tight">JetBrains</h3>
                <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
                  Vol. I · Section A · The Wire
                </p>
                <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                  All-caps mono labels, eyebrows, mastheads, dates, channel numbers — anywhere the brand wants to
                  feel like a newsroom or terminal.
                </p>
                <div className="mt-auto pt-6 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors group-hover:text-amber-400">
                  Google Fonts <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ─── Headshots ─── */}
        <SectionMasthead id="headshots" no="Section D.8" label="Photography" right="Editor portrait" />
        <section className="border-b-2 border-foreground/15 bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <SectionHeadline
              left="Editor"
              italic="portraits."
              right="Use for press write-ups, podcast introductions, and guest exchanges."
            />
            <div className="grid gap-4 sm:grid-cols-4">
              <a
                href="/danny-headshot-nobg.png"
                download
                className="group sm:col-span-2 flex flex-col overflow-hidden rounded-sm border-2 border-foreground/15 bg-card/40 transition-all hover:border-amber-400/50"
              >
                <div className="relative aspect-square bg-[#1E3A5F]">
                  <Image
                    src="/danny-headshot-nobg.png"
                    alt="Danny Bloomstine — transparent"
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 border-t-2 border-foreground/15 bg-background px-4 py-3">
                  <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">
                      Danny Bloomstine · Transparent
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
                      PNG · 423×423
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-foreground/20 bg-card/60 text-muted-foreground transition-colors group-hover:border-amber-400/60 group-hover:bg-amber-400/10 group-hover:text-amber-400">
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                  </div>
                </div>
              </a>

              <a
                href="/danny-headshot.png"
                download
                className="group sm:col-span-2 flex flex-col overflow-hidden rounded-sm border-2 border-foreground/15 bg-card/40 transition-all hover:border-amber-400/50"
              >
                <div className="relative aspect-square bg-[#F8F5EC]">
                  <Image
                    src="/danny-headshot.png"
                    alt="Danny Bloomstine — full"
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 border-t-2 border-foreground/15 bg-background px-4 py-3">
                  <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">
                      Danny Bloomstine · Full
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
                      PNG · 533×471
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-foreground/20 bg-card/60 text-muted-foreground transition-colors group-hover:border-amber-400/60 group-hover:bg-amber-400/10 group-hover:text-amber-400">
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ─── Posters ─── */}
        <SectionMasthead id="posters" no="Section D.9" label="Posters & Social Cards" right="Print-ready editorial poster · OG card" />
        <section className="border-b-2 border-foreground/15 bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <SectionHeadline
              left="Posters &"
              italic="social cards."
              right="Drop-in editorial posters and Open Graph cards for social sharing."
            />
            <div className="grid gap-4 sm:grid-cols-4">
              {POSTERS.map((a) => (
                <AssetTile key={a.src} asset={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Closing CTA ─── */}
        <section className="relative bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                <span className="h-px w-8 bg-foreground/40" />
                Get the Bundle
                <span className="h-px w-8 bg-foreground/40" />
              </div>
              <h2
                className="font-display text-foreground"
                style={{
                  fontSize: 'clamp(36px, 5vw, 60px)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.03em',
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Take the{' '}
                <span
                  className="italic"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                >
                  whole kit.
                </span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                Every wordmark, mark, pattern, background and poster — packaged into a single ZIP.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/brand/fundopshq-press-kit.zip"
                  download
                  className="group inline-flex items-center gap-2 rounded-sm bg-foreground px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-amber-400"
                >
                  <Package className="h-4 w-4" />
                  Download the Press Kit
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-sm border-2 border-foreground/20 bg-card/40 px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-foreground/40 hover:bg-card/70"
                >
                  About FundOpsHQ
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
