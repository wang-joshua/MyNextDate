import { useState } from 'react'
import { motion } from 'framer-motion'

const VIDEO_SOURCES = [
  {
    url: 'https://videos.pexels.com/video-files/3209828/3209828-sd_640_360_25fps.mp4',
    poster: '',
    alt: 'Couple walking',
  },
  {
    url: 'https://videos.pexels.com/video-files/3571264/3571264-sd_640_360_30fps.mp4',
    poster: '',
    alt: 'Candlelight ambiance',
  },
  {
    url: 'https://videos.pexels.com/video-files/856973/856973-sd_640_360_25fps.mp4',
    poster: '',
    alt: 'Romantic ambiance',
  },
  {
    url: 'https://videos.pexels.com/video-files/2795173/2795173-sd_640_360_25fps.mp4',
    poster: '',
    alt: 'Sunset romantic',
  },
]

const CARD_CONFIGS = [
  { top: '4%', left: '6%', rotate: -6, width: 220, height: 300, delay: 0, drift: 12 },
  { top: '15%', right: '5%', rotate: 4, width: 200, height: 270, delay: 1.5, drift: -10 },
  { bottom: '18%', left: '8%', rotate: 5, width: 190, height: 260, delay: 3, drift: 8 },
  { bottom: '8%', right: '7%', rotate: -4, width: 210, height: 280, delay: 2, drift: -14 },
]

function VideoCard({ src, config, index }) {
  const [loaded, setLoaded] = useState(false)
  const { top, left, right, bottom, rotate, width, height, delay, drift } = config

  const positionStyle = {}
  if (top !== undefined) positionStyle.top = top
  if (left !== undefined) positionStyle.left = left
  if (right !== undefined) positionStyle.right = right
  if (bottom !== undefined) positionStyle.bottom = bottom

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        ...positionStyle,
        width,
        height,
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.08)',
      }}
      initial={{ opacity: 0, scale: 0.8, rotate: rotate * 2 }}
      animate={{
        opacity: loaded ? 0.45 : 0,
        scale: 1,
        rotate,
        y: [0, drift, 0],
      }}
      transition={{
        opacity: { delay: delay + 0.3, duration: 1.2 },
        scale: { delay, duration: 1.5, ease: [0.22, 1, 0.36, 1] },
        rotate: { delay, duration: 1.5, ease: [0.22, 1, 0.36, 1] },
        y: { delay: delay + 1, duration: 6 + index * 0.8, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      {/* Violet tint overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(109, 44, 142, 0.5), rgba(139, 92, 246, 0.35))',
          mixBlendMode: 'multiply',
        }}
      />
      {/* Top/bottom fade */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(to bottom, rgba(10, 8, 18, 0.4) 0%, transparent 30%, transparent 70%, rgba(10, 8, 18, 0.5) 100%)',
        }}
      />
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setLoaded(true)}
        className="w-full h-full object-cover"
        style={{ filter: 'saturate(0.6) brightness(0.7)' }}
      />
    </motion.div>
  )
}

export default function VideoCards() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {VIDEO_SOURCES.map((video, i) => (
        <VideoCard
          key={i}
          src={video.url}
          config={CARD_CONFIGS[i]}
          index={i}
        />
      ))}
    </div>
  )
}
