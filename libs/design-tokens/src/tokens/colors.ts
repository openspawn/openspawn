/**
 * Color tokens for OpenSpawn platform.
 *
 * Semantic colors use HSL components (h s% l%) for compatibility with
 * Tailwind CSS opacity modifiers via hsl(var(--color) / <alpha>).
 */

// ─── OpenSpawn Semantic Colors (HSL components) ─────────────────────────────
// These map to shadcn-style --variable names and are consumed by both themes.

export interface SemanticColorSet {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  success: string;
  "success-foreground": string;
  warning: string;
  "warning-foreground": string;
  info: string;
  "info-foreground": string;
  special: string;
  "special-foreground": string;
  border: string;
  input: string;
  ring: string;
}

/** Light mode (default :root) */
export const lightColors: SemanticColorSet = {
  background: "0 0% 100%",
  foreground: "240 10% 3.9%",
  card: "0 0% 100%",
  "card-foreground": "240 10% 3.9%",
  popover: "0 0% 100%",
  "popover-foreground": "240 10% 3.9%",
  primary: "240 5.9% 10%",
  "primary-foreground": "0 0% 98%",
  secondary: "240 4.8% 95.9%",
  "secondary-foreground": "240 5.9% 10%",
  muted: "240 4.8% 95.9%",
  "muted-foreground": "240 3.8% 46.1%",
  accent: "240 4.8% 95.9%",
  "accent-foreground": "240 5.9% 10%",
  destructive: "350 89% 60%",
  "destructive-foreground": "0 0% 98%",
  success: "160 84% 39%",
  "success-foreground": "0 0% 100%",
  warning: "38 92% 50%",
  "warning-foreground": "38 92% 10%",
  info: "192 91% 36%",
  "info-foreground": "0 0% 100%",
  special: "258 90% 66%",
  "special-foreground": "0 0% 100%",
  border: "240 5.9% 90%",
  input: "240 5.9% 90%",
  ring: "240 5.9% 10%",
};

// ─── OpenSpawn Named Themes ─────────────────────────────────────────────────

export const deepOceanColors: SemanticColorSet = {
  background: "220 35% 8%",
  foreground: "180 30% 95%",
  card: "220 30% 10%",
  "card-foreground": "180 25% 95%",
  popover: "220 30% 12%",
  "popover-foreground": "180 25% 95%",
  primary: "185 85% 60%",
  "primary-foreground": "220 35% 10%",
  secondary: "200 40% 20%",
  "secondary-foreground": "180 30% 95%",
  muted: "210 30% 18%",
  "muted-foreground": "200 15% 60%",
  accent: "190 90% 55%",
  "accent-foreground": "220 35% 10%",
  success: "160 84% 39%",
  "success-foreground": "160 84% 95%",
  warning: "38 92% 50%",
  "warning-foreground": "38 20% 10%",
  destructive: "350 89% 60%",
  "destructive-foreground": "0 0% 98%",
  info: "185 85% 60%",
  "info-foreground": "220 35% 10%",
  special: "258 90% 66%",
  "special-foreground": "258 90% 95%",
  border: "210 25% 22%",
  input: "210 25% 22%",
  ring: "185 85% 60%",
};

export const coralReefColors: SemanticColorSet = {
  background: "15 30% 8%",
  foreground: "30 30% 93%",
  card: "15 25% 11%",
  "card-foreground": "30 25% 93%",
  popover: "15 25% 13%",
  "popover-foreground": "30 25% 93%",
  primary: "16 85% 62%",
  "primary-foreground": "15 30% 8%",
  secondary: "20 35% 20%",
  "secondary-foreground": "30 30% 93%",
  muted: "18 25% 18%",
  "muted-foreground": "20 15% 55%",
  accent: "28 90% 55%",
  "accent-foreground": "15 30% 8%",
  success: "155 70% 40%",
  "success-foreground": "155 70% 95%",
  warning: "45 90% 52%",
  "warning-foreground": "45 20% 10%",
  destructive: "0 75% 55%",
  "destructive-foreground": "0 0% 98%",
  info: "16 85% 62%",
  "info-foreground": "15 30% 8%",
  special: "320 70% 60%",
  "special-foreground": "320 70% 95%",
  border: "18 20% 22%",
  input: "18 20% 22%",
  ring: "16 85% 62%",
};

export const arcticIceColors: SemanticColorSet = {
  background: "205 30% 97%",
  foreground: "215 25% 12%",
  card: "205 25% 100%",
  "card-foreground": "215 25% 12%",
  popover: "205 25% 100%",
  "popover-foreground": "215 25% 12%",
  primary: "205 80% 45%",
  "primary-foreground": "0 0% 100%",
  secondary: "205 25% 92%",
  "secondary-foreground": "215 25% 15%",
  muted: "210 20% 94%",
  "muted-foreground": "215 15% 45%",
  accent: "195 85% 42%",
  "accent-foreground": "0 0% 100%",
  success: "160 84% 39%",
  "success-foreground": "0 0% 100%",
  warning: "38 92% 50%",
  "warning-foreground": "38 92% 10%",
  destructive: "350 89% 55%",
  "destructive-foreground": "0 0% 98%",
  info: "205 80% 45%",
  "info-foreground": "0 0% 100%",
  special: "258 70% 58%",
  "special-foreground": "0 0% 100%",
  border: "210 20% 88%",
  input: "210 20% 88%",
  ring: "205 80% 45%",
};

