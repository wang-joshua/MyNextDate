import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2, Heart, Target, Zap } from 'lucide-react'
import { getAnalytics } from '../lib/api'

const DIMENSION_DISPLAY = {
  cost: { label: 'Budget', low: 'Affordable', high: 'Luxury', icon: '💰', color: 'from-green-400 to-emerald-500' },
  indoor_outdoor: { label: 'Setting', low: 'Indoor', high: 'Outdoor', icon: '🏠', color: 'from-blue-400 to-cyan-500' },
  energy: { label: 'Energy', low: 'Relaxed', high: 'Active', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
  social_density: { label: 'Social', low: 'Private', high: 'Social', icon: '👥', color: 'from-violet-400 to-purple-500' },
  time_of_day: { label: 'Time', low: 'Morning', high: 'Evening', icon: '🌅', color: 'from-amber-400 to-orange-500' },
  duration: { label: 'Length', low: 'Quick', high: 'Extended', icon: '⏱️', color: 'from-teal-400 to-cyan-500' },
  surprise: { label: 'Novelty', low: 'Familiar', high: 'Adventurous', icon: '🎲', color: 'from-rose-400 to-pink-500' },
  romance_intensity: { label: 'Romance', low: 'Casual', high: 'Intense', icon: '💕', color: 'from-pink-400 to-rose-500' },
  conversation_depth: { label: 'Convo', low: 'Activity-based', high: 'Deep talks', icon: '💬', color: 'from-indigo-400 to-blue-500' },
}

function StatCard({ value, label, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div
      className="bg-[#0f0d15] rounded-2xl p-5 text-center border border-[#2d2840]/50 hover:border-[#2d2840] transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -3, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
    >
      <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
      <motion.p
        className={`text-3xl font-bold ${color}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
      >
        {value}
      </motion.p>
      <p className="text-xs text-gray-500 mt-1.5 font-medium">{label}</p>
    </motion.div>
  )
}

function DimensionBar({ dimKey, value, delay = 0 }) {
  const display = DIMENSION_DISPLAY[dimKey]
  if (!display) return null

  const percentage = Math.round(value * 100)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500">{display.low}</span>
        <span className="text-gray-300 font-medium flex items-center gap-1">
          <span>{display.icon}</span>
          {display.label}
        </span>
        <span className="text-gray-500">{display.high}</span>
      </div>
      <div className="h-2.5 bg-[#0f0d15] rounded-full overflow-hidden relative">
        <motion.div
          className={`h-full bg-gradient-to-r ${display.color} rounded-full relative`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: delay + 0.1, duration: 0.8, ease: 'easeOut' }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>
        {/* Marker dot */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg border-2 border-[#0f0d15]"
          initial={{ left: '0%' }}
          animate={{ left: `calc(${percentage}% - 7px)` }}
          transition={{ delay: delay + 0.1, duration: 0.8, ease: 'easeOut' }}
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
          <Loader2 className="w-8 h-8 text-purple-500" />
        </motion.div>
        <p className="text-sm text-gray-500 mt-3">Crunching your dating data...</p>
      </div>
    )
  }

  if (!analytics || analytics.total_dates === 0) {
    return (
      <motion.div
        className="text-center py-16 text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
        </motion.div>
        <p className="text-lg font-medium text-gray-400">No analytics yet</p>
        <p className="text-sm mt-1">Add and rate some dates to see insights!</p>
      </motion.div>
    )
  }

  const TrendIcon = analytics.trend === 'improving' ? TrendingUp
    : analytics.trend === 'declining' ? TrendingDown : Minus

  const trendColor = analytics.trend === 'improving' ? 'text-green-400'
    : analytics.trend === 'declining' ? 'text-red-400' : 'text-gray-400'

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          value={analytics.avg_last_five}
          label="Avg Last 5"
          icon={Heart}
          color="text-pink-400"
          delay={0}
        />
        <StatCard
          value={`${analytics.success_rate}%`}
          label="Success Rate"
          icon={Target}
          color="text-purple-400"
          delay={0.1}
        />
        <StatCard
          value={analytics.trend === 'improving' ? 'Up' : analytics.trend === 'declining' ? 'Down' : 'Steady'}
          label="Trend"
          icon={Zap}
          color={trendColor}
          delay={0.2}
        />
      </div>

      {/* Preference Summary */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-5 border border-pink-500/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-sm text-gray-200 leading-relaxed relative">
          <span className="text-pink-400 font-semibold">Insight: </span>
          {analytics.preference_summary}
        </p>
      </motion.div>

      {/* Dimension Bars */}
      <div className="space-y-4">
        <motion.h4
          className="text-sm font-semibold text-gray-400 uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Your Preference Profile
        </motion.h4>
        {Object.entries(analytics.dimension_averages).map(([key, value], i) => (
          <DimensionBar key={key} dimKey={key} value={value} delay={0.4 + i * 0.06} />
        ))}
      </div>
    </div>
  )
}
