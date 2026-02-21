import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, HeartCrack, Loader2, Plus, Heart, X } from 'lucide-react'
import { getRecommendations, getWorstRecommendations, addDate } from '../lib/api'

export default function RecommendButton({ onDateAdded }) {
  const [recs, setRecs] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(null)
  const [adding, setAdding] = useState(null)
  const [showPulse, setShowPulse] = useState(false)
  const [skippedIds, setSkippedIds] = useState([])

  const handleRecommend = async (breakup = false) => {
    setLoading(true)
    setShowPulse(true)
    setMode(breakup ? 'breakup' : 'good')
    setRecs(null)
    try {
      const data = breakup
        ? await getWorstRecommendations()
        : await getRecommendations(skippedIds)
      setRecs(data.recommendations)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
    setTimeout(() => setShowPulse(false), 500)
  }

  const handleAddDate = async (activityId) => {
    setAdding(activityId)
    try {
      await addDate(activityId)
      onDateAdded?.()
    } catch (err) {
      console.error(err)
    }
    setAdding(null)
  }

  const handleSkip = (activityId) => {
    setSkippedIds((prev) => [...prev, activityId])
    setRecs((prev) => prev?.filter((r) => r.id !== activityId) || null)
  }

  return (
    <div className="space-y-6">
      {/* Main Recommend Section */}
      <div className="relative">
        {/* Glow effect behind button */}
        <AnimatePresence>
          {showPulse && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl blur-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>

        <div className="flex gap-3 relative">
          <motion.button
            onClick={() => handleRecommend(false)}
            disabled={loading}
            className="flex-1 py-5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 rounded-2xl font-bold text-lg text-white disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-pink-500/20 relative overflow-hidden"
            whileHover={{ scale: 1.02, boxShadow: '0 20px 50px rgba(236, 72, 153, 0.35)' }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
            {loading && mode === 'good' ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-6 h-6" />
              </motion.span>
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
            <span className="relative">What's My Next Date?</span>
          </motion.button>

          {/* Secret Breakup Button */}
          <motion.button
            onClick={() => handleRecommend(true)}
            disabled={loading}
            title="Secret breakup button"
            className="px-5 py-5 bg-[#1a1725] border border-[#2d2840] rounded-2xl text-gray-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-950/20 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading && mode === 'breakup' ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-6 h-6" />
              </motion.span>
            ) : (
              <HeartCrack className="w-6 h-6" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {recs && recs.length > 0 && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <motion.h3
              className="text-sm font-medium text-gray-400 uppercase tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {mode === 'breakup' ? 'Worst Possible Dates' : 'Recommended For You'}
            </motion.h3>
            <AnimatePresence>
              {recs.map((rec, i) => (
                <motion.div
                  key={rec.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                  transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 300, damping: 25 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className={`p-6 rounded-2xl border transition-all duration-300 ${
                    mode === 'breakup'
                      ? 'bg-red-950/20 border-red-500/20 hover:border-red-500/40'
                      : 'bg-[#1a1725] border-[#2d2840] hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {mode === 'breakup' ? (
                          <HeartCrack className="w-4 h-4 text-red-400" />
                        ) : (
                          <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                        )}
                        <h4 className="font-semibold text-lg">{rec.name}</h4>
                      </div>
                      <p className="text-gray-400 text-sm mt-1 leading-relaxed">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          mode === 'breakup'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-pink-500/10 text-pink-400'
                        }`}>
                          {Math.round(rec.score * 100)}% match
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {mode !== 'breakup' && (
                        <motion.button
                          onClick={() => handleAddDate(rec.id)}
                          disabled={adding === rec.id}
                          className="p-3 bg-pink-500/10 rounded-xl text-pink-400 hover:bg-pink-500/20 transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Add to date history"
                        >
                          {adding === rec.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => handleSkip(rec.id)}
                        className="p-3 bg-gray-500/10 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-gray-500/20 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Skip — show me something else"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
