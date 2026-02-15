import { Palette, Check, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useTheme, type OceanTheme } from "./theme-provider";
import { cn } from "../lib/utils";

function ThemeSwatch({
  swatches,
  isActive,
  size = "md",
}: {
  swatches: [string, string, string];
  isActive: boolean;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden border-2 flex-shrink-0",
        dim,
        isActive
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-muted-foreground/50"
      )}
    >
      {/* Background takes full circle */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: swatches[0] }}
      />
      {/* Primary takes right half */}
      <div
        className="absolute inset-y-0 right-0 w-1/2"
        style={{ backgroundColor: swatches[1] }}
      />
      {/* Accent takes bottom-right quarter */}
      <div
        className="absolute bottom-0 right-0 w-1/2 h-1/2"
        style={{ backgroundColor: swatches[2] }}
      />
      {/* Active check overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
          >
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ThemePicker() {
  const { theme, setTheme, themes, density, setDensity } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Customize theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-3">
        <DropdownMenuLabel className="px-0 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Theme
        </DropdownMenuLabel>
        <div className="grid gap-1.5 mt-1.5">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as OceanTheme)}
              className={cn(
                "flex items-center gap-3 w-full rounded-md px-2 py-2 text-left transition-colors",
                theme === t.id
                  ? "bg-secondary text-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <ThemeSwatch
                swatches={t.swatches}
                isActive={theme === t.id}
                size="md"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">
                  {t.label}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {t.description}
                </span>
              </div>
            </button>
          ))}
        </div>

        <DropdownMenuSeparator className="my-2.5" />

        <DropdownMenuLabel className="px-0 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Density
        </DropdownMenuLabel>
        <div className="flex gap-1.5 mt-1.5">
          <button
            onClick={() => setDensity("comfortable")}
            className={cn(
              "flex items-center gap-2 flex-1 rounded-md px-3 py-2 text-sm transition-colors",
              density === "comfortable"
                ? "bg-secondary text-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Comfortable
          </button>
          <button
            onClick={() => setDensity("compact")}
            className={cn(
              "flex items-center gap-2 flex-1 rounded-md px-3 py-2 text-sm transition-colors",
              density === "compact"
                ? "bg-secondary text-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Minimize2 className="h-3.5 w-3.5" />
            Compact
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
