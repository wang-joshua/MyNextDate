import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, HeartCrack, Loader2, Plus, Heart, X, ChevronDown } from 'lucide-react'
import { getRecommendations, getWorstRecommendations, addDate } from '../lib/api'

export default function RecommendButton({ onDateAdded, dateCount = 0, onAddDate }) {
  const [recs, setRecs] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(null)
  const [adding, setAdding] = useState(null)
  const [showPulse, setShowPulse] = useState(false)
  const [skippedIds, setSkippedIds] = useState([])
  const [needsHistory, setNeedsHistory] = useState(false)
  const SCROLL_EXIT_MS = 850

  const handleRecommend = async (breakup = false) => {
    if (dateCount === 0) {
      setNeedsHistory(true)
      return
    }
    setNeedsHistory(false)
    setLoading(true)
    setShowPulse(true)
    const newMode = breakup ? 'breakup' : 'good'

    // Hide existing recommendations immediately so the scroll hint disappears
    setRecs(null)
    // If switching recommendation type, wait briefly to let exit animations finish
    const isSwitchingTypes = mode && mode !== newMode && recs && recs.length > 0
    if (isSwitchingTypes) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    setMode(newMode)
    try {
      const currentSkipped = [...skippedIds]
      const data = breakup
        ? await getWorstRecommendations()
        : await getRecommendations(currentSkipped)

      // Wait for the scroll indicator to fully fade out before showing recs
      setTimeout(() => {
        setRecs(data.recommendations)
        // Reset skipped IDs after successful fetch — fresh batch, fresh skips
        setSkippedIds([])
        setLoading(false)
        setTimeout(() => setShowPulse(false), 600)
      }, SCROLL_EXIT_MS)
    } catch (err) {
      console.error(err)
      // On error, clear loading so UI can recover (scroll may reappear)
      setRecs(null)
      setLoading(false)
      setTimeout(() => setShowPulse(false), 600)
    }
  }

  const handleAddDate = async (activityId) => {
    setAdding(activityId)
    try {
      await addDate(activityId)
      // Remove the added date from recommendations
      setRecs((prev) => prev?.filter((r) => r.id !== activityId) || null)
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
    <div className="relative">
      <div className="relative">
        <AnimatePresence>
          {showPulse && (
            <motion.div
              className="absolute inset-0 rounded-2xl blur-xl"
              style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(109, 44, 142, 0.2))' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>

        <div className="flex gap-3 relative">
          <motion.button
            onClick={() => handleRecommend(false)}
            disabled={loading}
            className="flex-1 py-5 rounded-2xl font-bold text-lg text-white disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden tracking-wide"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d2c8e, #4c1d95)',
              backgroundSize: '200% 200%',
              boxShadow: '0 8px 30px rgba(139, 92, 246, 0.25)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 12px 50px rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            animate={!loading ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : {}}
            transition={!loading ? { backgroundPosition: { duration: 8, repeat: Infinity, ease: 'linear' } } : {}}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.15), transparent)' }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
            />
            {loading && mode === 'good' ? (
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Loader2 className="w-6 h-6" />
              </motion.span>
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
            <span className="relative">What's My Next Date?</span>
          </motion.button>

          <motion.button
            onClick={() => handleRecommend(true)}
            disabled={loading}
            title="Secret breakup button"
            className="px-5 py-5 rounded-2xl transition-all duration-300"
            style={{ background: 'rgba(17, 14, 26, 0.8)', border: '1px solid rgba(109, 44, 142, 0.15)', color: '#6b5f7e' }}
            whileHover={{ scale: 1.05, borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', background: 'rgba(127, 29, 29, 0.2)' }}
            whileTap={{ scale: 0.95 }}
          >
            {loading && mode === 'breakup' ? (
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Loader2 className="w-6 h-6" />
              </motion.span>
            ) : (
              <HeartCrack className="w-6 h-6" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Results float as overlay — no layout shift */}
      <div className="absolute left-0 right-0 z-10" style={{ top: 'calc(100% + 1rem)' }}>
        <AnimatePresence>
          {needsHistory && (
            <motion.div
              className="glass-card rounded-2xl p-5 text-center"
              style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-serif text-lg mb-2" style={{ color: '#f0ecf9' }}>
                We need to know you first!
              </p>
              <p className="text-sm mb-4" style={{ color: '#9a8fad' }}>
                Add at least one date — ideal or experienced — so we can learn your preferences and recommend the perfect next date.
              </p>
              <motion.button
                onClick={() => { setNeedsHistory(false); onAddDate?.() }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6d2c8e)',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)',
                }}
                whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(139, 92, 246, 0.35)' }}
                whileTap={{ scale: 0.97 }}
              >
                + Add Your First Date
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {recs && recs.length > 0 && (
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-full">
                <h3 className="label-editorial mb-3">
                  {mode === 'breakup' ? 'Worst Possible Dates' : 'Recommended For You'}
                </h3>
                <div className="flex gap-2">
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
                        className={`min-w-[380px] p-6 rounded-2xl transition-all duration-300 ${
                          mode === 'breakup'
                            ? 'bg-red-950/20 border border-red-500/20 hover:border-red-500/40'
                            : 'glass-card'
                        }`}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {mode === 'breakup' ? (
                                <HeartCrack className="w-4 h-4 text-red-400" />
                              ) : (
                                <Heart className="w-4 h-4 fill-violet-400" style={{ color: '#c084fc' }} />
                              )}
                              <h4 className="font-serif font-semibold text-lg">{rec.name}</h4>
                            </div>
                            <p className="text-sm mt-1 leading-relaxed" style={{ color: '#9a8fad' }}>{rec.description}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                mode === 'breakup' ? 'bg-red-500/10 text-red-400' : ''
                              }`}
                                style={mode !== 'breakup' ? { background: 'rgba(139, 92, 246, 0.1)', color: '#c084fc' } : {}}
                              >
                                {Math.round(rec.score * 100)}% match
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            {mode !== 'breakup' && (
                              <motion.button
                                onClick={() => handleAddDate(rec.id)}
                                disabled={adding === rec.id}
                                className="p-3 rounded-xl transition-all"
                                style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#c084fc' }}
                                whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)' }}
                                whileTap={{ scale: 0.9 }}
                                title="Add to date history"
                              >
                                {adding === rec.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                              </motion.button>
                            )}
                            <motion.button
                              onClick={() => handleSkip(rec.id)}
                              className="p-3 rounded-xl transition-all"
                              style={{ background: 'rgba(107, 95, 126, 0.1)', color: '#6b5f7e' }}
                              whileHover={{ scale: 1.1, color: '#f0ecf9', background: 'rgba(107, 95, 126, 0.2)' }}
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
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scroll indicator: only show when not loading and there are no recommendations */}
      <AnimatePresence>
        {(!loading && (!recs || recs.length === 0)) && (
          <motion.div
            className="flex items-center gap-2 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <span className="label-editorial" style={{ fontSize: '0.6rem' }}>Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-5 h-5" style={{ color: '#6b5f7e' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
