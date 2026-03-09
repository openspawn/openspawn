import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const modalPanelVariants = cva(
  "relative w-full rounded-2xl bg-linear-to-b from-bb-ocean-900/[0.98] to-bb-ocean-abyss/[0.99] backdrop-blur-2xl shadow-[0_0_40px]",
  {
    variants: {
      intent: {
        default: "border border-bb-ocean-400/25 shadow-bb-ocean-400/10",
        destructive: "border border-bb-coral-500/25 shadow-bb-coral-500/10",
      },
      size: {
        sm: "max-w-sm p-6",
        md: "max-w-md p-6",
        lg: "max-w-lg p-0",
      },
    },
    defaultVariants: {
      intent: "default",
      size: "sm",
    },
  },
);

interface ModalContainerProps extends VariantProps<typeof modalPanelVariants> {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

function ModalContainer({ intent, size, onClose, children, className }: ModalContainerProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-[fade-in_0.15s_ease-out]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-bb-ocean-abyss/60" onClick={onClose} />
      {/* panel */}
      <div
        className={cn(
          modalPanelVariants({ intent, size }),
          "animate-[scale-in_0.2s_ease-out]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export { ModalContainer, modalPanelVariants };
