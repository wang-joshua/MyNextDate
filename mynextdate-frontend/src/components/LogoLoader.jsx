import { motion } from 'framer-motion'

// Nodes: position + scatter offset (direction from center (100,100) × 60)
const NODES = [
  { cx: 52,  cy: 28,  r: 8, sx: -33, sy: -50 },
  { cx: 100, cy: 48,  r: 8, sx: 0,   sy: -60 },
  { cx: 148, cy: 28,  r: 8, sx: 33,  sy: -50 },
  { cx: 18,  cy: 62,  r: 8, sx: -54, sy: -25 },
  { cx: 182, cy: 62,  r: 8, sx: 54,  sy: -25 },
  { cx: 48,  cy: 128, r: 8, sx: -53, sy: 28  },
  { cx: 152, cy: 128, r: 8, sx: 53,  sy: 28  },
  { cx: 100, cy: 178, r: 8, sx: 0,   sy: 60  },
  { cx: 70,  cy: 70,  r: 8, sx: -42, sy: -42 },
  { cx: 130, cy: 70,  r: 8, sx: 42,  sy: -42 },
  { cx: 100, cy: 100, r: 9, sx: 0,   sy: -35 },
]

// Keyframe times: [whole, shatter-out, scattered, reassembled, hold]
const T = { duration: 2.6, repeat: Infinity, times: [0, 0.2, 0.38, 0.72, 1], ease: 'easeInOut' }

export default function LogoLoader({ size = 96 }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Ambient glow pulse */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 1.7,
          height: size * 1.7,
          background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(109,44,142,0.08) 50%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="ll-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#f06060" />
            <stop offset="48%"  stopColor="#ef4444" />
            <stop offset="100%" stopColor="#d93b3b" />
          </linearGradient>
        </defs>

        {/* Heart — collapses to a point during shatter, expands back on join */}
        <motion.polygon
          points="52,28 18,62 48,128 100,178 152,128 182,62 148,28 100,48"
          fill="url(#ll-grad)"
          stroke="white"
          strokeWidth="4"
          strokeLinejoin="round"
          style={{ transformOrigin: '100px 100px' }}
          animate={{ scale: [0.1, 1, 1, 0.1, 0.1], opacity: [0, 1, 1, 0, 0] }}
          transition={T}
        />

        {/* Wires — fade out on shatter, fade back in on join */}
        <motion.g
          stroke="#9c8cd8" strokeWidth="3.5" strokeLinecap="round"
          animate={{ opacity: [0, 1, 1, 0, 0] }}
          transition={T}
        >
          <line x1="52"  y1="28"  x2="18"  y2="62"  />
          <line x1="18"  y1="62"  x2="48"  y2="128" />
          <line x1="48"  y1="128" x2="100" y2="178" />
          <line x1="100" y1="178" x2="152" y2="128" />
          <line x1="152" y1="128" x2="182" y2="62"  />
          <line x1="182" y1="62"  x2="148" y2="28"  />
          <line x1="148" y1="28"  x2="100" y2="48"  />
          <line x1="100" y1="48"  x2="52"  y2="28"  />
          <line x1="52"  y1="28"  x2="70"  y2="70"  />
          <line x1="100" y1="48"  x2="70"  y2="70"  />
          <line x1="100" y1="48"  x2="130" y2="70"  />
          <line x1="148" y1="28"  x2="130" y2="70"  />
          <line x1="18"  y1="62"  x2="70"  y2="70"  />
          <line x1="182" y1="62"  x2="130" y2="70"  />
          <line x1="70"  y1="70"  x2="130" y2="70"  />
          <line x1="70"  y1="70"  x2="100" y2="100" />
          <line x1="130" y1="70"  x2="100" y2="100" />
          <line x1="100" y1="48"  x2="100" y2="100" />
          <line x1="48"  y1="128" x2="100" y2="100" />
          <line x1="152" y1="128" x2="100" y2="100" />
          <line x1="100" y1="100" x2="100" y2="178" />
          <line x1="70"  y1="70"  x2="48"  y2="128" />
          <line x1="130" y1="70"  x2="152" y2="128" />
        </motion.g>

        {/* Nodes — fly outward then snap back */}
        {NODES.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.cx} cy={n.cy} r={n.r}
            fill="#9c8cd8"
            animate={{
              x: [n.sx, 0, 0, n.sx, n.sx],
              y: [n.sy, 0, 0, n.sy, n.sy],
            }}
            transition={T}
          />
        ))}
      </svg>
    </div>
  )
}
