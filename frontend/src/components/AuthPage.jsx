import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Heart } from 'lucide-react'

const floatingHearts = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 5,
  duration: 6 + Math.random() * 4,
  size: 12 + Math.random() * 16,
}))

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    if (authError) {
      setError(authError.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-600/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Floating hearts */}
      {floatingHearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute pointer-events-none text-pink-500/20"
          style={{ left: `${h.x}%` }}
          animate={{
            y: [window.innerHeight, -100],
            rotate: [0, h.id % 2 === 0 ? 20 : -20, 0],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: h.duration,
            repeat: Infinity,
            delay: h.delay,
            ease: 'linear',
          }}
        >
          <Heart size={h.size} fill="currentColor" />
        </motion.div>
      ))}

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 mb-4 shadow-lg shadow-pink-500/25"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Heart className="w-10 h-10 text-white fill-white" />
          </motion.div>
          <motion.h1
            className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            MyNextDate
          </motion.h1>
          <motion.p
            className="text-gray-400 mt-2 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            AI-powered date recommendations
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          className="bg-[#1a1725]/80 backdrop-blur-xl rounded-3xl p-8 border border-[#2d2840] shadow-2xl shadow-black/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            <motion.h2
              key={isSignUp ? 'signup' : 'signin'}
              className="text-xl font-semibold mb-6"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </motion.h2>
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#0f0d15] border border-[#2d2840] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all duration-200"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#0f0d15] border border-[#2d2840] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all duration-200"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold text-white disabled:opacity-50 shadow-lg shadow-pink-500/20"
              whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(236, 72, 153, 0.3)' }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Loading...
                </span>
              ) : isSignUp ? 'Create Account' : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              className="text-pink-400 hover:text-pink-300 transition font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
