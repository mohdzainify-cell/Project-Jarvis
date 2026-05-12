import { useEffect, useState } from 'react'
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
    isListening,
    isSpeaking,
  } = useJarvisStore()

  const { connect } = useJarvis()
  const { speak } = useVoice()

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // 🚀 FAST STARTUP
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

      if (e.key === 'm') {
        setIsMinimized(v => !v)
      }
    }

    window.addEventListener('keydown', key)

    return () => window.removeEventListener('keydown', key)
  }, [])

  const active = isListening || isSpeaking

  return (
    <div
      className="
        fixed
        inset-0
        overflow-hidden
        bg-black
        text-cyan-300
      "
      style={{
        background:
          'radial-gradient(circle at center, #07111d 0%, #01050b 100%)',
        fontFamily: 'Share Tech Mono, monospace',
      }}
    >
      {/* GRID BACKGROUND */}
      <div
        className="
          absolute
          inset-0
          opacity-[0.08]
        "
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* TOP CONTROLS */}
      <div className="absolute top-5 right-5 z-50 flex gap-3">
        <button onClick={toggleFullscreen} className="hud-btn">
          {isFullscreen ? 'EXIT' : 'FULL'}
        </button>

        <button
          onClick={() => setIsMinimized(v => !v)}
          className="hud-btn"
        >
          {isMinimized ? 'OPEN' : 'MIN'}
        </button>
      </div>

      {/* STATUS */}
      <StatusBar />

      {/* MAIN CENTER */}
      <motion.div
        className="
          absolute
          inset-0
          flex
          flex-col
          items-center
          justify-center
        "
        animate={{
          scale: isMinimized ? 0.42 : 1,
          y: isMinimized ? 260 : 0,
          opacity: isMinimized ? 0.65 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 120,
          damping: 18,
        }}
      >
        {/* CORE */}
        <JarvisCore active={active} />

        {/* CHAT */}
        <div className="mt-10 w-[560px] max-w-[92vw]">
          <div
            className="
              h-[320px]
              overflow-hidden
              rounded-3xl
              border
              border-cyan-400/20
              bg-black/30
              backdrop-blur-2xl
              shadow-[0_0_50px_rgba(0,212,255,0.08)]
            "
          >
            <ChatPanel />
          </div>
        </div>
      </motion.div>

      {/* BRIEFING */}
      <AnimatePresence>
        {showBriefing && (
          <BriefingPanel
            onDismiss={() => setShowBriefing(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────
// 🤖 JARVIS CORE
// ─────────────────────────────

function JarvisCore({
  active,
}: {
  active: boolean
}) {
  return (
    <div className="relative flex items-center justify-center">
      {/* OUTER GLOW */}
      <div className="absolute w-[420px] h-[420px] rounded-full bg-cyan-400/5 blur-3xl" />

      {/* OUTER RING */}
      <motion.div
        className="
          absolute
          w-[360px]
          h-[360px]
          rounded-full
          border
          border-cyan-400/20
        "
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: active ? 8 : 18,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* DASHED RING */}
      <motion.div
        className="
          absolute
          w-[300px]
          h-[300px]
          rounded-full
          border
          border-dashed
          border-cyan-400/30
        "
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: active ? 6 : 14,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* PULSE RING */}
      <motion.div
        className="
          absolute
          w-[240px]
          h-[240px]
          rounded-full
          border
          border-cyan-300/40
        "
        animate={{
          scale: active ? [1, 1.03, 1] : 1,
          opacity: active ? [0.5, 1, 0.5] : 0.4,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />

      {/* CORE GLOW */}
      <motion.div
        className="
          absolute
          w-[140px]
          h-[140px]
          rounded-full
          bg-cyan-400/20
          blur-2xl
        "
        animate={{
          scale: active
            ? [1, 1.25, 1]
            : [1, 1.08, 1],
        }}
        transition={{
          duration: active ? 1.2 : 2.5,
          repeat: Infinity,
        }}
      />

      {/* MAIN CORE */}
      <motion.div
        className="
          relative
          w-[120px]
          h-[120px]
          rounded-full
          border
          border-cyan-300/60
          bg-black/60
          backdrop-blur-xl
          flex
          items-center
          justify-center
          shadow-[0_0_60px_rgba(0,212,255,0.35)]
        "
        animate={{
          boxShadow: active
            ? [
              '0 0 30px rgba(0,212,255,0.2)',
              '0 0 80px rgba(0,212,255,0.7)',
              '0 0 30px rgba(0,212,255,0.2)',
            ]
            : '0 0 25px rgba(0,212,255,0.2)',
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      >
        {/* INNER RINGS */}
        <div className="absolute inset-3 rounded-full border border-cyan-400/20" />

        <div className="absolute inset-6 rounded-full border border-cyan-400/20" />

        {/* CENTER DOT */}
        <motion.div
          className="w-5 h-5 rounded-full bg-cyan-300"
          animate={{
            scale: active
              ? [1, 1.8, 1]
              : [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      </motion.div>
    </div>
  )
}

// ─────────────────────────────
// 🧠 BRIEFING PANEL
// ─────────────────────────────

function BriefingPanel({
  onDismiss,
}: {
  onDismiss: () => void
}) {
  return (
    <motion.div
      className="
        fixed
        inset-0
        flex
        items-center
        justify-center
        bg-black/70
        backdrop-blur-md
        z-50
      "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{
          scale: 0.8,
          opacity: 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        exit={{
          scale: 0.8,
          opacity: 0,
        }}
        className="
          p-10
          rounded-3xl
          border
          border-cyan-400/20
          bg-[#020d1a]
          text-center
          shadow-[0_0_50px_rgba(0,212,255,0.15)]
        "
      >
        <h2
          className="
            text-cyan-300
            text-2xl
            tracking-[0.3em]
            mb-6
          "
        >
          JARVIS ONLINE
        </h2>

        <button
          onClick={onDismiss}
          className="hud-btn"
        >
          BEGIN
        </button>
      </motion.div>
    </motion.div>
  )
}