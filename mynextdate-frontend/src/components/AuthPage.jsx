import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Heart } from 'lucide-react'
import VideoCards from './VideoCards'

const floatingElements = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 8 + Math.random() * 4,
  size: 4 + Math.random() * 8,
}))

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: err } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password)
      if (err) setError(err.message)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Stacked floating video cards (Vylit-style) */}
      <VideoCards />

      {/* Background blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: 'rgba(109, 44, 142, 0.15)', animation: 'ambientOrb 8s ease-in-out infinite' }} />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-[150px]"
        style={{ background: 'rgba(139, 92, 246, 0.1)', animation: 'ambientOrb 10s ease-in-out infinite 3s' }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full blur-[100px]"
        style={{ background: 'rgba(109, 44, 142, 0.08)', animation: 'ambientOrb 12s ease-in-out infinite 6s' }} />

      {/* Floating diamond shapes */}
      {floatingElements.map((el) => (
        <motion.div
          key={el.id}
          className="absolute pointer-events-none"
          style={{
            left: `${el.x}%`,
            width: el.size,
            height: el.size,
            background: `rgba(139, 92, 246, ${0.1 + Math.random() * 0.15})`,
            transform: 'rotate(45deg)',
            borderRadius: '2px',
          }}
          animate={{
            y: ['100vh', '-100px'],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            delay: el.delay,
            ease: 'linear',
          }}
        />
      ))}

      {/* Logo */}
      <motion.div
        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #6d2c8e)',
          boxShadow: '0 8px 40px rgba(139, 92, 246, 0.3)',
        }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <Heart className="w-10 h-10 text-white fill-white" />
      </motion.div>

      {/* Title with letter reveal */}
      <motion.h1
        className="heading-hero text-5xl mb-2"
        style={{
          background: 'linear-gradient(135deg, #c084fc, #8b5cf6, #6d2c8e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {"MyNextDate".split('').map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.4 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'inline-block' }}
          >
            {char}
          </motion.span>
        ))}
      </motion.h1>

      <motion.p
        className="text-lg font-serif italic mb-10"
        style={{ color: '#9a8fad' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.8 }}
      >
        AI-powered date recommendations
      </motion.p>

      {/* Form card */}
      <motion.div
        className="glass-heavy rounded-3xl p-8 w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait">
          <motion.h2
            key={isSignUp ? 'signup' : 'signin'}
            className="heading-section text-2xl mb-6"
            initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
            transition={{ duration: 0.3 }}
          >
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </motion.h2>
        </AnimatePresence>

        {error && (
          <motion.div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-editorial block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-white placeholder-[#6b5f7e] transition-all duration-300"
              style={{ background: 'rgba(10, 8, 18, 0.8)', border: '1px solid rgba(109, 44, 142, 0.15)' }}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="label-editorial block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-white placeholder-[#6b5f7e] transition-all duration-300"
              style={{ background: 'rgba(10, 8, 18, 0.8)', border: '1px solid rgba(109, 44, 142, 0.15)' }}
              placeholder="Enter password"
              required
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-white tracking-wide disabled:opacity-50 mt-2"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d2c8e, #4c1d95)',
              backgroundSize: '200% 200%',
              boxShadow: '0 8px 30px rgba(139, 92, 246, 0.25)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: '#6b5f7e' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            className="font-medium transition-colors"
            style={{ color: '#c084fc' }}
          >
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
