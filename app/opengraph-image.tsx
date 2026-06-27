import { ImageResponse } from 'next/og'

export const alt =
  'FundOpsHQ — fund news and the FundOps Daily newsletter for GPs, LPs, and fund service providers'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CREAM = '#F8F5EC'
const NAVY = '#1E3A5F'
const NAVY_DEEP = '#0F1E33'
const AMBER = '#E6B045'
const MUTED = '#8595AC'
const HAIRLINE = 'rgba(248,245,236,0.16)'

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: NAVY_DEEP,
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: CREAM,
        }}
      >
        {/* Masthead strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '22px 56px',
            borderBottom: `1px solid ${HAIRLINE}`,
            fontSize: 16,
            letterSpacing: '0.22em',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 700,
            color: MUTED,
            textTransform: 'uppercase',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: CREAM }}>Vol. I</span>
            <span style={{ color: 'rgba(248,245,236,0.3)' }}>·</span>
            <span>The Daily Brief for Private Markets</span>
          </div>
          <span style={{ color: AMBER }}>fundopshq.com</span>
        </div>

        {/* Hero copy */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 56px',
          }}
        >
          <div
            style={{
              fontSize: 21,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: MUTED,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 700,
              marginBottom: 30,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <span style={{ height: 1, width: 48, backgroundColor: 'rgba(248,245,236,0.5)', display: 'block' }} />
            <span>News · Newsletter · For the Funds Industry</span>
          </div>

          <div
            style={{
              fontSize: 92,
              lineHeight: 0.96,
              letterSpacing: '-0.035em',
              fontWeight: 500,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Fund news and a</span>
            <span style={{ fontStyle: 'italic', color: AMBER }}>morning newsletter.</span>
          </div>
        </div>

        {/* Footer bar */}
        <div
          style={{
            display: 'flex',
            borderTop: `1px solid ${HAIRLINE}`,
            backgroundColor: NAVY,
            padding: '26px 56px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em' }}>FundOps</span>
            <span style={{ fontSize: 32, fontWeight: 700, fontStyle: 'italic', letterSpacing: '-0.01em', color: AMBER }}>Daily</span>
          </div>
          <div
            style={{
              fontSize: 19,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: MUTED,
            }}
          >
            For GPs, LPs &amp; Fund Service Providers
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
