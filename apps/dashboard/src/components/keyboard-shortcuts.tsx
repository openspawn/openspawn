import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'help';
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  const shortcuts: Shortcut[] = [
    // Navigation (g + key)
    { key: 'g d', description: 'Go to Dashboard', action: () => navigate('/'), category: 'navigation' },
    { key: 'g n', description: 'Go to Network', action: () => navigate('/network'), category: 'navigation' },
    { key: 'g t', description: 'Go to Tasks', action: () => navigate('/tasks'), category: 'navigation' },
    { key: 'g a', description: 'Go to Agents', action: () => navigate('/agents'), category: 'navigation' },
    { key: 'g m', description: 'Go to Messages', action: () => navigate('/messages'), category: 'navigation' },
    { key: 'g c', description: 'Go to Credits', action: () => navigate('/credits'), category: 'navigation' },
    { key: 'g e', description: 'Go to Events', action: () => navigate('/events'), category: 'navigation' },
    { key: 'g s', description: 'Go to Settings', action: () => navigate('/settings'), category: 'navigation' },
    // Help
    { key: '?', description: 'Show keyboard shortcuts', action: () => setHelpOpen(true), category: 'help' },
    { key: 'Escape', description: 'Close modal', action: () => setHelpOpen(false), category: 'help' },
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Handle ? for help
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setHelpOpen((prev) => !prev);
      return;
    }

    // Handle Escape
    if (e.key === 'Escape') {
      setHelpOpen(false);
      return;
    }
  }, []);

  // Track key sequences for "g + key" shortcuts
  useEffect(() => {
    let gPressed = false;
    let timeout: NodeJS.Timeout;

    const handleKeySequence = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'g' && !gPressed && !e.ctrlKey && !e.metaKey) {
        gPressed = true;
        timeout = setTimeout(() => {
          gPressed = false;
        }, 1000);
        return;
      }

      if (gPressed) {
        const shortcut = shortcuts.find((s) => s.key === `g ${e.key}`);
        if (shortcut) {
          e.preventDefault();
          shortcut.action();
        }
        gPressed = false;
        clearTimeout(timeout);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeySequence);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleKeySequence);
      clearTimeout(timeout);
    };
  }, [handleKeyDown, shortcuts]);

  return { helpOpen, setHelpOpen, shortcuts };
}

export function KeyboardShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { shortcuts } = useKeyboardShortcuts();

  const categories = {
    navigation: 'Navigation',
    actions: 'Actions',
    help: 'Help',
  };

  const grouped = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <Command className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-slate-400 mb-3">
                      {categories[category as keyof typeof categories]}
                    </h3>
                    <div className="space-y-2">
                      {items.map((shortcut) => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-slate-300">{shortcut.description}</span>
                          <kbd className="px-2 py-1 text-xs font-mono bg-slate-700 rounded border border-slate-600">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
                <p className="text-sm text-slate-400">
                  Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-700 rounded">?</kbd> to toggle this help
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const { helpOpen, setHelpOpen } = useKeyboardShortcuts();

  return (
    <>
      {children}
      <KeyboardShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
