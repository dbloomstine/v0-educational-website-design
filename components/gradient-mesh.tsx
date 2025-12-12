'use client'

interface GradientMeshProps {
  className?: string
}

export function GradientMesh({ className = '' }: GradientMeshProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(215, 50%, 15%) 0%, hsl(215, 45%, 20%) 100%)'
        }}
      />

      {/* Mesh blob 1 - top right */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 80% 20%, hsla(210, 60%, 35%, 0.4) 0%, hsla(210, 50%, 25%, 0.15) 50%, transparent 70%)'
        }}
      />

      {/* Mesh blob 2 - bottom left */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at 15% 85%, hsla(230, 40%, 30%, 0.35) 0%, hsla(225, 35%, 22%, 0.1) 50%, transparent 70%)'
        }}
      />

      {/* Mesh blob 3 - center accent */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, hsla(195, 50%, 30%, 0.12) 0%, transparent 60%)'
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(hsla(215, 30%, 60%, 1) 1px, transparent 1px),
            linear-gradient(90deg, hsla(215, 30%, 60%, 1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Noise texture overlay using SVG filter */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, hsla(215, 50%, 8%, 0.5) 100%)'
        }}
      />
    </div>
  )
}
