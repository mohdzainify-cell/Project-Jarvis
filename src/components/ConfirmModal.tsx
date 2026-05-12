import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmModal({ title, description, onConfirm, onCancel, danger }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-panel holo-bracket p-8 max-w-sm w-full"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={16} className={danger ? 'text-red-400' : 'text-yellow-400'} />
          <span className="font-mono text-sm text-cyan-300">{title}</span>
        </div>
        <p className="text-cyan-600 font-mono text-xs leading-relaxed mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-cyan-800 text-cyan-700 font-mono text-xs
                       rounded hover:border-cyan-600 hover:text-cyan-500 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 border rounded font-mono text-xs transition-all
              ${danger
                ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                : 'border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10'
              }`}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}