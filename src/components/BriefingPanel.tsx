import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArcReactor from './ArcReactor';
import type { BriefingData } from '@/types';

interface Props { onDismiss: () => void; }

export default function BriefingPanel({ onDismiss }: Props) {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);

  useEffect(() => {
    fetch('http://localhost:8765/briefing')
      .then(r => r.json())
      .then(setBriefing)
      .catch(() => setBriefing({
        greeting: 'Good day, Sir.',
        time: new Date().toLocaleString(),
        battery: { level: 100, charging: true },
        message: 'All systems are operational.',
      }));
  }, []);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-panel holo-bracket p-10 max-w-md w-full text-center"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', damping: 20 }}
      >
        <ArcReactor size={64} className="mx-auto mb-6" />

        {briefing ? (
          <>
            <h2 className="holo-text font-display text-xl mb-2">{briefing.greeting}</h2>
            <p className="text-cyan-600 font-mono text-xs mb-6 tracking-widest">{briefing.time}</p>
            <p className="text-cyan-300 font-mono text-sm leading-relaxed mb-8">{briefing.message}</p>
            <div className="flex justify-center gap-4 text-cyan-700 font-mono text-xs">
              <span>Battery: {briefing.battery.level}%</span>
              {briefing.battery.charging && <span>⚡ Charging</span>}
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <button
          onClick={onDismiss}
          className="mt-8 px-8 py-2.5 border border-cyan-400/40 rounded font-mono text-sm
                     text-cyan-400 tracking-widest hover:bg-cyan-400/10 hover:border-cyan-400
                     transition-all uppercase"
        >
          Begin
        </button>
      </motion.div>
    </motion.div>
  );
}