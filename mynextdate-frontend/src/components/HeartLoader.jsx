import { useId } from 'react'
import { motion } from 'framer-motion'

const HEART_PATH =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'

/**
 * HeartLoader
 *
 * loop=true  (default) — fill then reverse, repeating forever.
 *            Used for the analytics refresh overlay (indeterminate wait).
 *
 * loop=false — fill exactly ONCE over `durationMs` milliseconds, then stop.
 *              Used for the splash screen where we know the exact wait time.
 *
 * durationMs — how long ONE fill sweep takes (default 1800 ms).
 */
export default function HeartLoader({ size = 72, durationMs = 1800, loop = true }) {
  const uid = useId()
  const gradId = `hg-${uid}`
  const clipId = `hc-${uid}`

  const fillTransition = loop
    ? {
        duration: durationMs / 1000,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: [0.45, 0, 0.55, 1],
        repeatDelay: 0.4,
      }
    : {
        duration: durationMs / 1000,
        ease: [0.4, 0, 0.2, 1],
      }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="0"
          y1="1"
          x2="0"
          y2="0"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="65%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>
        <clipPath id={clipId}>
          <motion.rect
            x="0"
            width="24"
            initial={{ y: 24, height: 0 }}
            animate={{ y: 0, height: 24 }}
            transition={fillTransition}
          />
        </clipPath>
      </defs>

      {/* Ambient glow */}
      <path
        d={HEART_PATH}
        fill="rgba(239,68,68,0.15)"
        style={{ filter: 'blur(8px)' }}
      />

      {/* Outline */}
      <path
        d={HEART_PATH}
        fill="none"
        stroke="rgba(248,113,113,0.3)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Animated fill — revealed bottom-to-top */}
      <path
        d={HEART_PATH}
        fill={`url(#${gradId})`}
        clipPath={`url(#${clipId})`}
        style={{ filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.55))' }}
      />
    </svg>
  )
}