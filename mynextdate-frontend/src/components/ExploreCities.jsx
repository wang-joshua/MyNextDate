import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, Globe, MapPin, Loader2, X } from 'lucide-react'
import { searchCity } from '../lib/api'

const CITIES = [
  'Atlanta', 'Austin', 'Chicago', 'Los Angeles',
  'Miami', 'New York City', 'San Francisco', 'Seattle',
]

const VIBES = ['romantic', 'active', 'adventurous', 'cultural', 'fun', 'scenic', 'unique', 'relaxed']

function PriceBadge({ tier }) {
  const dollars = '$'.repeat(tier)
  const faded = '$'.repeat(3 - tier)
  return (
    <span className="text-xs font-mono">
      <span style={{ color: '#c084fc' }}>{dollars}</span>
      <span style={{ color: '#3d3450' }}>{faded}</span>
    </span>
  )
}

function VibePill({ label }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full capitalize"
      style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#9a8fad', border: '1px solid rgba(139, 92, 246, 0.15)' }}
    >
      {label}
    </span>
  )
}

function ActivityCard({ activity, index }) {
  const score = activity.score != null ? Math.round(activity.score * 100) : null
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card rounded-2xl p-5 flex flex-col gap-3 hover:border-violet-500/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-serif font-semibold text-base leading-snug" style={{ color: '#f0ecf9' }}>
            {activity.name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: '#6b5f7e' }}>
            {activity.venue}
          </p>
        </div>
        {score != null && (
          <span
            className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}
          >
            {score}% match
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed" style={{ color: '#9a8fad' }}>
        {activity.description}
      </p>

      {/* Footer row */}
      <div className="flex items-center gap-2 flex-wrap mt-auto">
        <PriceBadge tier={activity.price_tier} />
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: activity.indoor ? 'rgba(99, 102, 241, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            color: activity.indoor ? '#818cf8' : '#4ade80',
            border: `1px solid ${activity.indoor ? 'rgba(99,102,241,0.2)' : 'rgba(34,197,94,0.2)'}`,
          }}
        >
          {activity.indoor ? '🏛 Indoor' : '🌿 Outdoor'}
        </span>
        {activity.vibe?.slice(0, 2).map((v) => <VibePill key={v} label={v} />)}
      </div>
    </motion.div>
  )
}

