import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LockScreen from './components/LockScreen'
import HUD from './components/HUD'
import { useJarvisStore } from './store/jarvisStore'
import './styles/globals.css'

type Phase = 'boot' | 'lock' | 'hud'

export default function App() {
  const { authenticated, setAuthenticated } = useJarvisStore()
  const [phase, setPhase] = useState<Phase>('boot')

  useEffect(() => {
    const t = setTimeout(() => setPhase('lock'), 3200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (authenticated) setPhase('hud')
  }, [authenticated])

  return (
    <div className="jarvis-root">
      {/* Background arc rings — always visible */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[400, 600, 800, 1000, 1200].map((size, i) => (
          <div
            key={i}
            className="arc-ring absolute"
            style={{ width: size, height: size, opacity: 0.04 + i * 0.01 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'boot' && <BootSequence key="boot" />}
        {phase === 'lock' && (
          <LockScreen key="lock" onAuth={() => setAuthenticated(true)} />
        )}
        {phase === 'hud' && <HUD key="hud" />}
      </AnimatePresence>
    </div>
  )
}

function BootSequence() {
  const [line, setLine] = useState(0)
  const bootLines = [
    'INITIALISING CORE SYSTEMS...',
    'LOADING AI NEURAL INTERFACE...',
    'CALIBRATING HOLOGRAPHIC ARRAY...',
    'ESTABLISHING SECURE CONNECTION...',
    'ALL SYSTEMS ONLINE.',
  ]

  useEffect(() => {
    const id = setInterval(() => {
      setLine(l => {
        if (l >= bootLines.length - 1) { clearInterval(id); return l; }
        return l + 1
      })
    }, 500)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
    >
      {/* Scanning line */}
      <motion.div
        className="scan-line"
        animate={{ top: ['5%', '95%', '5%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Central arc reactor */}
      <div className="relative flex items-center justify-center mb-10">
        {/* Outer pulse rings */}
        {[120, 100, 80].map((size, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-cyan-400/20"
            style={{ width: size, height: size }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
          />
        ))}

        {/* Main reactor ring */}
        <motion.div
          className="w-20 h-20 rounded-full border-2 border-cyan-400 arc-reactor-glow"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{
            background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Inner core */}
        <motion.div
          className="absolute w-6 h-6 rounded-full bg-cyan-400"
          style={{ boxShadow: '0 0 20px #00d4ff, 0 0 40px rgba(0,212,255,0.5)' }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Rotating dashes */}
        <motion.div
          className="absolute w-28 h-28 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          style={{
            border: '1px dashed rgba(0,212,255,0.3)',
          }}
        />
      </div>

      {/* JARVIS title */}
      <motion.h1
        className="holo-text text-4xl tracking-[0.5em] uppercase mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        J.A.R.V.I.S.
      </motion.h1>

      <motion.p
        className="text-cyan-600 font-mono text-xs tracking-[0.3em] mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        JUST A RATHER VERY INTELLIGENT SYSTEM
      </motion.p>

      {/* Boot log */}
      <div className="flex flex-col items-center gap-1">
        {bootLines.slice(0, line + 1).map((l, i) => (
          <motion.p
            key={i}
            className="font-mono text-xs tracking-widest"
            style={{ color: i === line ? '#00d4ff' : 'rgba(0,212,255,0.35)' }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {i === line ? '▶ ' : '✓ '}{l}
          </motion.p>
        ))}
      </div>
    </motion.div>
  )
}