import { ImageResponse } from 'next/og'

export const alt =
  'Sponsor the morning brief for private markets — FundOps Daily launch rates'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CREAM = '#F8F5EC'
const NAVY = '#1E3A5F'
const AMBER = '#E6B045'
const MUTED = '#5A6B82'
const HAIRLINE = '#B8AF99'

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: CREAM,
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: NAVY,
          padding: '0',
        }}
      >
        {/* Masthead strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 56px',
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
            <span style={{ color: NAVY }}>Vol. I</span>
            <span style={{ color: HAIRLINE }}>·</span>
            <span>FundOpsHQ · Section E</span>
          </div>
          <span style={{ color: NAVY }}>Sponsor the Paper</span>
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
              fontSize: 22,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: MUTED,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 700,
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <span style={{ height: 1, width: 48, backgroundColor: NAVY, display: 'block' }} />
            <span>Rate Card · FundOps Daily</span>
          </div>

          <div
            style={{
              fontSize: 96,
              lineHeight: 0.95,
              letterSpacing: '-0.035em',
              fontWeight: 500,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>
              Sponsor the{' '}
              <span style={{ fontStyle: 'italic', color: AMBER }}>morning brief</span>
            </span>
            <span>for private markets.</span>
          </div>
        </div>

        {/* Stats footer */}
        <div
          style={{
            display: 'flex',
            borderTop: `1px solid ${HAIRLINE}`,
            padding: '28px 56px',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 56 }}>
            <Stat kpi="98" label="Confirmed subscribers" />
            <Stat kpi="56%" label="7-day open rate" />
            <Stat kpi="$500" label="Launch rate / week" />
          </div>
          <div
            style={{
              fontSize: 20,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: AMBER,
            }}
          >
            fundopshq.com/sponsor
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}

function Stat({ kpi, label }: { kpi: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 52, lineHeight: 1, letterSpacing: '-0.02em', fontWeight: 500 }}>
        {kpi}
      </span>
      <span
        style={{
          marginTop: 10,
          fontSize: 14,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: MUTED,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 700,
        }}
      >
        {label}
      </span>
    </div>
  )
}
