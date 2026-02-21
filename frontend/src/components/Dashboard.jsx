import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Heart, LogOut, Plus, History, BarChart3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import RecommendButton from './RecommendButton'
import DateHistory from './DateHistory'
import AddDateModal from './AddDateModal'
import Analytics from './Analytics'
import { getDateHistory } from '../lib/api'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [dates, setDates] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    getDateHistory()
      .then((data) => setDates(data.dates))
      .catch(console.error)
  }, [refreshKey])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 bg-[#0f0d15]/70 backdrop-blur-2xl border-b border-[#2d2840]/50"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Heart className="w-5 h-5 text-white fill-white" />
            </motion.div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              MyNextDate
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">
              {user?.email}
            </span>
            <motion.button
              onClick={signOut}
              className="p-2.5 text-gray-400 hover:text-white hover:bg-[#1a1725] rounded-xl transition-all"
              title="Sign out"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Recommend Section */}
        <motion.section
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RecommendButton onDateAdded={refresh} />
        </motion.section>

        {/* Split Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Date History */}
          <motion.section
            className="bg-[#1a1725]/80 backdrop-blur-sm rounded-3xl border border-[#2d2840] p-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold">Date History</h2>
                {dates.length > 0 && (
                  <span className="text-xs bg-[#2d2840] text-gray-400 px-2 py-0.5 rounded-full">
                    {dates.length}
                  </span>
                )}
              </div>
              <motion.button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-pink-500/10 text-pink-400 rounded-xl hover:bg-pink-500/20 transition-all text-sm font-medium border border-pink-500/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                Add Date
              </motion.button>
            </div>
            <DateHistory dates={dates} onUpdate={refresh} />
          </motion.section>

          {/* Right: Analytics */}
          <motion.section
            className="bg-[#1a1725]/80 backdrop-blur-sm rounded-3xl border border-[#2d2840] p-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 25 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold">Your Analytics</h2>
            </div>
            <Analytics refreshTrigger={refreshKey} />
          </motion.section>
        </div>
      </main>

      {/* Add Date Modal */}
      <AddDateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onDateAdded={refresh}
      />
    </div>
  )
}
