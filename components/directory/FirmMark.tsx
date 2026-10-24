import type { FirmLogo } from '@/lib/directory/logos'

/**
 * A firm's mark in a fixed box, so nothing on the page moves when it loads (lib/directory/logos.ts says where each
 * mark came from and how it is drawn). No hooks: the server pages and the browser list both use it.
 *
 *   ink    a single-ink silhouette, so a column of logos reads as print, not as a row of adverts;
 *   plate  greys on an ink plate (a mark with white parts that would vanish on cream);
 *   own    greys, on the file's own background.
 *
 * No mark on file: the firm's initials, set in the house serif, in the same box.
 */

const SIZES = {
  // A table cell (components/directory/explore): one line high.
  xs: { w: 48, h: 24, pad: 2, type: 'text-[11px]' },
  // A row in a list: wide enough for a wordmark, short enough to sit beside two lines of text.
  sm: { w: 72, h: 36, pad: 4, type: 'text-[14px]' },
  md: { w: 112, h: 48, pad: 6, type: 'text-[18px]' },
  lg: { w: 176, h: 72, pad: 10, type: 'text-[26px]' },
} as const

export type MarkSize = keyof typeof SIZES

export function FirmMark({
  name,
  logo,
  mono,
  size = 'sm',
  decorative = false,
  eager = false,
  className = '',
}: {
  name: string
  logo: FirmLogo | null
  mono: string
  size?: MarkSize
  /** Beside the firm's name in text: hidden from screen readers, which would otherwise read the name twice. */
  decorative?: boolean
  eager?: boolean
  className?: string
}) {
  const s = SIZES[size]
  const box = { width: s.w, height: s.h }
  if (!logo) {
    return (
      <span
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : name}
        aria-hidden={decorative || undefined}
        style={box}
        className={`inline-flex shrink-0 items-center justify-center rounded-[2px] border border-foreground/20 bg-card font-news font-semibold leading-none tracking-[0.02em] text-foreground/70 ${s.type} ${className}`}
      >
        {mono}
      </span>
    )
  }
  const plate = logo.mode === 'plate'
  // Fit the mark inside the box less its padding, keeping its shape: the img's own width and height are what it draws at.
  const innerW = s.w - s.pad * 2
  const innerH = s.h - s.pad * 2
  const scale = Math.min(innerW / logo.width, innerH / logo.height, 1.6)
  const w = Math.max(1, Math.round(logo.width * scale))
  const h = Math.max(1, Math.round(logo.height * scale))
  return (
    <span
      style={box}
      aria-hidden={decorative || undefined}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[2px] ${plate ? 'bg-[var(--ink,#2a3b55)]' : ''} ${className}`}
    >
      <img
        src={logo.src}
        alt={decorative ? '' : name}
        width={w}
        height={h}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{ width: w, height: h, filter: logo.mode === 'ink' ? 'brightness(0)' : 'grayscale(1)', opacity: logo.mode === 'ink' ? 0.82 : 1 }}
      />
    </span>
  )
}
