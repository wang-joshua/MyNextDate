import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, HeartCrack, Loader2, Plus, Heart, X, RefreshCw } from 'lucide-react'
import { getRecommendations, getWorstRecommendations, addDate, getLocalTrends } from '../lib/api'

export default function RecommendButton({ onDateAdded, dateCount = 0, onAddDate, onLocalTrends, onRecsChange }) {
  const [recs, setRecs] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(null)
  const [adding, setAdding] = useState(null)
  const [chosenId, setChosenId] = useState(null)
  const [showPulse, setShowPulse] = useState(false)
  const [skippedIds, setSkippedIds] = useState([])
  const [needsHistory, setNeedsHistory] = useState(false)

  useEffect(() => {
    onRecsChange?.(recs && recs.length > 0)
  }, [recs, onRecsChange])

  const handleRecommend = async (breakup = false, extraSkips = []) => {
    if (dateCount === 0) {
      setNeedsHistory(true)
      return
    }
    setNeedsHistory(false)
    setLoading(true)
    setShowPulse(true)
    const newMode = breakup ? 'breakup' : 'good'

    // Hide existing recommendations immediately
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
        onLocalTrends?.(trendsData)
        if (trendsData.city) {
          localStorage.setItem('userCity', trendsData.city)
        }
      }

      setRecs(data.recommendations)
      setSkippedIds([])
      setLoading(false)
      setTimeout(() => setShowPulse(false), 600)
    } catch (err) {
      console.error(err)
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
      setRecs(null)
      setChosenId(null)
      onDateAdded?.()
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

        <div className="relative">
          <motion.button
            onClick={() => handleRecommend(false)}
            disabled={loading}
            className="w-full py-5 rounded-2xl font-bold text-lg text-white disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden tracking-wide"
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
            {recs && recs.length > 0 && !loading && (
              <motion.span
                className="relative flex items-center gap-1 text-xs font-normal opacity-70"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 0.7, x: 0 }}
                whileHover={{ opacity: 1 }}
                onClick={(e) => { e.stopPropagation(); handleRecommend(mode === 'breakup', recs.map((r) => r.id)) }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Breakup link — always visible below button */}
      <motion.button
        onClick={() => handleRecommend(true)}
        disabled={loading}
        className="text-xs cursor-pointer mt-3 block mx-auto"
        style={{ color: '#2a2435', letterSpacing: '0.05em' }}
        whileHover={{ color: '#f87171' }}
      >
        {loading && mode === 'breakup' ? 'finding the worst...' : 'or plan a breakup?'}
      </motion.button>

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

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
