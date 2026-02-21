import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

export default function HeartRating({ rating, onChange, size = 20, readonly = false }) {
  const hearts = [1, 2, 3, 4, 5]

  return (
    <div className="flex gap-1">
      {hearts.map((value) => (
        <motion.button
          key={value}
          onClick={() => !readonly && onChange?.(value === rating ? 0 : value)}
          disabled={readonly}
          className={`${!readonly ? 'cursor-pointer' : 'cursor-default'}`}
          whileHover={!readonly ? { scale: 1.3 } : {}}
          whileTap={!readonly ? { scale: 0.8 } : {}}
          animate={value <= (rating || 0) ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.2 }}
        >
          <Heart
            size={size}
            className={`transition-colors duration-200 ${
              value <= (rating || 0)
                ? 'text-pink-500 fill-pink-500 drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]'
                : 'text-gray-600 hover:text-gray-500'
            }`}
          />
        </motion.button>
      ))}
    </div>
  )
}
