import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

export default function HeartRating({ rating, onChange, size = 20, readonly = false }) {
  const [hoverValue, setHoverValue] = useState(null)
  const displayValue = hoverValue ?? (rating || 0)

  const handleClick = (heartIndex, isLeftHalf) => {
    if (readonly) return
    const newRating = isLeftHalf ? heartIndex - 0.5 : heartIndex
    // Toggle off if clicking same value
    onChange?.(newRating === rating ? 0 : newRating)
  }

  return (
    <div
      className="flex gap-1"
      onMouseLeave={() => !readonly && setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((heartIndex) => {
        const fillAmount =
          displayValue >= heartIndex ? 1 : displayValue >= heartIndex - 0.5 ? 0.5 : 0

        return (
          <div
            key={heartIndex}
            className={`relative ${!readonly ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ width: size, height: size }}
          >
            {/* Empty heart (background) */}
            <Heart
              size={size}
              className="absolute inset-0 transition-colors duration-200"
              style={{ color: '#6b5f7e' }}
            />

            {/* Filled heart — full */}
            {fillAmount === 1 && (
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <Heart
                  size={size}
                  className="drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                  style={{ fill: '#ef4444', color: '#f87171' }}
                />
              </motion.div>
            )}

            {/* Filled heart — half (clipped left) */}
            {fillAmount === 0.5 && (
              <motion.div
                className="absolute inset-0 overflow-hidden"
                style={{ width: size / 2 }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <Heart
                  size={size}
                  className="drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                  style={{ fill: '#ef4444', color: '#f87171' }}
                />
              </motion.div>
            )}

            {/* Left half click zone (gives x.5) */}
            {!readonly && (
              <>
                <div
                  className="absolute top-0 left-0 h-full z-10"
                  style={{ width: '50%' }}
                  onMouseEnter={() => setHoverValue(heartIndex - 0.5)}
                  onClick={() => handleClick(heartIndex, true)}
                />
                {/* Right half click zone (gives x.0) */}
                <div
                  className="absolute top-0 right-0 h-full z-10"
                  style={{ width: '50%' }}
                  onMouseEnter={() => setHoverValue(heartIndex)}
                  onClick={() => handleClick(heartIndex, false)}
                />
              </>
            )}
          </div>
        )
      })}

    </div>
  )
}
