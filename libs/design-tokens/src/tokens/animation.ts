/**
 * Animation tokens — durations, easings, and named animations.
 */

export const durations = {
  fast: "150ms",
  base: "250ms",
  slow: "500ms",
  bob: "2s",
  bubble: "12s",
  kelp: "4s",
  swim: "30s",
} as const;

export const easings = {
  bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  wave: "cubic-bezier(0.45, 0.05, 0.55, 0.95)",
  float: "ease-in-out",
  reveal: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;
