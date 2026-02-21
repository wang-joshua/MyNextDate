import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Loader2, Heart, Target, Zap } from 'lucide-react'
import { getAnalytics } from '../lib/api'

const DIMENSION_DISPLAY = {
  cost: { label: 'Budget', low: 'Affordable', high: 'Luxury', color: 'from-emerald-400 to-teal-500' },
  indoor_outdoor: { label: 'Setting', low: 'Indoor', high: 'Outdoor', color: 'from-sky-400 to-blue-500' },
  energy: { label: 'Energy', low: 'Relaxed', high: 'Active', color: 'from-amber-400 to-orange-400' },
  social_density: { label: 'Social', low: 'Private', high: 'Social', color: 'from-violet-400 to-purple-500' },
  time_of_day: { label: 'Time', low: 'Morning', high: 'Evening', color: 'from-fuchsia-400 to-violet-500' },
  duration: { label: 'Length', low: 'Quick', high: 'Extended', color: 'from-cyan-400 to-teal-500' },
  surprise: { label: 'Novelty', low: 'Familiar', high: 'Adventurous', color: 'from-rose-400 to-pink-500' },
  romance_intensity: { label: 'Romance', low: 'Casual', high: 'Intense', color: 'from-pink-400 to-violet-500' },
  conversation_depth: { label: 'Convo', low: 'Activity-based', high: 'Deep talks', color: 'from-indigo-400 to-violet-500' },
}

function StatCard({ value, label, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div
      className="glass-card rounded-2xl p-5 text-center"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -4,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
      }}
    >
      <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
      <motion.p
        className="font-serif text-4xl font-bold"
        style={{ color }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
      >
        {value}
      </motion.p>
      <p className="label-editorial mt-2">{label}</p>
    </motion.div>
  )
}

function DimensionBar({ dimension, value, delay = 0 }) {
  const display = DIMENSION_DISPLAY[dimension]
  if (!display) return null
  const percentage = Math.round(value * 100)

  return (
    <motion.div
      className="space-y-1.5"
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex justify-between text-xs">
        <span style={{ color: '#6b5f7e' }}>{display.low}</span>
        <span className="font-serif font-medium" style={{ color: '#f0ecf9' }}>{display.label}</span>
        <span style={{ color: '#6b5f7e' }}>{display.high}</span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden relative"
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
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"
          style={{ boxShadow: '0 0 10px rgba(139, 92, 246, 0.4), 0 0 4px white' }}
          initial={{ left: '0%' }}
          animate={{ left: `calc(${percentage}% - 6px)` }}
          transition={{ delay: delay + 0.1, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  )
}

export default function Analytics({ refreshTrigger }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getAnalytics()
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8" style={{ color: '#8b5cf6' }} />
        </motion.div>
        <p className="text-sm mt-3 font-serif italic" style={{ color: '#6b5f7e' }}>
          Analyzing your patterns...
        </p>
      </div>
    )
  }

  if (!analytics || analytics.total_dates === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Target className="w-10 h-10 mb-3 opacity-30" style={{ color: '#6b5f7e' }} />
        <p className="heading-section text-lg" style={{ color: '#9a8fad' }}>No analytics yet</p>
        <p className="text-sm mt-1 font-serif italic" style={{ color: '#6b5f7e' }}>
          Rate some dates to unlock insights
        </p>
      </div>
    )
  }

  const TrendIcon = analytics.trend === 'improving' ? TrendingUp
    : analytics.trend === 'declining' ? TrendingDown : Minus

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          value={analytics.avg_last_five}
          label="Avg Last 5"
          icon={Heart}
          color="#c084fc"
          delay={0}
        />
        <StatCard
          value={`${analytics.success_rate}%`}
          label="Success Rate"
          icon={Target}
          color="#8b5cf6"
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
          className="relative overflow-hidden rounded-2xl p-5 glass-card"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(109, 44, 142, 0.06))',
            border: '1px solid rgba(139, 92, 246, 0.15)',
          }}
          initial={{ opacity: 0, y: 20 }}
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
        <div className="space-y-4">
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
  )
}
