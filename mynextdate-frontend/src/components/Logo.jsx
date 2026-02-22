import { useId } from 'react'

export default function Logo({ className = "w-10 h-10" }) {
  const uid = useId().replace(/:/g, '')

  const nodes = [
    { cx: 52, cy: 28 },
    { cx: 100, cy: 48 },
    { cx: 148, cy: 28 },
    { cx: 18, cy: 62 },
    { cx: 182, cy: 62 },
    { cx: 48, cy: 128 },
    { cx: 152, cy: 128 },
    { cx: 100, cy: 178 },
    { cx: 70, cy: 70 },
    { cx: 130, cy: 70 },
    { cx: 100, cy: 100, r: 9 },
  ]

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`hf-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f06060" />
          <stop offset="48%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#d93b3b" />
        </linearGradient>
        <radialGradient id={`tg-${uid}`}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="30%" stopColor="#e8deff" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#c4b5f0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#9c8cd8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <style>{`
        @keyframes sparkle-${uid} {
          0%, 100% { opacity: 0; transform: scale(0); }
          8% { opacity: 1; transform: scale(1.3); }
          22% { opacity: 0.9; transform: scale(1.0); }
          40% { opacity: 0; transform: scale(0); }
        }
      `}</style>

      {/* Geometric heart polygon */}
      <polygon
        points="52,28 18,62 48,128 100,178 152,128 182,62 148,28 100,48"
        fill={`url(#hf-${uid})`}
        stroke="white"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Network edges */}
      <g stroke="#9c8cd8" strokeWidth="3.5" strokeLinecap="round">
        <line x1="52" y1="28" x2="18" y2="62" />
        <line x1="18" y1="62" x2="48" y2="128" />
        <line x1="48" y1="128" x2="100" y2="178" />
        <line x1="100" y1="178" x2="152" y2="128" />
        <line x1="152" y1="128" x2="182" y2="62" />
        <line x1="182" y1="62" x2="148" y2="28" />
        <line x1="148" y1="28" x2="100" y2="48" />
        <line x1="100" y1="48" x2="52" y2="28" />
        <line x1="52" y1="28" x2="70" y2="70" />
        <line x1="100" y1="48" x2="70" y2="70" />
        <line x1="100" y1="48" x2="130" y2="70" />
        <line x1="148" y1="28" x2="130" y2="70" />
        <line x1="18" y1="62" x2="70" y2="70" />
        <line x1="182" y1="62" x2="130" y2="70" />
        <line x1="70" y1="70" x2="130" y2="70" />
        <line x1="70" y1="70" x2="100" y2="100" />
        <line x1="130" y1="70" x2="100" y2="100" />
        <line x1="100" y1="48" x2="100" y2="100" />
        <line x1="48" y1="128" x2="100" y2="100" />
        <line x1="152" y1="128" x2="100" y2="100" />
        <line x1="100" y1="100" x2="100" y2="178" />
        <line x1="70" y1="70" x2="48" y2="128" />
        <line x1="130" y1="70" x2="152" y2="128" />
      </g>

      {/* Network nodes (base) */}
      <g fill="#9c8cd8">
        {nodes.map((n, i) => (
          <circle key={i} cx={n.cx} cy={n.cy} r={n.r || 8} />
        ))}
      </g>

      {/* Sparkle glow on each node */}
      {nodes.map((n, i) => {
        const duration = 4 + (i % 4) * 1.2
        const delay = ((i * 7 + 3) % 11) * 0.8
        return (
          <circle
            key={`sparkle-${i}`}
            cx={n.cx}
            cy={n.cy}
            r="18"
            fill={`url(#tg-${uid})`}
            style={{
              transformOrigin: `${n.cx}px ${n.cy}px`,
              animation: `sparkle-${uid} ${duration}s ease-in-out ${delay}s infinite`,
              opacity: 0,
            }}
          />
        )
      })}
    </svg>
  );
}
