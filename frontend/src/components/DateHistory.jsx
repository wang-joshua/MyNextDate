import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Loader2, Clock, Calendar } from 'lucide-react'
import HeartRating from './HeartRating'
import { rateDate, deleteDate } from '../lib/api'

export default function DateHistory({ dates, onUpdate }) {
  const [deletingId, setDeletingId] = useState(null)

  const handleRate = async (dateId, rating) => {
    try {
      await rateDate(dateId, rating)
      onUpdate?.()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (dateId) => {
    setDeletingId(dateId)
    try {
      await deleteDate(dateId)
      onUpdate?.()
    } catch (err) {
      console.error(err)
    }
    setDeletingId(null)
  }

  if (!dates || dates.length === 0) {
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
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
        </motion.div>
        <p className="text-lg font-medium text-gray-400">No dates yet</p>
        <p className="text-sm mt-1">Add your first date to get started!</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
      <AnimatePresence>
        {dates.map((date, i) => (
          <motion.div
            key={date.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center gap-4 p-4 bg-[#0f0d15] rounded-xl border border-[#2d2840]/50 group hover:border-[#2d2840] transition-all duration-200"
          >
            {/* Date number indicator */}
            <div className="w-8 h-8 rounded-lg bg-[#1a1725] flex items-center justify-center text-xs text-gray-500 font-mono shrink-0">
              {dates.length - i}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {date.activity_name || `Activity #${date.activity_id}`}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3 text-gray-600" />
                <p className="text-xs text-gray-500">
                  {new Date(date.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {date.rating === null ? (
                <div className="flex items-center gap-2">
                  <motion.span
                    className="text-xs text-amber-400/80 bg-amber-400/10 px-2.5 py-1 rounded-lg font-medium"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Rate it!
                  </motion.span>
                  <HeartRating
                    rating={0}
                    onChange={(r) => handleRate(date.id, r)}
                    size={16}
                  />
                </div>
              ) : (
                <HeartRating
                  rating={date.rating}
                  onChange={(r) => handleRate(date.id, r)}
                  size={16}
                />
              )}

              <motion.button
                onClick={() => handleDelete(date.id)}
                disabled={deletingId === date.id}
                className="p-2 text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {deletingId === date.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
