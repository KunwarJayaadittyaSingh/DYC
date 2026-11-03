import React, { useEffect, useRef } from 'react'

// One <canvas> instead of ~140 animated DOM nodes. Same stars, twinkle,
// comets, nebula and mouse parallax. Pauses when the tab is hidden.
const StarBackground = ({ count = 140, cometCount = 6 }) => {
  const canvasRef = useRef(null)
  const nebulaRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.innerWidth < 768
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5)
    const total = mobile ? Math.round(count * 0.5) : count
    const totalComets = mobile ? 2 : cometCount

    let w = 0
    let h = 0
    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const stars = Array.from({ length: total }, () => {
      const layer = Math.random() < 0.65 ? 1 : Math.random() < 0.9 ? 2 : 3 // depth layers
      return {
        x: Math.random(),
        y: Math.random(),
        layer,
        r: layer === 3 ? Math.random() * 1.2 + 0.8 : layer === 2 ? Math.random() * 0.8 + 0.5 : Math.random() * 0.5 + 0.3,
        base: layer === 3 ? Math.random() * 0.3 + 0.6 : layer === 2 ? Math.random() * 0.3 + 0.35 : Math.random() * 0.25 + 0.15,
        speed: Math.random() * 1.2 + 0.5,
        phase: Math.random() * 6.28,
      }
    })

    const comets = Array.from({ length: totalComets }, () => ({
      y: Math.random() * 0.5,
      x: Math.random() * 0.5,
      angle: ((15 + Math.random() * 25) * Math.PI) / 180,
      len: 140 + Math.random() * 110,
      dur: 4 + Math.random() * 4,
      delay: Math.random() * 22,
    }))

    // Cursor-driven parallax (desktop only)
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e) => {
      mouse.tx = (e.clientX / w - 0.5) * 2
      mouse.ty = (e.clientY / h - 0.5) * 2
    }
    if (!reduced && !coarse) window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('resize', resize)

    const depth = { 1: 6, 2: 14, 3: 26 }
    let raf = 0
    let last = 0
    const interval = mobile ? 1000 / 24 : 1000 / 40

    const draw = (now) => {
      raf = requestAnimationFrame(draw)
      if (now - last < interval) return
      last = now
      const t = now / 1000

      mouse.x += (mouse.tx - mouse.x) * 0.08
      mouse.y += (mouse.ty - mouse.y) * 0.08
      ctx.clearRect(0, 0, w, h)

      if (nebulaRef.current && !reduced && !coarse) {
        nebulaRef.current.style.transform = `translate3d(${mouse.x * -12}px, ${mouse.y * -12}px, 0)`
      }

      // Stars
      for (const s of stars) {
        const tw = reduced ? 1 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase))
        ctx.globalAlpha = s.base * tw
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(s.x * w + mouse.x * depth[s.layer], s.y * h + mouse.y * depth[s.layer], s.r, 0, 6.2832)
        ctx.fill()
      }

      // Comets
      if (!reduced) {
        for (const c of comets) {
          const p = ((t - c.delay) % (c.dur + 6)) / c.dur
          if (t < c.delay || p < 0 || p > 1) continue
          const dist = -160 + p * (w * 0.7 + 160)
          const fade = p < 0.08 ? p / 0.08 : p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1
          const hx = c.x * w + Math.cos(c.angle) * dist
          const hy = c.y * h + Math.sin(c.angle) * dist
          const tx = hx - Math.cos(c.angle) * c.len
          const ty = hy - Math.sin(c.angle) * c.len

          const g = ctx.createLinearGradient(tx, ty, hx, hy)
          g.addColorStop(0, 'rgba(255,255,255,0)')
          g.addColorStop(1, 'rgba(255,255,255,0.9)')

          ctx.globalAlpha = fade
          ctx.strokeStyle = g
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(tx, ty)
          ctx.lineTo(hx, hy)
          ctx.stroke()

          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(hx, hy, 1.6, 0, 6.2832)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }

    const onVis = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(draw)
    }
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
    }
  }, [count, cometCount])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      {/* Nebula glow layers */}
      <div
        ref={nebulaRef}
        className="absolute inset-[-10%] opacity-70"
        style={{
          background:
            'radial-gradient(45% 35% at 20% 25%, rgba(139,92,246,0.16), transparent 70%), radial-gradient(40% 30% at 80% 70%, rgba(220,38,38,0.14), transparent 70%), radial-gradient(35% 30% at 65% 15%, rgba(34,211,238,0.10), transparent 70%)',
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}

export default StarBackground