export const bioluminescentColors: SemanticColorSet = {
  background: "220 30% 5%",
  foreground: "165 50% 95%",
  card: "220 25% 7%",
  "card-foreground": "165 40% 95%",
  popover: "220 25% 9%",
  "popover-foreground": "165 40% 95%",
  primary: "170 100% 50%",
  "primary-foreground": "220 30% 5%",
  secondary: "195 50% 15%",
  "secondary-foreground": "165 50% 95%",
  muted: "210 25% 13%",
  "muted-foreground": "180 20% 55%",
  accent: "150 100% 50%",
  "accent-foreground": "220 30% 5%",
  success: "150 100% 45%",
  "success-foreground": "150 100% 95%",
  warning: "55 100% 50%",
  "warning-foreground": "55 20% 10%",
  destructive: "340 100% 55%",
  "destructive-foreground": "0 0% 98%",
  info: "170 100% 50%",
  "info-foreground": "220 30% 5%",
  special: "280 100% 65%",
  "special-foreground": "280 100% 95%",
  border: "200 30% 18%",
  input: "200 30% 18%",
  ring: "170 100% 50%",
};

export const midnightAbyssColors: SemanticColorSet = {
  background: "0 0% 0%",
  foreground: "220 10% 85%",
  card: "220 10% 4%",
  "card-foreground": "220 10% 85%",
  popover: "220 10% 6%",
  "popover-foreground": "220 10% 85%",
  primary: "210 50% 55%",
  "primary-foreground": "0 0% 0%",
  secondary: "220 15% 12%",
  "secondary-foreground": "220 10% 85%",
  muted: "220 10% 10%",
  "muted-foreground": "220 8% 45%",
  accent: "210 40% 50%",
  "accent-foreground": "0 0% 0%",
  success: "160 60% 40%",
  "success-foreground": "160 60% 95%",
  warning: "38 70% 50%",
  "warning-foreground": "38 20% 10%",
  destructive: "350 70% 50%",
  "destructive-foreground": "0 0% 98%",
  info: "210 50% 55%",
  "info-foreground": "0 0% 0%",
  special: "258 60% 58%",
  "special-foreground": "258 60% 95%",
  border: "220 10% 14%",
  input: "220 10% 14%",
  ring: "210 50% 55%",
};

/** All OpenSpawn themes keyed by selector */
export const openspawnThemes: Record<string, SemanticColorSet> = {
  ":root": lightColors,
  ".dark, [data-theme=\"deep-ocean\"]": deepOceanColors,
  "[data-theme=\"coral-reef\"]": coralReefColors,
  "[data-theme=\"arctic-ice\"]": arcticIceColors,
  "[data-theme=\"bioluminescent\"]": bioluminescentColors,
  "[data-theme=\"midnight-abyss\"]": midnightAbyssColors,
};

// ─── BikiniBottom Color Palette (hex) ───────────────────────────────────────

export const bbColors = {
  sandy: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#F4C542",
    500: "#EAB308",
    600: "#D4952A",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
    DEFAULT: "#F4C542",
  },
  ocean: {
    abyss: "#030E1A",
    50: "#E8F8FF",
    100: "#D6F0FA",
    200: "#B8E4F7",
    300: "#7EC8E8",
    400: "#4AAED9",
    500: "#2E97D1",
    600: "#1A7DB5",
    700: "#0B5E8A",
    800: "#0B3D60",
    900: "#062A45",
    DEFAULT: "#0B5E8A",
  },
  coral: {
    100: "#FFD9D9",
    200: "#FFB3B3",
    300: "#FF8E8E",
    400: "#FF6B6B",
    500: "#FF4757",
    700: "#B91C1C",
    900: "#7F1D1D",
    DEFAULT: "#FF6B6B",
  },
  kelp: {
    100: "#D1FAE5",
    200: "#A7F3C8",
    300: "#6EF2A4",
    400: "#4AE88A",
    500: "#2ECC71",
    600: "#1A8A4A",
    700: "#065F46",
    900: "#064E3B",
    DEFAULT: "#2ECC71",
  },
  // Character accent colors
  character: {
    krabby: "#C0392B",
    pineapple: "#FFD43B",
    squid: "#9B59B6",
    pearl: "#FF85C2",
    dutchman: "#76D7C4",
    sandyCheeks: "#16A085",
    plankton: "#1E8449",
    patrick: "#F1948A",
  },
} as const;

/** BikiniBottom semantic theme (overrides shadcn vars) */
export const bbSemanticColors: SemanticColorSet = {
  background: "210 90% 8%",
  foreground: "197 62% 93%",
  card: "210 85% 12%",
  "card-foreground": "197 62% 93%",
  popover: "210 85% 14%",
  "popover-foreground": "197 62% 93%",
  primary: "44 89% 61%",
  "primary-foreground": "210 90% 8%",
  secondary: "199 65% 28%",
  "secondary-foreground": "197 62% 93%",
  muted: "210 75% 18%",
  "muted-foreground": "199 55% 55%",
  accent: "149 62% 49%",
  "accent-foreground": "210 90% 8%",
  destructive: "355 100% 65%",
  "destructive-foreground": "0 0% 98%",
  success: "150 70% 49%",
  "success-foreground": "150 70% 10%",
  warning: "44 89% 61%",
  "warning-foreground": "44 20% 10%",
  info: "44 89% 61%",
  "info-foreground": "210 90% 8%",
  special: "44 89% 61%",
  "special-foreground": "210 90% 8%",
  border: "199 60% 28%",
  input: "199 60% 28%",
  ring: "44 89% 61%",
};
