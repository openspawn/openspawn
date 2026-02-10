import { motion } from "framer-motion";
import type { ReactNode, ComponentProps } from "react";

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface StaggerContainerProps extends ComponentProps<typeof motion.div> {
  children: ReactNode;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.04,
  ...rest
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduceMotion ? 0 : staggerDelay,
          },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends ComponentProps<typeof motion.div> {
  children: ReactNode;
}

const itemVariants = reduceMotion
  ? { hidden: {}, visible: {} }
  : {
      hidden: { opacity: 0, y: 8 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.25, ease: [0, 0, 0.2, 1] },
      },
    };

export function StaggerItem({ children, ...rest }: StaggerItemProps) {
  return (
    <motion.div variants={itemVariants} {...rest}>
      {children}
    </motion.div>
  );
}
