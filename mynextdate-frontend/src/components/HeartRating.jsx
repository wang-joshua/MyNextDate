import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

export default function HeartRating({ rating, onChange, size = 20, readonly = false }) {
  const hearts = [1, 2, 3, 4, 5]

  return (
    <div className="flex gap-1.5">
      {hearts.map((value) => (
        <motion.button
          key={value}
          onClick={() => !readonly && onChange?.(value === rating ? 0 : value)}
          disabled={readonly}
          className={`${!readonly ? 'cursor-pointer' : 'cursor-default'}`}
          whileHover={!readonly ? { scale: 1.3, y: -2 } : {}}
          whileTap={!readonly ? { scale: 0.8 } : {}}
          animate={value <= (rating || 0) ? { scale: [1, 1.25, 1] } : {}}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Heart
            size={size}
            className={`transition-all duration-300 ${
              value <= (rating || 0)
                ? 'fill-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]'
                : 'hover:text-violet-400/40'
            }`}
            style={{
              color: value <= (rating || 0) ? '#c084fc' : '#6b5f7e',
            }}
          />
        </motion.button>
      ))}
    </div>
  )
}
