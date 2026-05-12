import { motion } from 'framer-motion'
import { useJarvisStore } from '@/store/jarvisStore'

interface Props {
  size?: number
  className?: string
}

export default function ArcReactor({ size = 60, className = '' }: Props) {
  const { isSpeaking, isListening } = useJarvisStore()
  const r = size / 2
  const active = isSpeaking || isListening

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer pulse — reacts to speaking/listening */}
      <motion.div
        className="absolute rounded-full border border-cyan-400/30"
        style={{ width: size * 1.5, height: size * 1.5 }}
        animate={active
          ? { scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }
          : { scale: 1, opacity: 0 }
        }
        transition={{ duration: 0.8, repeat: Infinity }}
      />

      {/* Main ring */}
      <motion.div
        className="absolute rounded-full border border-cyan-400/50 arc-reactor-glow"
        style={{ width: size, height: size }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Rotating outer ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          border: `1px solid transparent`,
          borderTop: `1px solid rgba(0,212,255,${active ? 0.8 : 0.4})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: active ? 1.5 : 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* SVG reactor */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={r} cy={r} r={r - 2} fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.4" />
        <circle cx={r} cy={r} r={r * 0.55} fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.25" />

        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <motion.line
            key={i}
            x1={r} y1={r * 0.42}
            x2={r} y2={r * 0.68}
            stroke="#00d4ff"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ transformOrigin: `${r}px ${r}px`, rotate: `${angle}deg` }}
            animate={{ opacity: active ? [1, 0.3, 1] : [0.6, 0.2, 0.6] }}
            transition={{ duration: active ? 0.4 : 1.5, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}

        {/* Core */}
        <motion.circle
          cx={r} cy={r} r={r * 0.22}
          fill="#00d4ff"
          animate={{ opacity: active ? [0.6, 1, 0.6] : [0.2, 0.4, 0.2] }}
          transition={{ duration: active ? 0.5 : 2, repeat: Infinity }}
        />
        <circle cx={r} cy={r} r={r * 0.1} fill="#00d4ff" opacity="0.9" />
      </svg>
    </div>
  )
}