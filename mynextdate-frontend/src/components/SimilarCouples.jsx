import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { getSimilarCouples } from '../lib/api'

export default function SimilarCouples() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCouples, setShowCouples] = useState(false)

  useEffect(() => {
    getSimilarCouples()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data || data.needs_more_dates) return null
  if (!data.they_love?.length && !data.similar_couples?.length) return null

  const avgMatch = data.similar_couples?.length
    ? Math.round(data.similar_couples.reduce((s, c) => s + c.match_score, 0) / data.similar_couples.length * 100)
    : null

  return (
    <motion.div
      className="glass-card rounded-2xl p-6 mt-3"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" style={{ color: '#c084fc' }} />
          <h3 className="label-editorial">Dates couples like you love</h3>
        </div>
      </div>

      {/* Subtitle — explains the feature */}
      <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6b5f7e' }}>
        Couples with similar preferences to you loved these — none of them are in your history yet.
      </p>

      {/* Activity bars — primary content */}
      {data.they_love?.length > 0 && (
        <div className="space-y-2.5 mb-4">
          {data.they_love.map((act, i) => (
            <motion.div
              key={act.activity_id}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.07 }}
            >
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-serif font-medium" style={{ color: '#f0ecf9' }}>
                    {act.activity_name}
                  </span>
                  <span className="text-xs font-mono" style={{ color: '#8b5cf6' }}>
                    {act.percentage}%
                  </span>
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(10, 8, 18, 0.8)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6d2c8e, #8b5cf6)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${act.percentage}%` }}
                    transition={{ delay: 0.8 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Expandable source — secondary, not the focus */}
      {data.similar_couples?.length > 0 && (
        <div>
          <motion.button
            onClick={() => setShowCouples((b) => !b)}
            className="flex items-center gap-1.5 text-xs"
            style={{ color: '#4a3f5c' }}
            whileHover={{ color: '#8b5cf6' }}
          >
            {showCouples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Based on {data.similar_couples.length} couples
            {avgMatch !== null && (
              <span className="font-mono ml-1" style={{ color: '#6b5f7e' }}>· {avgMatch}% avg match</span>
            )}
          </motion.button>

          <AnimatePresence>
            {showCouples && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 mt-3">
                  {data.similar_couples.map((couple, i) => (
                    <motion.div
                      key={couple.id}
                      className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full"
                      style={{
                        background: 'rgba(28, 23, 48, 0.9)',
                        border: '1px solid rgba(109, 44, 142, 0.2)',
                      }}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <span className="text-xs font-medium" style={{ color: '#f0ecf9' }}>
                        {couple.persona}
                      </span>
                      <span className="text-xs" style={{ color: '#4a3f5c' }}>·</span>
                      <span className="text-xs" style={{ color: '#6b5f7e' }}>{couple.city}</span>
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded-full ml-1"
                        style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}
                      >
                        {Math.round(couple.match_score * 100)}%
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
