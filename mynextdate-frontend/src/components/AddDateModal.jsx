import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Send, Sparkles, Check, Heart, PenLine } from 'lucide-react'
import { previewDateMatches, addDate, addCustomDate } from '../lib/api'

export default function AddDateModal({ isOpen, onClose, onDateAdded }) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState(null)    // preview results (top 3)
  const [selected, setSelected] = useState(null)   // user-chosen match id
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedName, setSavedName] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const [customName, setCustomName] = useState('')
  const [error, setError] = useState('')

  const handleClose = () => {
    setDescription('')
    setMatches(null)
    setSelected(null)
    setSaved(false)
    setSavedName('')
    setCustomMode(false)
    setCustomName('')
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!description.trim()) return
    setLoading(true)
    setError('')
    setMatches(null)
    setSelected(null)
    setSaved(false)
    try {
      const data = await previewDateMatches(description.trim())
      setMatches(data.top_matches)
    } catch (err) {
      setError('Failed to match your date. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMatch = async (match) => {
    setSelected(match.id)
    setSaving(true)
    try {
      await addDate(match.id)
      setSavedName(match.name)
      setSaved(true)
      onDateAdded?.()
    } catch (err) {
      setError('Failed to save date. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCustom = async () => {
    if (!customName.trim()) return
    setSaving(true)
    setError('')
    try {
      const data = await addCustomDate(customName.trim())
      setSavedName(data.matched_activity || customName.trim())
      setSaved(true)
      onDateAdded?.()
    } catch (err) {
      setError('Failed to save date. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.metaKey) handleSubmit()
  }

  const handleStartOver = () => {
    setDescription('')
    setMatches(null)
    setSelected(null)
    setSaved(false)
    setSavedName('')
    setCustomMode(false)
    setCustomName('')
    setError('')
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
              {/* Step 1: Describe your date */}
              {!matches && !saved && (
                <>
                  <p className="text-sm font-serif italic" style={{ color: '#9a8fad' }}>
                    Describe your date experience or your ideal date in a few lines. We'll find the best matches for you to pick from.
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
                        <><Send className="w-4 h-4" /> Find Matches</>
                      )}
                    </motion.button>
                  </div>
                </>
              )}

              {/* Step 2: Pick from matches */}
              {matches && !saved && (
                <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-sm font-serif italic" style={{ color: '#9a8fad' }}>
                    We found these matches. Tap the one that fits best:
                  </p>

                  <div className="space-y-2">
                    {matches.map((match, i) => (
                      <motion.button
                        key={match.id}
                        onClick={() => !saving && handleSelectMatch(match)}
                        disabled={saving}
                        className="w-full text-left p-4 rounded-xl transition-all"
                        style={{
                          background: selected === match.id
                            ? 'rgba(139, 92, 246, 0.15)'
                            : 'rgba(10, 8, 18, 0.6)',
                          border: selected === match.id
                            ? '1px solid rgba(139, 92, 246, 0.4)'
                            : '1px solid rgba(109, 44, 142, 0.15)',
                        }}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={!saving ? { scale: 1.01, borderColor: 'rgba(139, 92, 246, 0.3)' } : {}}
                        whileTap={!saving ? { scale: 0.98 } : {}}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: 'rgba(139, 92, 246, 0.1)' }}
                            >
                              {saving && selected === match.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#c084fc' }} />
                              ) : (
                                <Heart className="w-4 h-4" style={{ color: '#c084fc' }} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-serif font-medium truncate" style={{ color: '#f0ecf9' }}>
                                {match.name}
                              </p>
                              {match.description && (
                                <p className="text-xs mt-0.5 truncate" style={{ color: '#6b5f7e' }}>
                                  {match.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ml-3"
                            style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#c084fc' }}
                          >
                            {Math.round(match.score * 100)}%
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {error && (
                    <motion.p
                      className="text-sm" style={{ color: '#f87171' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  {!customMode ? (
                    <motion.button
                      onClick={() => setCustomMode(true)}
                      disabled={saving}
                      className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-medium rounded-xl transition-all"
                      style={{ color: '#9a8fad', background: 'rgba(109, 44, 142, 0.08)', border: '1px solid rgba(109, 44, 142, 0.1)' }}
                      whileHover={{ background: 'rgba(109, 44, 142, 0.15)', color: '#c084fc' }}
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      None of these? Enter your own activity
                    </motion.button>
                  ) : (
                    <motion.div
                      className="space-y-3 pt-1"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <div
                        className="h-px w-full"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(109, 44, 142, 0.2), transparent)' }}
                      />
                      <p className="text-xs font-serif italic" style={{ color: '#9a8fad' }}>
                        Type your own activity name:
                      </p>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveCustom()}
                        placeholder="e.g. Sushi dinner at Nobu"
                        className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-[#6b5f7e]"
                        style={{ background: 'rgba(10, 8, 18, 0.8)', border: '1px solid rgba(109, 44, 142, 0.15)' }}
                        autoFocus
                        disabled={saving}
                      />
                      <motion.button
                        onClick={handleSaveCustom}
                        disabled={!customName.trim() || saving}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6, #6d2c8e)',
                          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)',
                        }}
                        whileHover={customName.trim() && !saving ? { scale: 1.02 } : {}}
                        whileTap={customName.trim() && !saving ? { scale: 0.98 } : {}}
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Custom Date'}
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {saved && (
                <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2" style={{ color: '#c084fc' }}>
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-serif font-medium">Date added successfully!</span>
                  </div>

                  <div className="p-4 rounded-xl glass-card" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <p className="font-serif font-semibold text-white">
                      {savedName}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <motion.button
                      onClick={handleStartOver}
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
