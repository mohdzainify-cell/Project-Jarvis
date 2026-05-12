import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Battery, BatteryCharging, Wifi, WifiOff, Minimize2, Maximize2, X } from 'lucide-react'
import { useJarvisStore } from '@/store/jarvisStore'
import { useBattery } from '@/hooks/useBattery'

export default function StatusBar() {
  useBattery()

  const { battery, activeModel, online, focusMode, toggleFocusMode } = useJarvisStore()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  const batteryColor =
    battery.level > 50 ? 'text-cyan-400' :
    battery.level > 20 ? 'text-yellow-400' :
    'text-red-400'

  const handleMinimize = () => window.jarvis?.minimize()
  const handleMaximize = () => window.jarvis?.maximize()
  const handleClose    = () => window.jarvis?.close()

  return (
    <div
      className="flex items-center justify-between px-4 py-2 border-b border-cyan-400/10 bg-black/30 backdrop-blur-sm select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="text-cyan-400 font-display text-xs tracking-[0.3em]">JARVIS</span>
        {activeModel && (
          <motion.div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-cyan-400/20 bg-cyan-400/5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="text-cyan-600 font-mono text-xs">{activeModel.provider}</span>
            <span className="text-cyan-800 font-mono text-xs">•</span>
            <span className="text-cyan-500 font-mono text-xs">{activeModel.model}</span>
          </motion.div>
        )}
      </div>

      {/* Center */}
      <div className="flex items-center gap-3 text-cyan-500 font-mono text-xs">
        <span>{dateStr}</span>
        <span className="text-cyan-300">{timeStr}</span>
      </div>

      {/* Right */}
      <div
        className="flex items-center gap-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {online
          ? <Wifi size={12} className="text-cyan-600" />
          : <WifiOff size={12} className="text-red-400 animate-pulse" />
        }

        <div className={`flex items-center gap-1 font-mono text-xs ${batteryColor}`}>
          {battery.charging
            ? <BatteryCharging size={12} />
            : <Battery size={12} />
          }
          <span>{battery.level}%</span>
        </div>

        <button
          onClick={toggleFocusMode}
          className={`font-mono text-xs px-2 py-0.5 rounded border transition-all
            ${focusMode
              ? 'border-cyan-400 text-cyan-300 bg-cyan-400/10'
              : 'border-cyan-800 text-cyan-700 hover:border-cyan-600'
            }`}
        >
          FOCUS
        </button>

        <button onClick={handleMinimize} className="text-cyan-700 hover:text-cyan-400 transition-colors">
          <Minimize2 size={12} />
        </button>
        <button onClick={handleMaximize} className="text-cyan-700 hover:text-cyan-400 transition-colors">
          <Maximize2 size={12} />
        </button>
        <button onClick={handleClose} className="text-cyan-700 hover:text-red-400 transition-colors">
          <X size={12} />
        </button>
      </div>
    </div>
  )
}