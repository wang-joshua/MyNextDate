import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Send, Sparkles, Check } from 'lucide-react'
import { addDateByDescription } from '../lib/api'

export default function AddDateModal({ isOpen, onClose, onDateAdded }) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleClose = () => {
    setDescription('')
    setResult(null)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!description.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await addDateByDescription(description.trim())
      setResult(data)
      onDateAdded?.()
    } catch (err) {
      setError('Failed to match your date. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="bg-[#1a1725] rounded-3xl border border-[#2d2840] w-full max-w-lg flex flex-col relative shadow-2xl shadow-black/50"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2d2840]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <h2 className="text-lg font-semibold">Add a Date</h2>
              </div>
              <motion.button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#2d2840] rounded-xl transition-all"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {!result ? (
                <>
                  <p className="text-sm text-gray-400">
                    Describe your date experience or your ideal date in a few lines. We'll match it to the perfect activity.
                  </p>

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. We went to a cozy Italian restaurant downtown, shared pasta and wine by candlelight, then took a slow walk along the river watching the city lights..."
                    rows={4}
                    className="w-full px-4 py-3.5 bg-[#0f0d15] border border-[#2d2840] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all resize-none text-sm leading-relaxed"
                    autoFocus
                    disabled={loading}
                  />

                  {error && (
                    <motion.p
                      className="text-sm text-red-400"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      {description.length > 0 ? `${description.length} chars` : 'Cmd+Enter to submit'}
                    </span>
                    <motion.button
                      onClick={handleSubmit}
                      disabled={!description.trim() || loading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:from-pink-500 hover:to-rose-500 transition-all"
                      whileHover={description.trim() && !loading ? { scale: 1.03 } : {}}
                      whileTap={description.trim() && !loading ? { scale: 0.97 } : {}}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Matching...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Find Match
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              ) : (
                /* Results view */
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Date added successfully!</span>
                  </div>

                  {/* Best match */}
                  <div className="p-4 bg-[#0f0d15] rounded-xl border border-pink-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-pink-400 font-medium uppercase tracking-wider">Best Match</span>
                      <span className="text-xs text-gray-500">{Math.round(result.match_score * 100)}% match</span>
                    </div>
                    <p className="font-semibold text-white">{result.matched_activity}</p>
                  </div>

                  {/* Top matches */}
                  {result.top_matches && result.top_matches.length > 1 && (
                    <div className="space-y-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Other close matches</span>
                      {result.top_matches.slice(1).map((match, i) => (
                        <motion.div
                          key={match.id}
                          className="p-3 bg-[#0f0d15]/60 rounded-lg border border-[#2d2840]/50"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * (i + 1) }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-300">{match.name}</p>
                            <span className="text-xs text-gray-600">{Math.round(match.score * 100)}%</span>
                          </div>
                          {match.description && (
                            <p className="text-xs text-gray-600 mt-0.5">{match.description}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Add another or close */}
                  <div className="flex gap-3 pt-2">
                    <motion.button
                      onClick={() => {
                        setDescription('')
                        setResult(null)
                      }}
                      className="flex-1 py-2.5 bg-[#2d2840] rounded-xl text-sm font-medium hover:bg-[#3d3855] transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Add Another
                    </motion.button>
                    <motion.button
                      onClick={handleClose}
                      className="flex-1 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl text-sm font-medium hover:from-pink-500 hover:to-rose-500 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Done
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
