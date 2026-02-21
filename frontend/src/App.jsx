import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <motion.div
          className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.p
          className="text-gray-500 mt-4 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Loading your dating profile...
        </motion.p>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Dashboard />
        </motion.div>
      ) : (
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
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
      <AppContent />
    </AuthProvider>
  )
}
