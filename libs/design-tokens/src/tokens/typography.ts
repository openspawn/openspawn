/**
 * Typography tokens for OpenSpawn platform.
 */

export const fontFamilies = {
  /** Display/heading font — used for hero text, agent names */
  display: '"Baloo 2", "Fredoka One", cursive',
  /** Body text — reads well at all sizes */
  body: 'Nunito, "DM Sans", system-ui, sans-serif',
  /** Monospace — code, logs, IDs */
  mono: '"JetBrains Mono", "Fira Code", monospace',
} as const;

export const fontWeights = {
  display: 800,
  heading: 700,
  label: 600,
  body: 500,
  normal: 400,
} as const;

export const fontSizes = {
  hero: "clamp(3rem, 8vw, 6rem)",
  title: "clamp(1.75rem, 4vw, 3rem)",
  heading: "1.25rem",
  body: "1rem",
  small: "0.875rem",
  tiny: "0.75rem",
} as const;

export const lineHeights = {
  tight: "1.1",
  heading: "1.25",
  body: "1.6",
  relaxed: "1.75",
} as const;

export const letterSpacings = {
  tight: "-0.02em",
  normal: "0",
  wide: "0.02em",
  wider: "0.05em",
} as const;
