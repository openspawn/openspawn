/**
 * Spacing, border radius, shadow, and layout tokens.
 */

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
  hero: "clamp(3rem, 8vh, 6rem)",
} as const;

export const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  card: "1.25rem",
  pill: "9999px",
  circle: "50%",
} as const;

/** BB-specific radii override (more rounded) */
export const bbRadii = {
  ...radii,
  md: "0.75rem",
  lg: "1rem",
} as const;

export const shadows = {
  sm: "0 2px 8px rgba(6, 42, 69, 0.4)",
  md: "0 4px 16px rgba(6, 42, 69, 0.5), 0 0 0 1px rgba(74, 174, 217, 0.1)",
  lg: "0 8px 32px rgba(6, 42, 69, 0.6), 0 0 0 1px rgba(74, 174, 217, 0.15)",
  card: "0 4px 20px rgba(6, 42, 69, 0.5), 0 1px 4px rgba(244, 197, 66, 0.1)",
} as const;

export const glows = {
  sandy: "0 0 16px rgba(244, 197, 66, 0.5), 0 0 32px rgba(244, 197, 66, 0.25)",
  kelp: "0 0 16px rgba(74, 232, 138, 0.5), 0 0 32px rgba(74, 232, 138, 0.25)",
  coral: "0 0 16px rgba(255, 71, 87, 0.5), 0 0 32px rgba(255, 71, 87, 0.25)",
  ocean: "0 0 16px rgba(74, 174, 217, 0.4), 0 0 32px rgba(74, 174, 217, 0.2)",
} as const;

export const zIndex = {
  ocean: 0,
  kelp: 10,
  bubbles: 20,
  content: 30,
  feed: 40,
  overlay: 50,
  modal: 60,
  toast: 70,
  top: 80,
} as const;
