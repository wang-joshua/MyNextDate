import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Loader2, Clock, Calendar } from 'lucide-react'
import HeartRating from './HeartRating'
import { rateDate, deleteDate } from '../lib/api'

export default function DateHistory({ dates, onUpdate }) {
  const [deleting, setDeleting] = useState(null)
  const [rating, setRating] = useState(null)
  const [ratingOpen, setRatingOpen] = useState(null)

  const handleRate = async (dateId, value) => {
    setRating(dateId)
    try {
      await rateDate(dateId, value)
      onUpdate?.()
    } catch (err) {
      console.error(err)
    }
    setRating(null)
  }

  const handleDelete = async (dateId) => {
    setDeleting(dateId)
    try {
      await deleteDate(dateId)
      onUpdate?.()
    } catch (err) {
      console.error(err)
    }
    setDeleting(null)
  }

  if (!dates || dates.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: '#6b5f7e' }} />
        </motion.div>
        <p className="heading-section text-xl" style={{ color: '#9a8fad' }}>No dates yet</p>
        <p className="text-sm mt-2 font-serif italic" style={{ color: '#6b5f7e' }}>
          Add your first date to begin your journey
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-2 pr-1">
      <AnimatePresence>
        {dates.map((date, i) => (
          <motion.div
            key={date.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center gap-4 p-4 rounded-xl group transition-all duration-300"
            style={{
              background: 'rgba(10, 8, 18, 0.6)',
              border: '1px solid rgba(109, 44, 142, 0.1)',
            }}
            whileHover={{
              borderColor: 'rgba(139, 92, 246, 0.3)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Number */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono shrink-0"
              style={{ background: 'rgba(109, 44, 142, 0.1)', color: '#6b5f7e' }}
            >
              {dates.length - i}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-serif font-medium truncate" style={{ color: '#f0ecf9' }}>
                {date.activity_name || `Activity #${date.activity_id}`}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3" style={{ color: '#6b5f7e' }} />
                <span className="text-xs" style={{ color: '#6b5f7e' }}>
                  {new Date(date.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Rating */}
            <div className="shrink-0">
              {date.rating || ratingOpen === date.id ? (
                <HeartRating
                  rating={date.rating || 0}
                  onChange={(v) => { handleRate(date.id, v); setRatingOpen(null) }}
                  size={16}
                />
              ) : (
                <motion.span
                  className="text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer"
                  style={{ color: '#c084fc', background: 'rgba(139, 92, 246, 0.1)' }}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  onClick={() => setRatingOpen(date.id)}
                  whileHover={{ scale: 1.05, background: 'rgba(139, 92, 246, 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  Rate it!
                </motion.span>
              )}
            </div>

            {/* Delete */}
            <motion.button
              onClick={() => handleDelete(date.id)}
              disabled={deleting === date.id}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg shrink-0"
              style={{ color: '#6b5f7e' }}
              whileHover={{ color: '#f87171', scale: 1.1, background: 'rgba(239, 68, 68, 0.1)' }}
              whileTap={{ scale: 0.9 }}
            >
              {deleting === date.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
