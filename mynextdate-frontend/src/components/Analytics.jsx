import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Heart } from 'lucide-react'
import { getAnalytics } from '../lib/api'
import HeartLoader from './HeartLoader'

const DIMENSION_DISPLAY = {
  cost: { label: 'Budget', low: 'Affordable', high: 'Luxury', color: 'from-emerald-400 to-teal-500' },
  indoor_outdoor: { label: 'Setting', low: 'Indoor', high: 'Outdoor', color: 'from-sky-400 to-blue-500' },
  energy: { label: 'Energy', low: 'Relaxed', high: 'Active', color: 'from-amber-400 to-orange-400' },
  social_density: { label: 'Social', low: 'Private', high: 'Social', color: 'from-violet-400 to-purple-500' },
  time_of_day: { label: 'Time', low: 'Morning', high: 'Evening', color: 'from-fuchsia-400 to-violet-500' },
  duration: { label: 'Length', low: 'Quick', high: 'Extended', color: 'from-cyan-400 to-teal-500' },
  surprise: { label: 'Novelty', low: 'Familiar', high: 'Adventurous', color: 'from-rose-400 to-pink-500' },
  romance_intensity: { label: 'Romance', low: 'Casual', high: 'Intense', color: 'from-pink-400 to-violet-500' },
  conversation_depth: { label: 'Conversation', low: 'Activity-based', high: 'Deep talks', color: 'from-indigo-400 to-violet-500' },
}

function StatCard({ value, label, icon: Icon, color, delay = 0, showHearts = false }) {
  return (
    <motion.div
      className="glass-card rounded-2xl p-4 text-center"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -3,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
      }}
    >
      {showHearts ? (
        <>
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((heartIndex) => {
              const fillAmount = value >= heartIndex ? 1 : value >= heartIndex - 0.5 ? (value % 1) : 0

              return (
                <div key={heartIndex} className="relative" style={{ width: 18, height: 18 }}>
                  <Heart
                    size={18}
                    className="absolute inset-0"
                    style={{ color: '#6b5f7e' }}
                  />

                  {fillAmount > 0 && (
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: 18 * fillAmount }}
                    >
                      <Heart
                        size={18}
                        className="drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                        style={{ fill: '#ef4444', color: '#f87171' }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <motion.p
            className="font-serif text-3xl font-bold"
            style={{ color: '#c084fc' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
          >
            {value.toFixed(1)}
          </motion.p>
        </>
      ) : (
        <>
          <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color }} />
          <motion.p
            className="font-serif text-3xl font-bold"
            style={{ color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
          >
            {value}
          </motion.p>
        </>
      )}
      <p className="label-editorial mt-1.5">{label}</p>
    </motion.div>
  )
}

function DimensionBar({ dimension, value, delay = 0 }) {
  const display = DIMENSION_DISPLAY[dimension]
  if (!display) return null
  const percentage = Math.round(value * 100)

  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="grid grid-cols-3 text-xs">
        <span style={{ color: '#6b5f7e' }}>{display.low}</span>
        <span className="font-serif font-medium text-center" style={{ color: '#f0ecf9' }}>{display.label}</span>
        <span className="text-right" style={{ color: '#6b5f7e' }}>{display.high}</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden relative"
        style={{ background: 'rgba(10, 8, 18, 0.8)', border: '1px solid rgba(109, 44, 142, 0.08)' }}
      >
        <motion.div
          className={`h-full bg-gradient-to-r ${display.color} rounded-full relative`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: delay + 0.1, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full"
          style={{ boxShadow: '0 0 8px rgba(139, 92, 246, 0.4), 0 0 3px white' }}
          initial={{ left: '0%' }}
          animate={{ left: `calc(${percentage}% - 5px)` }}
          transition={{ delay: delay + 0.1, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  )
}

function GaugeCard({ successRate, totalDates, trend, delay = 0 }) {
  const successCount = Math.round(successRate * totalDates / 100)
  const fillRatio = successRate / 100

  // Arc geometry — semi-circle open at bottom
  const size = 140
  const cx = size / 2
  const cy = size / 2 + 4
  const r = 52
  const strokeWidth = 14
  // Arc spans from 220° to 320° (horseshoe open at bottom)
  const startAngle = 220
  const endAngle = -40 // equivalent to 320°
  const totalSweep = 260 // degrees of arc

  const toRad = (deg) => (deg * Math.PI) / 180
  const pointOnArc = (angle) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy - r * Math.sin(toRad(angle)),
  })

  const start = pointOnArc(startAngle)
  const end = pointOnArc(endAngle)
  const bgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`

  const trendLabel = trend === 'improving' ? 'RISING' : trend === 'declining' ? 'FALLING' : 'STABLE'
  const trendColor = trend === 'improving' ? '#4ade80' : trend === 'declining' ? '#f87171' : '#c084fc'
  const trendBg = trend === 'improving' ? 'rgba(74,222,128,0.15)' : trend === 'declining' ? 'rgba(248,113,113,0.15)' : 'rgba(192,132,252,0.15)'

  const gradientId = 'gaugeGradient'

  return (
    <motion.div
      className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center relative"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -3,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
      }}
    >
      <div className="relative" style={{ width: size, height: size * 0.75 }}>
        <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`} className="overflow-visible">
          {/* Red track (remaining / full 100%) */}
          <path
            d={bgPath}
            fill="none"
            stroke="#f87171"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={1}
          />
          {/* Green fill (accomplished portion) */}
          <motion.path
            d={bgPath}
            fill="none"
            stroke="#4ade80"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: fillRatio }}
            transition={{ delay: delay + 0.3, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(74,222,128,0.4))' }}
          />
        </svg>

        {/* Center text overlay — positioned at arc center */}
        <div className="absolute flex flex-col items-center justify-center" style={{ top: 0, left: 0, right: 0, height: cy * 2, paddingTop: 8 }}>
          <motion.span
            className="font-serif font-bold leading-none"
            style={{ fontSize: 28, color: '#f0ecf9' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.5, type: 'spring', stiffness: 200 }}
          >
            {successRate}%
          </motion.span>
          <span className="text-[11px] mt-1" style={{ color: '#6b5f7e' }}>
            {successCount} / {totalDates}
          </span>
        </div>
      </div>

      <p className="label-editorial mt-3">Success Rate</p>
    </motion.div>
  )
}

