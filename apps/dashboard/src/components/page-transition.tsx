import { useLocation, Outlet } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const variants = reduceMotion
  ? { initial: {}, animate: {}, exit: {} }
  : {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0 },
    };

const transition = reduceMotion
  ? { duration: 0 }
  : { duration: 0.25, ease: [0, 0, 0.2, 1] as [number, number, number, number] };

/**
 * Page transition wrapper — now uses TanStack Router's Outlet.
 * Note: In the new routing setup, transitions are handled in the layout route (routes.tsx).
 * This component is kept for backward compatibility.
 */
export function PageTransition() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
        style={{ willChange: "opacity, transform" }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
