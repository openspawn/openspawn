import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600/95 to-orange-600/95 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          <WifiOff className="h-4 w-4" />
          <span>You're offline — some features may be unavailable</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