export default function Analytics({ refreshTrigger }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const dataPromise = getAnalytics().catch((err) => {
      console.error(err)
      return null
    })
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1000))

    Promise.all([dataPromise, minDelay]).then(([data]) => {
      if (cancelled) return
      if (data !== null) setAnalytics(data)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [refreshTrigger])

  // Initial load — no data yet, show full loading state
  if (loading && analytics === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <HeartLoader size={48} />
        <p className="text-sm mt-3 font-serif italic" style={{ color: '#6b5f7e' }}>
          Analyzing your patterns...
        </p>
      </div>
    )
  }

  if (!analytics || analytics.total_dates === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Heart className="w-11 h-11 mb-2" style={{ color: '#6b5f7e' }} />
        <p className="text-sm mt-1 font-serif italic" style={{ color: '#6b5f7e' }}>
          Rate some dates to unlock insights
        </p>
      </div>
    )
  }

  const TrendIcon = analytics.trend === 'improving' ? TrendingUp
    : analytics.trend === 'declining' ? TrendingDown : Minus

  return (
    <div className="relative">
      {/* Refresh overlay — shown when reloading with existing data so panel keeps its size */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl gap-3"
            style={{
              background: 'rgba(10, 8, 18, 0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <HeartLoader size={44} />
            <p className="text-xs font-serif italic" style={{ color: '#9a8fad' }}>Updating...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="space-y-5 pb-1"
        style={{ opacity: loading ? 0.45 : 1, transition: 'opacity 0.3s ease' }}
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            value={analytics.avg_last_five}
            label="Average Score"
            color="#c084fc"
            delay={0}
            showHearts={true}
          />
          <GaugeCard
            successRate={analytics.success_rate}
            totalDates={analytics.total_dates}
            trend={analytics.trend}
            delay={0.1}
          />
          <StatCard
            value={analytics.trend === 'improving' ? 'Rising' : analytics.trend === 'declining' ? 'Falling' : 'Steady'}
            label="Trend"
            icon={TrendIcon}
            color={analytics.trend === 'improving' ? '#4ade80' : analytics.trend === 'declining' ? '#f87171' : '#c084fc'}
            delay={0.2}
          />
        </div>

        {/* Insight Card */}
        {analytics.preference_summary && (
          <motion.div
            className="relative overflow-hidden rounded-2xl p-4 glass-card"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(109, 44, 142, 0.06))',
              border: '1px solid rgba(139, 92, 246, 0.15)',
            }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.05), transparent)' }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-sm leading-relaxed relative" style={{ color: '#f0ecf9' }}>
              <span className="font-serif font-semibold" style={{ color: '#c084fc' }}>Insight: </span>
              {analytics.preference_summary}
            </p>
          </motion.div>
        )}

        {/* Dimension Bars */}
        {analytics.dimension_averages && (
          <div className="space-y-3">
            <h4 className="label-editorial">Your Preference Profile</h4>
            {Object.entries(analytics.dimension_averages).map(([dim, val], i) => (
              <DimensionBar
                key={dim}
                dimension={dim}
                value={val}
                delay={0.4 + i * 0.06}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
