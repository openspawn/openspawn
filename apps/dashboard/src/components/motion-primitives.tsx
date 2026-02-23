/**
 * Reusable micro-interaction primitives built on framer-motion.
 */
import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef, type ReactNode } from "react";
import { cn } from "../lib/utils";

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Hover-lift card ── */

interface HoverCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
}

export const HoverLiftCard = forwardRef<HTMLDivElement, HoverCardProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={reduceMotion ? {} : { scale: 1.02, y: -2 }}
      whileTap={reduceMotion ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "transition-shadow duration-200 hover:shadow-lg hover:shadow-cyan-500/5",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  ),
);
HoverLiftCard.displayName = "HoverLiftCard";

/* ── Press button ── */

interface PressButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  className?: string;
}

export const PressButton = forwardRef<HTMLButtonElement, PressButtonProps>(
  ({ children, className, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={reduceMotion ? {} : { scale: 1.03 }}
      whileTap={reduceMotion ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  ),
);
PressButton.displayName = "PressButton";

/* ── Slide-in list item ── */

interface SlideInItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  index?: number;
  className?: string;
}

export const SlideInItem = forwardRef<HTMLDivElement, SlideInItemProps>(
  ({ children, index = 0, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={reduceMotion ? {} : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? {} : { opacity: 0, x: 20 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 400, damping: 30, delay: index * 0.04 }
      }
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  ),
);
SlideInItem.displayName = "SlideInItem";

/* ── Fade-scale entrance ── */

interface FadeScaleProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
}

export const FadeScale = forwardRef<HTMLDivElement, FadeScaleProps>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={reduceMotion ? {} : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduceMotion ? {} : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  ),
);
FadeScale.displayName = "FadeScale";
