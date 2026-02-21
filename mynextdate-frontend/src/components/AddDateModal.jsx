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
    if (e.key === 'Enter' && e.metaKey) handleSubmit()
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
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(10, 8, 18, 0.7)', backdropFilter: 'blur(12px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="glass-heavy rounded-3xl w-full max-w-lg flex flex-col relative"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(109, 44, 142, 0.15)' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: '#c084fc' }} />
                <h2 className="heading-section text-xl">Add a Date</h2>
              </div>
              <motion.button
                onClick={handleClose}
                className="p-2 rounded-xl transition-all"
                style={{ color: '#6b5f7e' }}
                whileHover={{ scale: 1.1, rotate: 90, color: '#f0ecf9', background: 'rgba(109, 44, 142, 0.15)' }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {!result ? (
                <>
                  <p className="text-sm font-serif italic" style={{ color: '#9a8fad' }}>
                    Describe your date experience or your ideal date in a few lines. We'll match it to the perfect activity.
                  </p>

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. We went to a cozy Italian restaurant downtown, shared pasta and wine by candlelight, then took a slow walk along the river watching the city lights..."
                    rows={4}
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-[#6b5f7e] transition-all resize-none text-sm leading-relaxed"
                    style={{ background: 'rgba(10, 8, 18, 0.8)', border: '1px solid rgba(109, 44, 142, 0.15)' }}
                    autoFocus
                    disabled={loading}
                  />

                  {error && (
                    <motion.p
                      className="text-sm" style={{ color: '#f87171' }}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#6b5f7e' }}>
                      {description.length > 0 ? `${description.length} chars` : 'Cmd+Enter to submit'}
                    </span>
                    <motion.button
                      onClick={handleSubmit}
                      disabled={!description.trim() || loading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #6d2c8e)',
                        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)',
                      }}
                      whileHover={description.trim() && !loading ? { scale: 1.03, boxShadow: '0 8px 30px rgba(139, 92, 246, 0.35)' } : {}}
                      whileTap={description.trim() && !loading ? { scale: 0.97 } : {}}
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Matching...</>
                      ) : (
                        <><Send className="w-4 h-4" /> Find Match</>
                      )}
                    </motion.button>
                  </div>
                </>
              ) : (
                <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2" style={{ color: '#c084fc' }}>
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-serif font-medium">Date added successfully!</span>
                  </div>

                  <div className="p-4 rounded-xl glass-card" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="label-editorial" style={{ color: '#c084fc' }}>Best Match</span>
                      <span className="label-editorial">{Math.round(result.match_score * 100)}% match</span>
                    </div>
                    <p className="font-serif font-semibold text-white">{result.matched_activity}</p>
                  </div>

                  {result.top_matches && result.top_matches.length > 1 && (
                    <div className="space-y-2">
                      <span className="label-editorial">Other close matches</span>
                      {result.top_matches.slice(1).map((match, i) => (
                        <motion.div
                          key={match.id}
                          className="p-3 rounded-lg"
                          style={{ background: 'rgba(10, 8, 18, 0.6)', border: '1px solid rgba(109, 44, 142, 0.1)' }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * (i + 1) }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-serif" style={{ color: '#9a8fad' }}>{match.name}</p>
                            <span className="label-editorial">{Math.round(match.score * 100)}%</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <motion.button
                      onClick={() => { setDescription(''); setResult(null) }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ background: 'rgba(109, 44, 142, 0.15)', border: '1px solid rgba(109, 44, 142, 0.2)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Add Another
                    </motion.button>
                    <motion.button
                      onClick={handleClose}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d2c8e)' }}
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
