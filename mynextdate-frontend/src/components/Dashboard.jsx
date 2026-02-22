import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Plus, History, BarChart3, ChevronDown } from 'lucide-react'
import Logo from './Logo'
import VideoCards from './VideoCards'
import { useAuth } from '../context/AuthContext'
import RecommendButton from './RecommendButton'
import DateHistory from './DateHistory'
import AddDateModal from './AddDateModal'
import Analytics from './Analytics'
import { getDateHistory } from '../lib/api'

const fadeUp = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } }
}

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
    <div className="snap-container">
      {/* ============ FIXED HEADER ============ */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(10, 8, 18, 0.6)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderBottom: '1px solid rgba(109, 44, 142, 0.1)',
        }}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Logo className="w-12 h-12" />
            </motion.div>
            <h1
              className="font-serif text-xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #c084fc, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              MyNextDate
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:block" style={{ color: '#6b5f7e' }}>
              {user?.email}
            </span>
            <motion.button
              onClick={signOut}
              className="p-2.5 rounded-xl transition-all"
              style={{ color: '#6b5f7e' }}
              title="Sign out"
              whileHover={{ scale: 1.05, color: '#f0ecf9', background: 'rgba(109, 44, 142, 0.15)' }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ============ SECTION 1: HERO / RECOMMEND ============ */}
      <section className="snap-section px-4 sm:px-6 pt-20">
        <div className="max-w-6xl mr-auto ml-8 sm:ml-12 h-full flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-12 w-full items-start">
            {/* Left: Camera roll scrolling media */}
            <motion.div
              className="overflow-hidden rounded-3xl"
              style={{
                height: '88vh',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                boxShadow: '0 8px 40px rgba(109, 44, 142, 0.2), 0 0 60px rgba(139, 92, 246, 0.05)',
              }}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <VideoCards mode="inline" />
            </motion.div>

            {/* Right: Hero text + Recommend button */}
            <motion.div
              className="flex flex-col items-start gap-4 pt-16"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              <motion.p className="label-editorial" variants={fadeUp}>
                Your personal date curator
              </motion.p>

              <motion.h2
                className="heading-hero text-4xl sm:text-5xl lg:text-6xl"
                variants={fadeUp}
              >
                <span style={{
                  background: 'linear-gradient(135deg, #f0ecf9, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Discover Your
                </span>
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6d2c8e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Perfect Evening
                </span>
              </motion.h2>

              <motion.p
                className="text-lg max-w-md font-serif italic"
                style={{ color: '#9a8fad' }}
                variants={fadeUp}
              >
                Let AI craft your next unforgettable experience
              </motion.p>

              <motion.div className="w-full max-w-xl mt-4" variants={fadeUp}>
                <RecommendButton onDateAdded={refresh} dateCount={dates.length} onAddDate={() => setShowAddModal(true)} />
              </motion.div>

              {/* Scroll indicator */}
              <motion.div
                className="flex items-center gap-2 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              >
                <span className="label-editorial" style={{ fontSize: '0.6rem' }}>Scroll to explore</span>
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronDown className="w-5 h-5" style={{ color: '#6b5f7e' }} />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 2: HISTORY + ANALYTICS ============ */}
      <section className="snap-section px-4 sm:px-6 py-8 pt-20">
        <div className="max-w-6xl mx-auto h-full flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 max-h-[calc(100vh-8rem)]">
            {/* Left: Date History */}
            <motion.div
              className="glass-card rounded-3xl p-6 flex flex-col min-h-0"
              initial={{ opacity: 0, x: -30, scale: 0.97 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5" style={{ color: '#6b5f7e' }} />
                  <h2 className="heading-section text-xl">Date History</h2>
                  {dates.length > 0 && (
                    <span
                      className="label-editorial px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(109, 44, 142, 0.15)', fontSize: '0.65rem' }}
                    >
                      {dates.length}
                    </span>
                  )}
                </div>
                <motion.button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#c084fc',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                  }}
                  whileHover={{
                    scale: 1.05,
                    background: 'rgba(139, 92, 246, 0.2)',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  Add Date
                </motion.button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <DateHistory dates={dates} onUpdate={refresh} />
              </div>
            </motion.div>

            {/* Right: Analytics */}
            <motion.div
              className="glass-card rounded-3xl p-6 flex flex-col min-h-0"
              initial={{ opacity: 0, x: 30, scale: 0.97 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-3 mb-5">
                <BarChart3 className="w-5 h-5" style={{ color: '#6b5f7e' }} />
                <h2 className="heading-section text-xl">Your Analytics</h2>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <Analytics refreshTrigger={refreshKey} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Add Date Modal */}
      <AddDateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onDateAdded={refresh}
      />
    </div>
  )
}
