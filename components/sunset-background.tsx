'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'

const DEFAULT_GRADIENT =
  'linear-gradient(180deg, #0f0a1a 0%, #3d1e3d 35%, #b85b1a 70%, #f4a261 100%)'

interface SunsetBackgroundProps {
  backgroundType?: string
  backgroundGradient?: string
  backgroundImageUrl?: string
  showParticles?: boolean
}

export function SunsetBackground({
  backgroundType = 'gradient',
  backgroundGradient,
  backgroundImageUrl = '',
  showParticles = true,
}: SunsetBackgroundProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let ticking = false
    const update = () => {
      if (!ref.current) {
        ticking = false
        return
      }
      const y = window.scrollY
      // Fade from opacity 1 at scrollY=0 to opacity 0 at scrollY=600
      const opacity = Math.max(0, 1 - y / 600)
      ref.current.style.opacity = String(opacity)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const useImage = backgroundType === 'image' && !!backgroundImageUrl
  const gradient = backgroundGradient || DEFAULT_GRADIENT

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        willChange: 'opacity',
      }}
    >
      {/* Base layer */}
      {useImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={backgroundImageUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          draggable={false}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: gradient,
          }}
        />
      )}

      {/* Dark vignette at bottom so the sunset dissolves into #09090b */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, transparent 50%, rgba(9,9,11,0.6) 80%, #09090b 100%)',
        }}
      />

      {showParticles && <Embers />}
    </div>
  )
}

/* Golden embers floating upward */
function Embers() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  const particles = useMemo(() => {
    const palette = ['#f4a261', '#ffb86b', '#ffd27a', '#ff8a3d']
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 2,
      duration: 12 + Math.random() * 14,
      delay: Math.random() * 10,
      drift: (Math.random() - 0.5) * 40,
      color:
        Math.random() > 0.88
          ? '#00e5ff'
          : palette[Math.floor(Math.random() * palette.length)],
    }))
  }, [])

  if (!ready) return null

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: -10,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          initial={{ y: 0, x: 0, opacity: 0 }}
          animate={{
            y: [0, -800],
            x: [0, p.drift, -p.drift, 0],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}