export default function ExploreCities({ isOpen, onClose }) {
  const defaultCity = () => localStorage.getItem('userCity') || 'Atlanta'

  const [selectedCity, setSelectedCity] = useState(defaultCity)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState({ price_tier: null, indoor: null, vibes: [] })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const searchRef = useRef(null)

  // Sync default city from localStorage when overlay opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCity(defaultCity())
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 400)
    return () => clearTimeout(timer)
  }, [searchText])

  // Fetch results whenever city, debounced search, or filters change
  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    const body = {
      city: selectedCity,
      ...(debouncedSearch && { description: debouncedSearch }),
      ...(filters.price_tier !== null && { price_tier: filters.price_tier }),
      ...(filters.indoor !== null && { indoor: filters.indoor }),
      ...(filters.vibes.length > 0 && { vibes: filters.vibes }),
      top_k: 20,
    }

    searchCity(body)
      .then((data) => setResults(data.results || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [selectedCity, debouncedSearch, filters, isOpen])

  const toggleVibe = (vibe) => {
    setFilters((f) => ({
      ...f,
      vibes: f.vibes.includes(vibe) ? f.vibes.filter((v) => v !== vibe) : [...f.vibes, vibe],
    }))
  }

  const clearFilters = () => {
    setFilters({ price_tier: null, indoor: null, vibes: [] })
    setSearchText('')
  }

  const hasActiveFilters = filters.price_tier !== null || filters.indoor !== null || filters.vibes.length > 0 || searchText

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col overflow-hidden"
          style={{ background: 'var(--bg-deep)' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Header ── */}
          <div
            className="shrink-0 px-4 sm:px-6 py-4 flex items-center gap-4"
            style={{ borderBottom: '1px solid rgba(109, 44, 142, 0.15)', background: 'rgba(10,8,18,0.7)', backdropFilter: 'blur(40px)' }}
          >
            <motion.button
              onClick={onClose}
              className="p-2 rounded-xl"
              style={{ color: '#6b5f7e' }}
              whileHover={{ scale: 1.05, color: '#f0ecf9', background: 'rgba(109,44,142,0.15)' }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" style={{ color: '#8b5cf6' }} />
              <h2 className="font-serif font-semibold text-xl" style={{ color: '#f0ecf9' }}>
                Explore Cities
              </h2>
            </div>
          </div>

          {/* ── City tabs ── */}
          <div
            className="shrink-0 px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto"
            style={{ borderBottom: '1px solid rgba(109, 44, 142, 0.1)', scrollbarWidth: 'none' }}
          >
            {CITIES.map((city) => (
              <motion.button
                key={city}
                onClick={() => setSelectedCity(city)}
                className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={
                  selectedCity === city
                    ? { background: 'linear-gradient(135deg, #8b5cf6, #6d2c8e)', color: '#fff', boxShadow: '0 0 16px rgba(139,92,246,0.3)' }
                    : { background: 'rgba(28,23,48,0.8)', color: '#9a8fad', border: '1px solid rgba(109,44,142,0.15)' }
                }
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                {city}
              </motion.button>
            ))}
          </div>

          {/* ── Search + Filters ── */}
          <div className="shrink-0 px-4 sm:px-6 py-3 space-y-3" style={{ borderBottom: '1px solid rgba(109,44,142,0.1)' }}>
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b5f7e' }} />
              <input
                ref={searchRef}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={`Search ${selectedCity} dates… e.g. "romantic outdoor"`}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'rgba(28,23,48,0.8)',
                  border: '1px solid rgba(109,44,142,0.2)',
                  color: '#f0ecf9',
                  outline: 'none',
                }}
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#6b5f7e' }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Price tier */}
              {[null, 1, 2, 3].map((tier) => (
                <button
                  key={tier ?? 'all-price'}
                  onClick={() => setFilters((f) => ({ ...f, price_tier: tier }))}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={
                    filters.price_tier === tier
                      ? { background: 'rgba(139,92,246,0.25)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.4)' }
                      : { background: 'rgba(28,23,48,0.6)', color: '#6b5f7e', border: '1px solid rgba(109,44,142,0.15)' }
                  }
                >
                  {tier === null ? 'Any $' : '$'.repeat(tier)}
                </button>
              ))}

              <div className="w-px h-4 mx-1" style={{ background: 'rgba(109,44,142,0.2)' }} />

              {/* Indoor / Outdoor */}
              {[
                { label: 'Indoor', value: true },
                { label: 'Outdoor', value: false },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => setFilters((f) => ({ ...f, indoor: f.indoor === value ? null : value }))}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={
                    filters.indoor === value
                      ? { background: 'rgba(139,92,246,0.25)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.4)' }
                      : { background: 'rgba(28,23,48,0.6)', color: '#6b5f7e', border: '1px solid rgba(109,44,142,0.15)' }
                  }
                >
                  {label}
                </button>
              ))}

              <div className="w-px h-4 mx-1" style={{ background: 'rgba(109,44,142,0.2)' }} />

              {/* Vibe chips */}
              {VIBES.map((vibe) => (
                <button
                  key={vibe}
                  onClick={() => toggleVibe(vibe)}
                  className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all"
                  style={
                    filters.vibes.includes(vibe)
                      ? { background: 'rgba(139,92,246,0.25)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.4)' }
                      : { background: 'rgba(28,23,48,0.6)', color: '#6b5f7e', border: '1px solid rgba(109,44,142,0.15)' }
                  }
                >
                  {vibe}
                </button>
              ))}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-auto px-3 py-1 rounded-full text-xs flex items-center gap-1"
                  style={{ color: '#6b5f7e' }}
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* ── Results ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loader"
                  className="flex items-center justify-center py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#8b5cf6' }} />
                </motion.div>
              ) : results.length === 0 ? (
                <motion.div
                  key="empty"
                  className="flex flex-col items-center justify-center py-20 gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <MapPin className="w-10 h-10" style={{ color: '#3d3450' }} />
                  <p className="font-serif text-lg" style={{ color: '#6b5f7e' }}>
                    No activities found
                  </p>
                  <p className="text-sm" style={{ color: '#4a3f5c' }}>
                    Try different filters or a different city
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatePresence>
                    {results.map((activity, i) => (
                      <ActivityCard key={activity.id} activity={activity} index={i} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
