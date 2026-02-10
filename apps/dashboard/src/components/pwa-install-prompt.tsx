import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user recently dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (Date.now() - ts < DISMISS_DURATION_MS) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50"
        >
          <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-cyan-950/95 backdrop-blur-lg shadow-2xl shadow-cyan-500/10">
            {/* Decorative wave accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400" />

            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
                  <span className="text-lg">🌊</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-cyan-50">
                    Install BikiniBottom
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                    Add to your home screen for the full ocean experience
                  </p>
                </div>

                <button
                  onClick={handleDismiss}
                  className="shrink-0 rounded-md p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
                  aria-label="Dismiss install prompt"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" />
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
