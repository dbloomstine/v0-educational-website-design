import { ImageResponse } from 'next/og'
import { loadLeague } from '@/lib/news/league-data'
import { leagueRows } from '@/lib/news/league'
import { sizeLabel, totalLabel } from '@/lib/news/format'

/**
 * The league table's own share card (2026-10-21: Danny's LinkedIn post showed the site-wide card, "Fund news and a
 * morning newsletter", under a link to the league table). The year's five largest final closes as bars, set large
 * enough to read at the size LinkedIn shows a preview. Remade hourly; if the data cannot be read, the card still says
 * what the page is.
 */
export const alt = 'FundOpsHQ league tables: the largest private fund closes of the year'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 3600

const CREAM = '#F8F5EC'
const NAVY = '#1E3A5F'
const NAVY_DEEP = '#0F1E33'
const AMBER = '#E6B045'
const MUTED = '#8FA0B7'
const HAIRLINE = 'rgba(248,245,236,0.16)'
const SANS = 'system-ui, -apple-system, sans-serif'

export default async function LeagueOG() {
  const year = new Date().getUTCFullYear()
  let top: { firm: string; fund: string | null; size: string; usdM: number }[] = []
  let summary = ''
  try {
    const rows = leagueRows(await loadLeague(), { period: 'ytd', stage: 'final' }, Date.now()).sort((a, b) => b.sizeUsdM - a.sizeUsdM)
    top = rows.slice(0, 5).map((c) => ({ firm: c.firm, fund: c.fund, size: sizeLabel(c.sizeUsdM) ?? '', usdM: c.sizeUsdM }))
    summary = `${rows.length.toLocaleString('en-US')} final closes · ${totalLabel(rows.reduce((s, c) => s + c.sizeUsdM, 0))}`
  } catch {
    top = []
  }
  const max = top[0]?.usdM ?? 1

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: NAVY_DEEP, color: CREAM, fontFamily: 'Georgia, "Times New Roman", serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 56px', borderBottom: `1px solid ${HAIRLINE}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 34, fontWeight: 700, fontFamily: SANS, letterSpacing: '-0.01em' }}>FundOpsHQ</span>
            <span style={{ fontSize: 18, fontFamily: SANS, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: MUTED, marginLeft: 22 }}>League tables</span>
          </div>
          <span style={{ fontSize: 18, fontFamily: SANS, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: AMBER }}>fundopshq.com</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', padding: '30px 56px 0' }}>
          <div style={{ display: 'flex', fontSize: 58, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
            <span>The largest fund closes of&nbsp;</span>
            <span style={{ fontStyle: 'italic', color: AMBER }}>{year}</span>
          </div>
          {summary ? <div style={{ display: 'flex', marginTop: 12, fontSize: 22, fontFamily: SANS, fontWeight: 600, color: MUTED }}>{summary} so far</div> : null}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px', gap: 14 }}>
          {top.length ? (
            top.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: 40, fontSize: 26, fontFamily: SANS, fontWeight: 700, color: MUTED }}>{i + 1}</span>
                <div style={{ width: 470, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{c.firm.length > 26 ? `${c.firm.slice(0, 25)}…` : c.firm}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div style={{ height: 22, width: `${Math.max(6, Math.round((c.usdM / max) * 100))}%`, backgroundColor: AMBER, borderRadius: 3 }} />
                </div>
                <span style={{ width: 130, textAlign: 'right', justifyContent: 'flex-end', display: 'flex', fontSize: 32, fontFamily: SANS, fontWeight: 800 }}>{c.size}</span>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', fontSize: 34, color: MUTED }}>Every private fund close we report, ranked by size, updated daily.</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: NAVY, borderTop: `1px solid ${HAIRLINE}`, padding: '20px 56px', fontFamily: SANS, fontSize: 19, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED }}>
          <span>Final closes · updated daily</span>
          <span>For GPs, LPs &amp; fund service providers</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
