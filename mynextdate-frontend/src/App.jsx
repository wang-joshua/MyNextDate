import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import HeartLoader from './components/HeartLoader'

function AmbientBackground() {
  return (
    <div className="ambient-bg">
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />
    </div>
  )
}

const MIN_SPLASH_MS = 1000

function AppContent() {
  const { user, loading: authLoading } = useAuth()

  // Track when we first mounted so we can compute the real auth duration.
  const loadStartRef = useRef(Date.now())

  // fillDuration: how long the ONE-SHOT heart fill animation runs.
  // Starts at MIN so the heart begins filling immediately on mount.
  const [fillDuration, setFillDuration] = useState(MIN_SPLASH_MS)

  // splashDone: true only after the fill animation has completed.
  const [splashDone, setSplashDone] = useState(false)

  // Initial splash: fires when auth resolves on page load / refresh.
  useEffect(() => {
    if (authLoading) return

    const elapsed = Date.now() - loadStartRef.current
    const total = Math.max(elapsed, MIN_SPLASH_MS)
    const remaining = total - elapsed

    setFillDuration(total)
    // No cleanup return — intentional. StrictMode double-invoke fires two timers,
    // both safely call setSplashDone(true); the second is a no-op.
    setTimeout(() => setSplashDone(true), remaining)
  }, [authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Login splash: fires when user transitions null → User AFTER the initial splash
  // has already completed.  A ref mirrors splashDone so the effect below doesn't
  // need splashDone in its deps (which would re-run it on every splash change).
  const splashDoneRef = useRef(false)
  useEffect(() => { splashDoneRef.current = splashDone }, [splashDone])

  const prevUserRef = useRef(null)
  useEffect(() => {
    if (prevUserRef.current === null && user !== null && splashDoneRef.current) {
      // User just logged in from the AuthPage — show a fresh 1-second splash.
      setSplashDone(false)
      setFillDuration(MIN_SPLASH_MS)
      // No cleanup return — intentional (same StrictMode reasoning as above).
      // Second run sees prevUserRef already set to user, so condition is false.
      setTimeout(() => setSplashDone(true), MIN_SPLASH_MS)
    }
    prevUserRef.current = user
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loading = authLoading || !splashDone

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* loop=false: fills once at the speed that matches the actual load time */}
          <HeartLoader size={72} durationMs={fillDuration} loop={false} />
        </motion.div>
        <motion.p
          className="mt-6 text-sm font-serif italic"
          style={{ color: '#9a8fad' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Preparing your experience...
        </motion.p>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <Dashboard />
        </motion.div>
      ) : (
        <motion.div
          key="auth"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <AuthPage />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AmbientBackground />
      <AppContent />
    </AuthProvider>
  )
}
