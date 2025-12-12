'use client'

import { useEffect, useRef } from 'react'

interface GradientMeshProps {
  className?: string
}

export function GradientMesh({ className = '' }: GradientMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      draw()
    }

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height

      // Clear canvas
      ctx.clearRect(0, 0, w, h)

      // Base gradient - deep navy
      const baseGradient = ctx.createLinearGradient(0, 0, w, h)
      baseGradient.addColorStop(0, 'hsl(215, 50%, 15%)')
      baseGradient.addColorStop(1, 'hsl(215, 45%, 20%)')
      ctx.fillStyle = baseGradient
      ctx.fillRect(0, 0, w, h)

      // Mesh blob 1 - subtle blue glow (top right)
      const gradient1 = ctx.createRadialGradient(
        w * 0.8, h * 0.2, 0,
        w * 0.8, h * 0.2, w * 0.5
      )
      gradient1.addColorStop(0, 'hsla(210, 60%, 35%, 0.4)')
      gradient1.addColorStop(0.5, 'hsla(210, 50%, 25%, 0.2)')
      gradient1.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient1
      ctx.fillRect(0, 0, w, h)

      // Mesh blob 2 - slate/purple glow (bottom left)
      const gradient2 = ctx.createRadialGradient(
        w * 0.15, h * 0.85, 0,
        w * 0.15, h * 0.85, w * 0.6
      )
      gradient2.addColorStop(0, 'hsla(230, 40%, 30%, 0.35)')
      gradient2.addColorStop(0.5, 'hsla(225, 35%, 22%, 0.15)')
      gradient2.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient2
      ctx.fillRect(0, 0, w, h)

      // Mesh blob 3 - subtle teal accent (center)
      const gradient3 = ctx.createRadialGradient(
        w * 0.5, h * 0.5, 0,
        w * 0.5, h * 0.5, w * 0.4
      )
      gradient3.addColorStop(0, 'hsla(195, 50%, 30%, 0.15)')
      gradient3.addColorStop(0.6, 'hsla(200, 40%, 25%, 0.08)')
      gradient3.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient3
      ctx.fillRect(0, 0, w, h)

      // Add subtle noise texture overlay
      addNoiseOverlay(ctx, w, h)

      // Add grid pattern overlay
      addGridOverlay(ctx, w, h)
    }

    const addNoiseOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const imageData = ctx.getImageData(0, 0, w * window.devicePixelRatio, h * window.devicePixelRatio)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 15
        data[i] = Math.max(0, Math.min(255, data[i] + noise))
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
      }

      ctx.putImageData(imageData, 0, 0)
    }

    const addGridOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.strokeStyle = 'hsla(215, 30%, 40%, 0.08)'
      ctx.lineWidth = 1

      const gridSize = 40

      // Vertical lines
      for (let x = 0; x <= w; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      // Horizontal lines
      for (let y = 0; y <= h; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsla(215, 50%, 10%, 0.4) 100%)'
        }}
      />
    </div>
  )
}
