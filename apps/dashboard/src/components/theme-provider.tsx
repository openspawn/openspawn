import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// Named ocean themes
export const THEME_NAMES = [
  "deep-ocean",
  "coral-reef",
  "arctic-ice",
  "bioluminescent",
  "midnight-abyss",
] as const;

export type OceanTheme = (typeof THEME_NAMES)[number];

export type Density = "comfortable" | "compact";

export interface ThemeDefinition {
  id: OceanTheme;
  label: string;
  description: string;
  isDark: boolean;
  /** Preview swatch colors [background, primary, accent] */
  swatches: [string, string, string];
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "deep-ocean",
    label: "Deep Ocean",
    description: "Dark navy + cyan",
    isDark: true,
    swatches: ["hsl(220,35%,8%)", "hsl(185,85%,60%)", "hsl(190,90%,55%)"],
  },
  {
    id: "coral-reef",
    label: "Coral Reef",
    description: "Warm dark tones",
    isDark: true,
    swatches: ["hsl(15,30%,8%)", "hsl(16,85%,62%)", "hsl(28,90%,55%)"],
  },
  {
    id: "arctic-ice",
    label: "Arctic Ice",
    description: "Clean light blue",
    isDark: false,
    swatches: ["hsl(205,30%,97%)", "hsl(205,80%,45%)", "hsl(195,85%,42%)"],
  },
  {
    id: "bioluminescent",
    label: "Bioluminescent",
    description: "High contrast neon",
    isDark: true,
    swatches: ["hsl(220,30%,5%)", "hsl(170,100%,50%)", "hsl(150,100%,50%)"],
  },
  {
    id: "midnight-abyss",
    label: "Midnight Abyss",
    description: "OLED pure black",
    isDark: true,
    swatches: ["hsl(0,0%,0%)", "hsl(210,50%,55%)", "hsl(210,40%,50%)"],
  },
];

const THEME_STORAGE_KEY = "bb-theme";
const DENSITY_STORAGE_KEY = "bb-density";

// Keep backward compat: also store in old key so existing code doesn't break
const LEGACY_STORAGE_KEY = "openspawn-theme";

interface ThemeContextType {
  /** Current named theme */
  theme: OceanTheme;
  setTheme: (theme: OceanTheme) => void;
  /** Resolved light/dark for components that need a binary answer */
  resolvedTheme: "dark" | "light";
  /** All available themes */
  themes: ThemeDefinition[];
  /** Density setting */
  density: Density;
  setDensity: (density: Density) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function isValidTheme(value: string | null): value is OceanTheme {
  return THEME_NAMES.includes(value as OceanTheme);
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: OceanTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "deep-ocean",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<OceanTheme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidTheme(stored)) return stored;
    // Migrate from old key
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === "light") return "arctic-ice";
    return defaultTheme;
  });

  const [density, setDensityState] = useState<Density>(() => {
    if (typeof window === "undefined") return "comfortable";
    const stored = localStorage.getItem(DENSITY_STORAGE_KEY);
    return stored === "compact" ? "compact" : "comfortable";
  });

  const resolvedTheme =
    THEMES.find((t) => t.id === theme)?.isDark === false ? "light" : "dark";

  const setTheme = useCallback(
    (newTheme: OceanTheme) => {
      // Trigger transition class
      const root = document.documentElement;
      root.classList.add("theme-transitioning");

      setThemeState(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);

      // Legacy compat
      const def = THEMES.find((t) => t.id === newTheme);
      localStorage.setItem(
        LEGACY_STORAGE_KEY,
        def?.isDark === false ? "light" : "dark"
      );

      // Remove transition class after animation
      setTimeout(() => root.classList.remove("theme-transitioning"), 250);
    },
    []
  );

  const setDensity = useCallback((newDensity: Density) => {
    setDensityState(newDensity);
    localStorage.setItem(DENSITY_STORAGE_KEY, newDensity);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    const def = THEMES.find((t) => t.id === theme);
    const isDark = def?.isDark !== false;

    // Set data-theme attribute
    root.setAttribute("data-theme", theme);

    // Keep light/dark class for Tailwind dark mode
    root.classList.remove("light", "dark");
    root.classList.add(isDark ? "dark" : "light");
  }, [theme]);

  // Apply density to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("density-compact");
    if (density === "compact") {
      root.classList.add("density-compact");
    }
  }, [density]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        themes: THEMES,
        density,
        setDensity,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
