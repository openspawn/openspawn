import { motion, AnimatePresence } from 'motion/react';

export interface Annotation {
  id: string;
  tick: number;
  duration: number;
  text: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export const ANNOTATIONS: Annotation[] = [
  { id: 'a1', tick: 1,  duration: 4,  text: '🦠 Plankton walks in with the order of a lifetime', position: 'top-left' },
  { id: 'a2', tick: 4,  duration: 4,  text: '🍔 SpongeBob receives the order from Mr. Krabs', position: 'top-left' },
  { id: 'a3', tick: 6,  duration: 3,  text: '📋 Delegating to departments...', position: 'top-left' },
  { id: 'a4', tick: 13, duration: 4,  text: '🚨 SpongeBob escalates — needs more cooks!', position: 'top-left' },
  { id: 'a5', tick: 17, duration: 3,  text: '🧪 Sandy architects the 3-stage pipeline', position: 'top-left' },
  { id: 'a6', tick: 19, duration: 8,  text: '⚡ Sous-chefs spawning — watch the org chart grow!', position: 'bottom-left' },
  { id: 'a7', tick: 27, duration: 4,  text: '🔥 20 sous-chefs online! Production at full speed', position: 'bottom-left' },
  { id: 'a8', tick: 42, duration: 5,  text: '📦 Squidward is overwhelmed — deliveries backing up', position: 'top-right' },
  { id: 'a9', tick: 56, duration: 4,  text: '🐙 Squidward hits breaking point — queue at 2,000+', position: 'top-right' },
  { id: 'a10', tick: 70, duration: 5, text: '🚨 ESCALATION: Squidward → Mr. Krabs — "I can\'t do this alone!"', position: 'top-left' },
  { id: 'a11', tick: 75, duration: 4, text: '🤔 Mr. Krabs evaluates the bottleneck...', position: 'top-left' },
  { id: 'a12', tick: 92,  duration: 5, text: '🔄 Mr. Krabs reorganizes! Pearl & Fred to delivery', position: 'top-left' },
  { id: 'a13', tick: 100, duration: 4, text: '📈 Delivery throughput tripling — queue draining!', position: 'bottom-right' },
  { id: 'a14', tick: 110, duration: 4, text: '🔥 Kitchen back to full speed — pipeline unclogged', position: 'bottom-left' },
  { id: 'a15', tick: 130, duration: 4, text: '🏁 Final stretch — less than 500 patties to go!', position: 'top-right' },
  { id: 'a16', tick: 137, duration: 5, text: '🎉 10,000 KRABBY PATTIES DELIVERED!', position: 'center' },
];

const POSITION_CLASSES: Record<string, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

interface NarrativeAnnotationsProps {
  tick: number;
}

export function NarrativeAnnotations({ tick }: NarrativeAnnotationsProps) {
  const active = ANNOTATIONS.filter(a => tick >= a.tick && tick < a.tick + a.duration);

  return (
    <AnimatePresence>
      {active.map(a => {
        const pos = a.position || 'top-left';
        const isCenter = pos === 'center';

        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: isCenter ? 10 : 0, scale: isCenter ? 0.9 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isCenter ? -10 : 0, scale: isCenter ? 0.9 : 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`absolute z-20 pointer-events-none ${POSITION_CLASSES[pos]}`}
          >
            <div
              className={`
                ${isCenter
                  ? 'px-6 py-3 text-base md:text-lg font-bold bg-cyan-500/20 border-cyan-500/50'
                  : 'px-4 py-2 text-xs md:text-sm font-medium bg-[#0d1117]/90 border-white/10'
                }
                rounded-lg border backdrop-blur-md text-white shadow-lg max-w-xs md:max-w-sm
              `}
            >
              {a.text}
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
