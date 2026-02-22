import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Plus, History, BarChart3, ArrowLeft, Globe } from 'lucide-react'
import Logo from './Logo'
import VideoCards from './VideoCards'
import { useAuth } from '../context/AuthContext'
import RecommendButton from './RecommendButton'
import DateHistory from './DateHistory'
import AddDateModal from './AddDateModal'
import Analytics from './Analytics'
import ExploreCities from './ExploreCities'
import { getDateHistory, saveLocation } from '../lib/api'

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
  const [heroShrunken, setHeroShrunken] = useState(false)
  const [showExploreCities, setShowExploreCities] = useState(false)
  const [recommendKey, setRecommendKey] = useState(0)

  const handleBack = useCallback(() => {
    setHeroShrunken(false)
    setRecommendKey((k) => k + 1) // remounts RecommendButton, clearing all recs/trends state
  }, [])

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    getDateHistory()
      .then((data) => setDates(data.dates))
      .catch(console.error)
  }, [refreshKey])

  // Request browser geolocation on mount and save to backend
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {})
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [])

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
              onClick={() => setShowExploreCities(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
              style={{ color: '#9a8fad', border: '1px solid rgba(139,92,246,0.15)' }}
              title="Explore Cities"
              whileHover={{ scale: 1.04, color: '#c084fc', borderColor: 'rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.08)' }}
              whileTap={{ scale: 0.96 }}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:block">Explore Cities</span>
            </motion.button>
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
        <div className={`${heroShrunken ? 'max-w-5xl mx-auto w-full' : 'max-w-6xl mr-auto ml-8 sm:ml-12'} h-full flex items-${heroShrunken ? 'start pt-6' : 'center'}`}>
          <motion.div
            layout
            className={`grid gap-8 lg:gap-12 w-full items-start ${heroShrunken ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1.3fr_1fr]'}`}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Left: Camera roll scrolling media — exits when hero shrinks */}
            <AnimatePresence>
              {!heroShrunken && (
                <motion.div
                  key="video-col"
                  className="overflow-hidden rounded-3xl"
                  style={{
                    height: '88vh',
                    border: '1px solid rgba(139, 92, 246, 0.15)',
                    boxShadow: '0 8px 40px rgba(109, 44, 142, 0.2), 0 0 60px rgba(139, 92, 246, 0.05)',
                  }}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -40 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <VideoCards mode="inline" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right: Hero text + Recommend button */}
            <motion.div
              layout
              className={`flex flex-col items-start gap-4 ${heroShrunken ? 'pt-4' : 'pt-16'}`}
              variants={stagger}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnimatePresence>
                {heroShrunken && (
                  <motion.button
                    key="back-btn"
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-sm -mt-1 mb-1"
                    style={{ color: '#6b5f7e' }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.25 }}
                    whileHover={{ color: '#c084fc' }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!heroShrunken && (
                  <motion.p
                    key="label"
                    className="label-editorial"
                    variants={fadeUp}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    Your personal date curator
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.h2
                layout
                className={`heading-hero ${heroShrunken ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl lg:text-6xl'}`}
                variants={fadeUp}
                transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
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

              <AnimatePresence>
                {!heroShrunken && (
                  <motion.p
                    key="subtitle"
                    className="text-lg max-w-md font-serif italic"
                    style={{ color: '#9a8fad' }}
                    variants={fadeUp}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    Let AI craft your next unforgettable experience
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.div layout className={`w-full ${heroShrunken ? '' : 'max-w-xl'} mt-4`} variants={fadeUp}>
                <RecommendButton
                  key={recommendKey}
                  onDateAdded={refresh}
                  dateCount={dates.length}
                  onAddDate={() => setShowAddModal(true)}
                  onSearch={setHeroShrunken}
                  onExploreCities={() => setShowExploreCities(true)}
                />
              </motion.div>


            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============ SECTION 2: HISTORY + ANALYTICS ============ */}
      <section id="section-history" className="snap-section px-4 sm:px-6 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Date History */}
            <motion.div
              className="glass-card rounded-3xl p-6 flex flex-col"
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
              <div>
                <DateHistory dates={dates} onUpdate={refresh} />
              </div>
            </motion.div>

            {/* Right: Analytics */}
            <motion.div
              className="glass-card rounded-3xl p-6 flex flex-col"
              initial={{ opacity: 0, x: 30, scale: 0.97 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-3 mb-5">
                <BarChart3 className="w-5 h-5" style={{ color: '#6b5f7e' }} />
                <h2 className="heading-section text-xl">Your Analytics</h2>
              </div>
              <div>
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

      {/* Explore Cities Overlay */}
      <ExploreCities
        isOpen={showExploreCities}
        onClose={() => setShowExploreCities(false)}
      />
    </div>
  )
}
