import { useState } from 'react'

export default function VideoCards() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <video
        src="/bg-video.mp4"
        autoPlay
        loop
        muted
        playsInline
        onCanPlay={() => setLoaded(true)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'saturate(0.5) brightness(0.65)',
          transform: 'scale(1.05)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 2s ease-out',
        }}
      />

      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 8, 18, 0.35)',
        }}
      />

      {/* Purple tint */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(135deg, rgba(109, 44, 142, 0.3), transparent 50%, rgba(139, 92, 246, 0.2))',
        }}
      />

      {/* Bottom fade */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(to top, rgba(10, 8, 18, 0.95) 0%, transparent 40%)',
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(10, 8, 18, 0.6) 100%)',
        }}
      />
    </div>
  )
}
