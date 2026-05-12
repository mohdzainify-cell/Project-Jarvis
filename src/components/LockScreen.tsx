import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

interface Props { onAuth: () => void }

export default function LockScreen({ onAuth }: Props) {
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [rot1, setRot1] = useState(0)
  const [rot2, setRot2] = useState(0)
  const [rot3, setRot3] = useState(0)
  const [rot4, setRot4] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 800)
  }, [])

  useEffect(() => {
    let frame: number
    let r1 = 0, r2 = 0, r3 = 0, r4 = 0
    const animate = () => {
      r1 += 0.015
      r2 -= 0.020
      r3 += 0.030
      r4 -= 0.010
      setRot1(r1)
      setRot2(r2)
      setRot3(r3)
      setRot4(r4)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  const handleSubmit = async () => {
    if (!password.trim()) return
    try {
      const res = await fetch('http://localhost:8765/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      // Check if response is ok before parsing
      if (!res.ok) {
        // Server returned error status — let them in on first run
        onAuth()
        return
      }

      const data = await res.json()

      if (data.success) {
        onAuth()
      } else {
        setError('ACCESS DENIED — Invalid credentials, Sir.')
        setShake(true)
        setTimeout(() => {
          setShake(false)
          setPassword('')
          inputRef.current?.focus()
        }, 600)
      }
    } catch {
      // Backend completely unreachable (not started yet)
      // Show error instead of silently letting in
      setError('BACKEND OFFLINE — Start the Python server, Sir.')
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setPassword('')
      }, 600)
    }
  }

  const CX = 350
  const CY = 350
  const W = 700
  const H = 700

  const buildGapArc = (
    cx: number, cy: number, r: number,
    segments: number, gapDeg: number,
    strokeWidth: number, opacity: number
  ) => {
    const paths: JSX.Element[] = []
    const segDeg = 360 / segments
    for (let i = 0; i < segments; i++) {
      const startDeg = i * segDeg
      const endDeg = startDeg + segDeg - gapDeg
      const sRad = ((startDeg - 90) * Math.PI) / 180
      const eRad = ((endDeg - 90) * Math.PI) / 180
      const x1 = cx + r * Math.cos(sRad)
      const y1 = cy + r * Math.sin(sRad)
      const x2 = cx + r * Math.cos(eRad)
      const y2 = cy + r * Math.sin(eRad)
      const large = endDeg - startDeg > 180 ? 1 : 0
      paths.push(
        <path
          key={i}
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
          fill="none"
          stroke="#00d4ff"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={opacity}
        />
      )
    }
    return paths
  }

  const buildTicks = (
    cx: number, cy: number, r: number,
    count: number, len: number, every: number,
    strokeWidth: number, opacity: number
  ) => {
    const lines: JSX.Element[] = []
    for (let i = 0; i < count; i++) {
      if (i % every !== 0) continue
      const angle = ((i / count) * 360 - 90) * Math.PI / 180
      const x1 = cx + r * Math.cos(angle)
      const y1 = cy + r * Math.sin(angle)
      const x2 = cx + (r + len) * Math.cos(angle)
      const y2 = cy + (r + len) * Math.sin(angle)
      lines.push(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#00d4ff" strokeWidth={strokeWidth} opacity={opacity} />
      )
    }
    return lines
  }

  const buildBinaryRing = (
    cx: number, cy: number, r: number, count: number
  ) => {
    const texts: JSX.Element[] = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 360
      const rad = ((angle - 90) * Math.PI) / 180
      const x = cx + r * Math.cos(rad)
      const y = cy + r * Math.sin(rad)
      texts.push(
        <text
          key={i}
          x={x} y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#00d4ff"
          fontSize="7"
          opacity="0.4"
          fontFamily="monospace"
          transform={`rotate(${angle}, ${x}, ${y})`}
        >
          {i % 4 === 0 ? '1' : '0'}
        </text>
      )
    }
    return texts
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #0d1f35 0%, #050e1c 55%, #020810 100%)'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.25), transparent)'
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      />

      {/* Main HUD SVG */}
      <div style={{ width: W, height: H, flexShrink: 0 }}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background glow */}
          <circle cx={CX} cy={CY} r={160} fill="url(#bgGlow)" />

          {/* Ring 1 — outermost gap ring */}
          <g transform={`rotate(${rot1}, ${CX}, ${CY})`}>
            {buildGapArc(CX, CY, 320, 6, 10, 2.5, 0.65)}
            {buildGapArc(CX, CY, 320, 24, 18, 1, 0.3)}
          </g>

          {/* Ring 2 — tick ring */}
          <g transform={`rotate(${rot2}, ${CX}, ${CY})`}>
            <circle cx={CX} cy={CY} r={270} fill="none"
              stroke="#00d4ff" strokeWidth="0.5" opacity="0.15" />
            {buildTicks(CX, CY, 264, 180, 5, 1, 0.7, 0.35)}
            {buildTicks(CX, CY, 258, 36, 12, 1, 1.5, 0.6)}
          </g>

          {/* Ring 3 — binary ring */}
          <g transform={`rotate(${rot3}, ${CX}, ${CY})`}>
            {buildGapArc(CX, CY, 218, 10, 6, 2, 0.6)}
            {buildBinaryRing(CX, CY, 238, 28)}
          </g>

          {/* Ring 4 — accent ring */}
          <g transform={`rotate(${rot4}, ${CX}, ${CY})`}>
            <circle cx={CX} cy={CY} r={185} fill="none"
              stroke="#00d4ff" strokeWidth="0.5" opacity="0.12" />
            {buildTicks(CX, CY, 180, 72, 7, 1, 0.8, 0.3)}
            {[0, 90, 180, 270].map(a => {
              const rad = ((a - 90) * Math.PI) / 180
              const x1 = CX + 172 * Math.cos(rad)
              const y1 = CY + 172 * Math.sin(rad)
              const x2 = CX + 200 * Math.cos(rad)
              const y2 = CY + 200 * Math.sin(rad)
              return (
                <line key={a} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#00d4ff" strokeWidth="4"
                  strokeLinecap="round" opacity="0.9"
                  filter="url(#glow)"
                />
              )
            })}
          </g>

          {/* Ring 5 — inner bright ring */}
          <circle
            cx={CX} cy={CY} r={145}
            fill="none" stroke="#00d4ff"
            strokeWidth="1.5" opacity="0.85"
            filter="url(#strongGlow)"
          />
          <path
            d={`M ${CX + 145 * Math.cos((-120 - 90) * Math.PI / 180)} ${CY + 145 * Math.sin((-120 - 90) * Math.PI / 180)} A 145 145 0 0 1 ${CX + 145 * Math.cos((-30 - 90) * Math.PI / 180)} ${CY + 145 * Math.sin((-30 - 90) * Math.PI / 180)}`}
            fill="none" stroke="#00d4ff"
            strokeWidth="5" strokeLinecap="round"
            opacity="1" filter="url(#strongGlow)"
          />

          {/* Innermost ring */}
          <circle cx={CX} cy={CY} r={118}
            fill="none" stroke="#00d4ff"
            strokeWidth="0.5" opacity="0.2" />

          {/* JARVIS text — dead center */}
          <text
            x={CX} y={CY - 10}
            textAnchor="middle"
            fill="#00d4ff"
            fontSize="24"
            fontFamily="Orbitron, monospace"
            fontWeight="600"
            letterSpacing="8"
            filter="url(#strongGlow)"
            opacity="0.95"
          >
            J.A.R.V.I.S
          </text>
          <text
            x={CX} y={CY + 14}
            textAnchor="middle"
            fill="#00d4ff"
            fontSize="6.5"
            fontFamily="Share Tech Mono, monospace"
            letterSpacing="4"
            opacity="0.35"
          >
            SECURE ACCESS REQUIRED
          </text>
        </svg>
      </div>

      {/* Password — fixed bottom center */}
      <motion.div
        className={`fixed left-1/2 flex flex-col items-center gap-3 ${shake ? 'animate-shake' : ''}`}
        style={{
          bottom: 40,
          transform: 'translateX(-50%)',
          width: 300,
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <AnimatePresence>
          {error && (
            <motion.p
              className="font-mono text-xs tracking-widest text-center w-full"
              style={{ color: error.includes('OFFLINE') ? '#facc15' : '#f87171' }}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="relative w-full">
          <input
            ref={inputRef}
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter passphrase..."
            className="jarvis-input w-full px-4 py-3 pr-10 rounded text-sm tracking-widest"
          />
          <button
            onClick={() => setShowPass(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-700 hover:text-cyan-400 transition-colors"
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {/* Authenticate */}
        <button
          onClick={handleSubmit}
          style={{ background: 'rgba(0,212,255,0.04)' }}
          className="w-full py-2.5 border border-cyan-400/30 rounded font-mono text-xs
                     text-cyan-400 tracking-[0.3em] hover:border-cyan-400
                     transition-all uppercase"
        >
          Authenticate
        </button>

        <p style={{
          fontSize: 9,
          color: 'rgba(0,212,255,0.2)',
          fontFamily: 'Share Tech Mono',
          letterSpacing: 3
        }}>
          STARK INDUSTRIES — PROPRIETARY SYSTEM
        </p>
      </motion.div>
    </motion.div>
  )
}