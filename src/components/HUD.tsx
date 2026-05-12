import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useJarvisStore } from '@/store/jarvisStore'
import { useJarvis } from '@/hooks/useJarvis'
import { useVoice } from '@/hooks/useVoice'
import StatusBar from './StatusBar'
import ChatPanel from './ChatPanel'

export default function HUD() {
  const {
    showBriefing,
    setShowBriefing,
    setOnline,
    isListening,
    isSpeaking,
  } = useJarvisStore()

  const { connect } = useJarvis()
  const { speak } = useVoice()

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // 🔊 FAST INIT
  useEffect(() => {
    connect()

    const t = setTimeout(() => {
      setShowBriefing(true)
      requestAnimationFrame(() => {
        speak('Systems online.')
      })
    }, 400)

    return () => clearTimeout(t)
  }, [])

  // 🖥 FULLSCREEN
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // ⌨️ SHORTCUTS
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'f') toggleFullscreen()
      if (e.key === 'm') setIsMinimized((v) => !v)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  const active = isListening || isSpeaking

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at center, #081421 0%, #02060d 100%)',
        fontFamily: 'Share Tech Mono, monospace',
      }}
    >
      {/* CONTROLS */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button onClick={toggleFullscreen} className="hud-btn">
          {isFullscreen ? 'EXIT' : 'FULL'}
        </button>
        <button onClick={() => setIsMinimized(v => !v)} className="hud-btn">
          {isMinimized ? 'OPEN' : 'MIN'}
        </button>
      </div>

      <StatusBar />

      {/* 🧠 MAIN CENTER */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        animate={{
          scale: isMinimized ? 0.35 : 1,
          y: isMinimized ? 220 : 0,
          opacity: isMinimized ? 0.7 : 1,
        }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* 🔵 JARVIS CORE */}
        <JarvisCore active={active} />

        {/* 💬 CHAT BELOW */}
        <div className="mt-10 w-[500px] max-w-[90vw]">
          <ChatPanel />
        </div>
      </motion.div>

      <AnimatePresence>
        {showBriefing && (
          <BriefingPanel onDismiss={() => setShowBriefing(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────
// 🤖 JARVIS CORE (IRON MAN STYLE)
// ─────────────────────────
function JarvisCore({ active }: { active: boolean }) {
  const rot = useRef(0)
  const [, force] = useState(0)

  useEffect(() => {
    let frame: number
    const loop = () => {
      rot.current += active ? 0.02 : 0.008
      force(n => n + 1)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [active])

  const CX = 200
  const CY = 200

  return (
    <div className="relative">
      <svg width={400} height={400}>
        {/* OUTER FAINT RING */}
        <circle cx={CX} cy={CY} r={150}
          stroke="#00d4ff" strokeWidth="1"
          opacity="0.2" fill="none" />

        {/* ROTATING RING */}
        <g transform={`rotate(${rot.current}, ${CX}, ${CY})`}>
          <circle cx={CX} cy={CY} r={120}
            stroke="#00d4ff"
            strokeWidth="2"
            strokeDasharray="12 8"
            fill="none"
            opacity="0.7"
          />
        </g>

        {/* COUNTER ROTATION */}
        <g transform={`rotate(${-rot.current * 1.5}, ${CX}, ${CY})`}>
          <circle cx={CX} cy={CY} r={90}
            stroke="#00d4ff"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            fill="none"
            opacity="0.6"
          />
        </g>

        {/* CORE */}
        <motion.circle
          cx={CX}
          cy={CY}
          r={40}
          fill="#00d4ff"
          animate={{
            scale: active ? [1, 1.3, 1] : 1,
            opacity: active ? [0.6, 1, 0.6] : 0.5,
          }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ filter: 'blur(2px)' }}
        />

        {/* INNER DOT */}
        <circle cx={CX} cy={CY} r={10} fill="#00d4ff" />
      </svg>
    </div>
  )
}

// ─────────────────────────
// 🧠 BRIEFING
// ─────────────────────────
function BriefingPanel({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="p-10 border border-cyan-400/30 bg-[#020d1a] text-center">
        <h2 className="text-cyan-400 text-xl mb-4 tracking-widest">
          JARVIS ONLINE
        </h2>

        <button onClick={onDismiss} className="hud-btn">
          Begin
        </button>
      </div>
    </motion.div>
  )
}