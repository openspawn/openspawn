import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Eye, Network, Check, ChevronDown, Info } from "lucide-react";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// Import the enum from generated types
import { AgentMode } from "../graphql/generated/graphql";

interface AgentModeSelectorProps {
  value: AgentMode;
  onChange?: (mode: AgentMode) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

// Mode configuration with icons, colors, and descriptions
const MODE_CONFIG: Record<
  AgentMode,
  {
    label: string;
    icon: typeof Briefcase;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    shortDescription: string;
    allowedActions: string[];
  }
> = {
  [AgentMode.Worker]: {
    label: "Worker",
    icon: Briefcase,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    description:
      "Full operational access. Can execute tasks, spawn agents, and perform all actions.",
    shortDescription: "Can do everything",
    allowedActions: ["Execute tasks", "Spawn agents", "Send messages", "All actions"],
  },
  [AgentMode.Orchestrator]: {
    label: "Orchestrator",
    icon: Network,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    description:
      "Coordination only. Can spawn agents, assign tasks, and message, but cannot execute work directly.",
    shortDescription: "Coordinate only",
    allowedActions: ["Spawn agents", "Assign tasks", "Send messages", "Approve/Reject"],
  },
  [AgentMode.Observer]: {
    label: "Observer",
    icon: Eye,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    description: "Read-only access. Can observe the system but cannot make any changes.",
    shortDescription: "Read-only",
    allowedActions: ["View data", "Monitor activity"],
  },
};

/**
 * Beautiful mode badge component for displaying agent mode
 */
export function AgentModeBadge({
  mode,
  size = "md",
  showTooltip = true,
}: {
  mode: AgentMode;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}) {
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  const badge = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.bgColor,
        config.color,
        config.borderColor,
        "border",
        sizeClasses[size]
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{config.label} Mode</p>
          <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Mode selector dropdown with beautiful UI
 */
export function AgentModeSelector({
  value,
  onChange,
  disabled = false,
  size = "md",
  showDescription = false,
}: AgentModeSelectorProps) {
  const [open, setOpen] = useState(false);
  const currentConfig = MODE_CONFIG[value];
  const CurrentIcon = currentConfig.icon;

  const sizeClasses = {
    sm: "h-8 text-xs px-2",
    md: "h-9 text-sm px-3",
    lg: "h-10 text-sm px-4",
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-between gap-2 rounded-lg border transition-all",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50",
          currentConfig.borderColor,
          currentConfig.bgColor,
          sizeClasses[size],
          "min-w-[140px]"
        )}
      >
        <div className="flex items-center gap-2">
          <CurrentIcon className={cn("h-4 w-4", currentConfig.color)} />
          <span className={currentConfig.color}>{currentConfig.label}</span>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[320px] p-2">
        <AnimatePresence>
          {Object.entries(MODE_CONFIG).map(([mode, config], index) => {
            const Icon = config.icon;
            const isSelected = mode === value;

            return (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DropdownMenuItem
                  onClick={() => {
                    onChange?.(mode as AgentMode);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-lg cursor-pointer",
                    "transition-all duration-200",
                    isSelected && config.bgColor,
                    isSelected && config.borderColor,
                    isSelected && "border"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-md", config.bgColor)}>
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div>
                        <span className="font-medium">{config.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {config.shortDescription}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn("p-0.5 rounded-full", config.bgColor)}
                      >
                        <Check className={cn("h-3.5 w-3.5", config.color)} />
                      </motion.div>
                    )}
                  </div>

                  {showDescription && (
                    <div className="mt-1 ml-9">
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {config.allowedActions.map((action) => (
                          <Badge
                            key={action}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </DropdownMenuItem>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Mode info card for detailed display
 */
export function AgentModeCard({
  mode,
  className,
}: {
  mode: AgentMode;
  className?: string;
}) {
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-4",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", config.bgColor, "border", config.borderColor)}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={cn("font-semibold", config.color)}>{config.label} Mode</h4>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>

          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Allowed Actions:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {config.allowedActions.map((action) => (
                <Badge
                  key={action}
                  variant="outline"
                  className={cn("text-xs", config.color, config.borderColor)}
                >
                  {action}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Compact mode indicator for lists/tables
 */
export function AgentModeIndicator({ mode }: { mode: AgentMode }) {
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("p-1 rounded", config.bgColor)}>
            <Icon className={cn("h-3.5 w-3.5", config.color)} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.shortDescription}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
