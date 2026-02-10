import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "split-panel-width";

interface SplitPanelProps {
  left: ReactNode;
  right: ReactNode;
  /** Default left panel width as percentage (0-100). Default 40 */
  defaultLeftWidth?: number;
  /** Minimum left panel width in px. Default 250 */
  minLeft?: number;
  /** Minimum right panel width in px. Default 300 */
  minRight?: number;
  /** localStorage key suffix for persisting width */
  storageKey?: string;
  /** Whether the right panel has content to show */
  rightOpen?: boolean;
  /** Placeholder for empty right panel */
  rightPlaceholder?: ReactNode;
}

export function SplitPanel({
  left,
  right,
  defaultLeftWidth = 40,
  minLeft = 250,
  minRight = 300,
  storageKey = "default",
  rightOpen = true,
  rightPlaceholder,
}: SplitPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [collapsed, setCollapsed] = useState(false);

  // Load persisted width or use default
  const [leftPercent, setLeftPercent] = useState(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${storageKey}`);
      if (stored) return Number(stored);
    } catch {}
    return defaultLeftWidth;
  });

  // Persist width changes
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}-${storageKey}`, String(leftPercent));
    } catch {}
  }, [leftPercent, storageKey]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      const x = e.clientX - rect.left;
      const percent = (x / totalWidth) * 100;

      // Enforce min widths
      const minLeftPercent = (minLeft / totalWidth) * 100;
      const maxLeftPercent = 100 - (minRight / totalWidth) * 100;
      const clamped = Math.max(minLeftPercent, Math.min(maxLeftPercent, percent));
      setLeftPercent(clamped);
      if (collapsed) setCollapsed(false);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [minLeft, minRight, collapsed]);

  const handleDoubleClick = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  // Keyboard shortcut: [ to toggle collapse
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "[" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const effectiveLeft = collapsed ? 0 : leftPercent;

  return (
    <>
      {/* Desktop: side-by-side */}
      <div
        ref={containerRef}
        className="hidden md:flex h-[calc(100vh-12rem)] w-full overflow-hidden rounded-lg border border-border"
      >
        {/* Left panel */}
        <motion.div
          animate={{ width: `${effectiveLeft}%` }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="h-full overflow-hidden flex-shrink-0"
          style={{ minWidth: collapsed ? 0 : minLeft }}
        >
          <div className="h-full overflow-auto">{left}</div>
        </motion.div>

        {/* Drag handle */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className="group relative flex-shrink-0 w-1 cursor-col-resize bg-slate-700 hover:bg-slate-500 transition-colors"
          title="Drag to resize • Double-click to collapse • Cmd+[ to toggle"
        >
          {/* Grip dots */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-slate-400" />
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 h-full overflow-auto min-w-0">
          {rightOpen ? (
            right
          ) : (
            rightPlaceholder || (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Select an item to view details
              </div>
            )
          )}
        </div>
      </div>

      {/* Mobile: stacked with slide-over */}
      <div className="md:hidden">
        <div className="min-h-[50vh]">{left}</div>
        <AnimatePresence>
          {rightOpen && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 bg-background overflow-auto"
            >
              {right}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
