/**
 * Density tokens — compact mode overrides.
 */

export const densityDefault = {
  spacingUnit: "1rem",
  spacingXs: "0.25rem",
  spacingSm: "0.5rem",
  spacingMd: "1rem",
  spacingLg: "1.5rem",
  textScale: "1",
} as const;

export const densityCompact = {
  spacingUnit: "0.75rem",
  spacingXs: "0.125rem",
  spacingSm: "0.25rem",
  spacingMd: "0.5rem",
  spacingLg: "1rem",
  textScale: "0.9",
} as const;
