import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "../../lib/utils";

const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
TooltipProvider.displayName = "TooltipProvider";

function Tooltip({ delayDuration, ...props }: React.ComponentPropsWithoutRef<typeof BaseTooltip.Root> & { delayDuration?: number }) {
  return <BaseTooltip.Root {...(delayDuration != null ? { delay: delayDuration } : {})} {...props} />;
}
Tooltip.displayName = "Tooltip";

// Wrap base-ui Trigger to support Radix-style `asChild` prop
const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BaseTooltip.Trigger> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return (
      <BaseTooltip.Trigger
        ref={ref}
        render={children}
        {...props}
      />
    );
  }
  return (
    <BaseTooltip.Trigger ref={ref} {...props}>
      {children}
    </BaseTooltip.Trigger>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseTooltip.Popup> & {
    sideOffset?: number;
    side?: 'top' | 'bottom' | 'left' | 'right';
  }
>(({ className, sideOffset = 4, side, ...props }, ref) => (
  <BaseTooltip.Portal>
    <BaseTooltip.Positioner sideOffset={sideOffset} side={side}>
      <BaseTooltip.Popup
        ref={ref}
        className={cn(
          "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </BaseTooltip.Positioner>
  </BaseTooltip.Portal>
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
