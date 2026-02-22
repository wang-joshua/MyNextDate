import { useState, useEffect, useRef, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import LogoLoader from './components/LogoLoader'

function StarField() {
  const stars = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${1 + Math.random()}px`,
      opacity: 0.15 + Math.random() * 0.5,
      dur: `${3 + Math.random() * 5}s`,
      delay: `${-Math.random() * 8}s`,
    }))
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            '--star-opacity': s.opacity,
            '--star-dur': s.dur,
            '--star-delay': s.delay,
          }}
        />
      ))}
    </div>
  )
}

function AmbientBackground() {
  return (
    <div className="ambient-bg">
      <StarField />
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />
    </div>
  )
}

const MIN_SPLASH_MS = 1000

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()

  // Track when we first mounted so we can compute the real auth duration.
  const loadStartRef = useRef(Date.now())

  // splashDone: true only after the minimum splash duration has passed.
  const [splashDone, setSplashDone] = useState(false)

  // Initial splash: fires when auth resolves on page load / refresh.
  useEffect(() => {
    if (authLoading) return

    const elapsed = Date.now() - loadStartRef.current
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed)
    setTimeout(() => setSplashDone(true), remaining)
  }, [authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Login splash: fires when user transitions null → User AFTER the initial splash
  const splashDoneRef = useRef(false)
  useEffect(() => { splashDoneRef.current = splashDone }, [splashDone])

  const prevUserRef = useRef(null)
  useEffect(() => {
    if (prevUserRef.current === null && user !== null && splashDoneRef.current) {
      setSplashDone(false)
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
          <LogoLoader size={96} />
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
      <Routes location={location} key={location.pathname}>
        {/* Public route — redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
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
            )
          }
        />

        {/* Protected route — redirect to login if not authenticated */}
        <Route
          path="/dashboard"
          element={
            user ? (
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
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Default: redirect based on auth state */}
        <Route
          path="*"
          element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
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
