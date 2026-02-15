import { motion } from 'motion/react';

interface IntroCardProps {
  onStart: () => void;
}

export function IntroCard({ onStart }: IntroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020817]/95 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center max-w-lg px-8"
      >
        <div className="text-8xl mb-6">🍔</div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          OPERATION:<br />
          <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            10,000 KRABBY PATTIES
          </span>
        </h1>
        <p className="text-white/50 text-lg mb-8">
          22 agents. One massive order.<br />
          Watch them coordinate — or collapse.
        </p>
        <button
          onClick={onStart}
          className="px-8 py-3 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-semibold rounded-xl hover:bg-cyan-500/30 hover:border-cyan-500/60 transition-all text-lg cursor-pointer"
        >
          Watch the Story →
        </button>
      </motion.div>
    </motion.div>
  );
}
