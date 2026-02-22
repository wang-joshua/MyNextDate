import { useState } from 'react'

// Media items: video, picture, video, picture, picture
const mediaItems = [
  { type: 'video', src: '/bg-video.mp4' },
  { type: 'image', src: '/panel-pic-1.jpg' },
  { type: 'video', src: '/bg-video-2.mp4' },
  { type: 'image', src: '/panel-pic-2.jpg' },
  { type: 'image', src: '/panel-pic-3.jpg' },
]

function MediaItem({ item }) {
  const [loaded, setLoaded] = useState(false)

  if (item.type === 'video') {
    return (
      <video
        src={item.src}
        autoPlay
        loop
        muted
        playsInline
        onCanPlay={() => setLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 1s ease-out',
        }}
      />
    )
  }

  return (
    <img
      src={item.src}
      alt=""
      onLoad={() => setLoaded(true)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 1s ease-out',
      }}
    />
  )
}

/**
 * Single vertical scrolling strip — camera roll style.
 * For fullscreen mode (AuthPage): uses vh units.
 * For inline mode (Dashboard): uses px units.
 */
function CameraRoll({ speed, itemHeight, unit }) {
  const items = [...mediaItems, ...mediaItems]
  const totalHeight = mediaItems.length * itemHeight

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          animation: `cameraRollScroll ${speed}s linear infinite`,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              width: '100%',
              height: `${itemHeight}${unit}`,
              padding: '6px 0',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(10, 8, 18, 0.3)',
              }}
            >
              <MediaItem item={item} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes cameraRollScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-${totalHeight}${unit}); }
        }
      `}</style>
    </div>
  )
}

/**
 * @param {'fullscreen' | 'inline'} mode
 */
export default function VideoCards({ mode = 'fullscreen' }) {
  const isInline = mode === 'inline'
  const itemHeight = isInline ? 380 : 50
  const unit = isInline ? 'px' : 'vh'
  const speed = isInline ? 20 : 30

  const containerStyle = isInline
    ? {
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '24px',
      }
    : {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }

  return (
    <div style={containerStyle}>
      <CameraRoll speed={speed} itemHeight={itemHeight} unit={unit} />

      {/* Subtle overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isInline
            ? 'rgba(10, 8, 18, 0.1)'
            : 'rgba(10, 8, 18, 0.55)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(109, 44, 142, 0.25), transparent 50%, rgba(139, 92, 246, 0.15))',
          pointerEvents: 'none',
        }}
      />

      {!isInline && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(10, 8, 18, 0.95) 0%, transparent 40%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, rgba(10, 8, 18, 0.7) 0%, transparent 25%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at center, transparent 30%, rgba(10, 8, 18, 0.6) 100%)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {isInline && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(10, 8, 18, 0.7) 0%, transparent 15%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, rgba(10, 8, 18, 0.7) 0%, transparent 15%)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  )
}
