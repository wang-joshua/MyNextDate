import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, HeartCrack, Loader2, Plus, Heart, X, ChevronDown, MapPin, Globe, RefreshCw } from 'lucide-react'
import { getRecommendations, getWorstRecommendations, addDate, getLocalTrends } from '../lib/api'
import SimilarCouples from './SimilarCouples'

export default function RecommendButton({ onDateAdded, dateCount = 0, onAddDate, onSearch, onExploreCities }) {
  const [recs, setRecs] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(null)
  const [adding, setAdding] = useState(null)
  const [chosenId, setChosenId] = useState(null)
  const [showPulse, setShowPulse] = useState(false)
  const [skippedIds, setSkippedIds] = useState([])
  const [needsHistory, setNeedsHistory] = useState(false)
  const [localTrends, setLocalTrends] = useState(null)
  const SCROLL_EXIT_MS = 850

  const handleRecommend = async (breakup = false, extraSkips = []) => {
    if (dateCount === 0) {
      setNeedsHistory(true)
      return
    }
    setNeedsHistory(false)
    setLoading(true)
    setShowPulse(true)
    const newMode = breakup ? 'breakup' : 'good'

    // Collapse the hero layout before fetching
    onSearch?.(true)

    // Hide existing recommendations immediately so the scroll hint disappears
    setRecs(null)
    // If switching recommendation type, wait briefly to let exit animations finish
    const isSwitchingTypes = mode && mode !== newMode && recs && recs.length > 0
    if (isSwitchingTypes) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    setMode(newMode)
    try {
      const currentSkipped = [...skippedIds, ...extraSkips]
      const [data, trendsData] = await Promise.all([
        breakup ? getWorstRecommendations() : getRecommendations(currentSkipped),
        getLocalTrends().catch(() => null),
      ])

      if (trendsData) {
        setLocalTrends(trendsData)
        // Cache the user's city for ExploreCities default selection
        if (trendsData.city) {
          localStorage.setItem('userCity', trendsData.city)
        }
      }

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
    setChosenId(activityId)
    setAdding(activityId)
    try {
      await addDate(activityId)
      // Vanish all remaining cards — clean slate after a choice is made
      setRecs(null)
      setChosenId(null)
      onDateAdded?.()
      // Wait for the exit animation to finish before scrolling to history
      setTimeout(() => document.getElementById('section-history')?.scrollIntoView({ behavior: 'smooth' }), 500)
    } catch (err) {
      console.error(err)
      setChosenId(null)
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

      {/* Results flow in-document below the button */}
      <div className="mt-4">
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
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-full">
                <h3 className="label-editorial mb-3">
                  {mode === 'breakup' ? 'Worst Possible Dates' : 'Recommended For You'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <AnimatePresence>
                    {recs.map((rec, i) => (
                      <motion.div
                        key={rec.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={
                          chosenId === rec.id
                            ? { opacity: 0, scale: 1.04, y: -12 }
                            : { opacity: 0, scale: 0.88, y: 8 }
                        }
                        transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                        whileHover={{ scale: 1.01, y: -2 }}
                        className={`p-6 rounded-2xl transition-all duration-300 ${
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

              {/* Refresh — get a fresh batch skipping current suggestions */}
              <motion.button
                onClick={() => handleRecommend(mode === 'breakup', recs.map((r) => r.id))}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs mt-3"
                style={{ color: '#4a3f5c' }}
                whileHover={{ color: '#c084fc' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <RefreshCw className="w-3 h-3" />
                Try different ideas
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Popular in City */}
        <AnimatePresence>
          {localTrends && localTrends.city && localTrends.trends?.length > 0 && (
            <motion.div
              className="glass-card rounded-2xl p-6 mt-3"
              style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4" style={{ color: '#c084fc' }} />
                <h3 className="label-editorial">
                  Popular in {localTrends.city}
                </h3>
                <span className="text-xs" style={{ color: '#6b5f7e' }}>
                  ({localTrends.total_users} {localTrends.total_users === 1 ? 'dater' : 'daters'})
                </span>
              </div>
              <div className="space-y-3">
                {localTrends.trends.map((trend, i) => (
                  <motion.div
                    key={trend.activity_name}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-serif font-medium" style={{ color: '#f0ecf9' }}>
                          {trend.activity_name}
                        </span>
                        <span className="text-xs font-mono" style={{ color: '#c084fc' }}>
                          {trend.percentage}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'rgba(10, 8, 18, 0.8)' }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #8b5cf6, #c084fc)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${trend.percentage}%` }}
                          transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Explore Cities CTA */}
              <motion.button
                onClick={onExploreCities}
                className="mt-5 flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl w-full justify-center"
                style={{
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  color: '#c084fc',
                }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                whileHover={{ scale: 1.02, background: 'rgba(139, 92, 246, 0.15)', boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Globe className="w-4 h-4" />
                Explore other cities →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social discovery — only show after first recommend click */}
        {localTrends && <SimilarCouples />}
      </div>

      {/* Scroll indicator: only show when not loading and there are no recommendations */}
      <AnimatePresence>
        {(!loading && (!recs || recs.length === 0)) && (
          <motion.div
            className="flex items-center gap-2 mt-6 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            onClick={() => document.getElementById('section-history')?.scrollIntoView({ behavior: 'smooth' })}
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
