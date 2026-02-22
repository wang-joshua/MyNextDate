import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Plus, History, BarChart3, Globe, MapPin, RefreshCw } from 'lucide-react'
import Logo from './Logo'
import VideoCards from './VideoCards'
import { useAuth } from '../context/AuthContext'
import RecommendButton from './RecommendButton'
import DateHistory from './DateHistory'
import AddDateModal from './AddDateModal'
import Analytics from './Analytics'
import ExploreCities from './ExploreCities'
import SimilarCouples from './SimilarCouples'
import { getDateHistory, saveLocation, getLocalTrends, getCityDimensions } from '../lib/api'

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

const DIMENSION_DISPLAY = {
  cost: { label: 'Budget', low: 'Affordable', high: 'Luxury', color: '#10b981' },
  indoor_outdoor: { label: 'Setting', low: 'Indoor', high: 'Outdoor', color: '#38bdf8' },
  energy: { label: 'Energy', low: 'Relaxed', high: 'Active', color: '#fb923c' },
  social_density: { label: 'Social', low: 'Private', high: 'Social', color: '#a78bfa' },
  time_of_day: { label: 'Time', low: 'Morning', high: 'Evening', color: '#e879f9' },
  duration: { label: 'Length', low: 'Quick', high: 'Extended', color: '#2dd4bf' },
  surprise: { label: 'Novelty', low: 'Familiar', high: 'Adventurous', color: '#fb7185' },
  romance_intensity: { label: 'Romance', low: 'Casual', high: 'Intense', color: '#f472b6' },
  conversation_depth: { label: 'Talk', low: 'Activity', high: 'Deep talks', color: '#818cf8' },
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [dates, setDates] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showExploreCities, setShowExploreCities] = useState(false)
  const [localTrends, setLocalTrends] = useState(null)
  const [hasRecs, setHasRecs] = useState(false)
  const [cityFlipped, setCityFlipped] = useState(false)
  const [cityDimensions, setCityDimensions] = useState(null)

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

  // Fetch local trends on mount
  useEffect(() => {
    getLocalTrends()
      .then((data) => setLocalTrends(data))
      .catch(() => {})
  }, [])

  // Fetch city dimension profile when we know the user's city
  useEffect(() => {
    if (!localTrends?.city) return
    getCityDimensions()
      .then((data) => {
        const match = data.cities?.find(
          (c) => c.city.toLowerCase() === localTrends.city.toLowerCase()
        )
        if (match) setCityDimensions(match)
      })
      .catch(() => {})
  }, [localTrends?.city])

  const handleLocalTrends = useCallback((trends) => {
    setLocalTrends(trends)
  }, [])

  const handleRecsChange = useCallback((hasAny) => {
    setHasRecs(!!hasAny)
  }, [])

  return (
    <div className="min-h-screen">
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

      {/* ============ SECTION 1: HERO + RECOMMENDATIONS ============ */}
      <section className="px-4 sm:px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div
            className={`hero-grid gap-8 lg:gap-12 w-full items-start grid grid-cols-1${hasRecs ? ' recs-active' : ''}`}
          >
            {/* Left: Camera roll scrolling media — always visible */}
            <motion.div
              className="overflow-hidden rounded-3xl hero-video"
              style={{
                height: hasRecs ? '60vh' : '88vh',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                boxShadow: '0 8px 40px rgba(109, 44, 142, 0.2), 0 0 60px rgba(139, 92, 246, 0.05)',
              }}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <VideoCards mode="inline" />
            </motion.div>

            {/* Right: Hero text + Recommend button */}
            <motion.div
              className={`flex flex-col gap-4 pt-16 ${hasRecs ? 'items-center' : 'items-start'}`}
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              <motion.p
                className="label-editorial"
                variants={fadeUp}
              >
                Your personal date curator
              </motion.p>

              <motion.h2
                className={`heading-hero ${hasRecs ? 'text-3xl sm:text-4xl lg:text-4xl text-center' : 'text-4xl sm:text-5xl lg:text-6xl'}`}
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
                  Perfect Experience
                </span>
              </motion.h2>

              {!hasRecs && (
                <motion.p
                  className="text-lg max-w-md font-serif italic"
                  style={{ color: '#9a8fad' }}
                  variants={fadeUp}
                >
                  Let AI craft your next unforgettable memory
                </motion.p>
              )}

              <motion.div className={`w-full mt-4 ${hasRecs ? '' : 'max-w-xl'}`} variants={fadeUp}>
                <RecommendButton
                  onDateAdded={refresh}
                  dateCount={dates.length}
                  onAddDate={() => setShowAddModal(true)}
                  onLocalTrends={handleLocalTrends}
                  onRecsChange={handleRecsChange}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 2: HISTORY + ANALYTICS ============ */}
      <section id="section-history" className="px-4 sm:px-6 py-8">
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

      {/* ============ SECTION 3: POPULAR IN CITY (flippable) + SIMILAR COUPLES ============ */}
      <section className="px-4 sm:px-6 py-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Flippable City Card */}
            <motion.div
              className="glass-card rounded-3xl p-6"
              initial={{ opacity: 0, x: -30, scale: 0.97 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header with flip toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: '#c084fc' }} />
                  <h2 className="heading-section text-xl">
                    {cityFlipped ? 'City Dimensions' : 'Popular in Your City'}
                  </h2>
                </div>
                {cityDimensions && (
                  <motion.button
                    onClick={() => setCityFlipped((f) => !f)}
                    className="p-2 rounded-xl"
                    style={{ color: '#6b5f7e', border: '1px solid rgba(139, 92, 246, 0.15)' }}
                    whileHover={{ color: '#c084fc', borderColor: 'rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.08)' }}
                    whileTap={{ scale: 0.9 }}
                    title={cityFlipped ? 'Show popular dates' : 'Show city dimensions'}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {!cityFlipped ? (
                  /* ---- FRONT: Popular in Your City ---- */
                  <motion.div
                    key="front-trends"
                    initial={{ opacity: 0, rotateY: -90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: 90 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {localTrends && localTrends.city && localTrends.trends?.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="label-editorial">{localTrends.city}</h3>
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
                              transition={{ delay: 0.1 + i * 0.1 }}
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
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(10, 8, 18, 0.8)' }}>
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: 'linear-gradient(90deg, #8b5cf6, #c084fc)' }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${trend.percentage}%` }}
                                    transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm py-8 text-center" style={{ color: '#6b5f7e' }}>
                        <p>City trends will appear once we detect your location.</p>
                        <p className="mt-1 text-xs" style={{ color: '#4a3f5c' }}>Make sure location access is enabled.</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* ---- BACK: City Dimensions ---- */
                  <motion.div
                    key="back-dimensions"
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: -90 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {cityDimensions ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="label-editorial">{cityDimensions.city}</h3>
                          <span className="text-xs" style={{ color: '#6b5f7e' }}>
                            ({cityDimensions.activity_count} activities)
                          </span>
                        </div>
                        <div className="space-y-3">
                          {Object.entries(cityDimensions.dimensions).map(([dim, val], i) => {
                            const d = DIMENSION_DISPLAY[dim]
                            if (!d) return null
                            const pct = Math.round(val * 100)
                            return (
                              <motion.div
                                key={dim}
                                className="space-y-1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 + i * 0.06 }}
                              >
                                <div className="flex justify-between items-center text-xs">
                                  <span style={{ color: '#6b5f7e' }}>{d.low}</span>
                                  <span className="font-serif font-medium" style={{ color: '#f0ecf9' }}>{d.label}</span>
                                  <span style={{ color: '#6b5f7e' }}>{d.high}</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(10, 8, 18, 0.8)' }}>
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: d.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ delay: 0.1 + i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                  />
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm py-8 text-center" style={{ color: '#6b5f7e' }}>
                        <p>Dimension data not available.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Right: Similar Couples — no outer glass-card to avoid double border */}
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.97 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <SimilarCouples />
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
