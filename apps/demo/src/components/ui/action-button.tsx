import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const actionButtonVariants = cva(
  "inline-flex items-center gap-2.5 rounded-xl text-sm font-semibold font-body transition-all duration-200 border",
  {
    variants: {
      intent: {
        ocean:
          "bg-bb-ocean-400/10 border-bb-ocean-400/20 text-bb-ocean-200 hover:bg-bb-ocean-400/15",
        kelp: "bg-bb-kelp-400/12 border-bb-kelp-400/25 text-bb-kelp-400 hover:bg-bb-kelp-400/18",
        sandy:
          "bg-bb-sandy-400/12 border-bb-sandy-400/25 text-bb-sandy-400 hover:bg-bb-sandy-400/18",
        coral:
          "bg-bb-coral-500/8 border-bb-coral-500/20 text-bb-coral-500 hover:bg-bb-coral-500/15",
        indigo: "bg-indigo-400/10 border-indigo-400/20 text-indigo-400 hover:bg-indigo-400/15",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-xs",
        lg: "px-4 py-3 text-sm",
      },
      fullWidth: {
        true: "w-full justify-center",
        false: "",
      },
    },
    defaultVariants: {
      intent: "ocean",
      size: "md",
      fullWidth: false,
    },
  },
);

interface ActionButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, intent, size, fullWidth, ...props }, ref) => {
    return (
      <button
        className={cn(actionButtonVariants({ intent, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
ActionButton.displayName = "ActionButton";

export { ActionButton, actionButtonVariants };
