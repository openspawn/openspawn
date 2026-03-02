import * as React from "react";
import { Progress as BaseProgress } from "@base-ui/react/progress";
import { cn } from "../../lib/utils";

const Progress = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseProgress.Root>
>(({ className, value, ...props }, ref) => (
  <BaseProgress.Root
    ref={ref}
    value={value}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <BaseProgress.Track>
      <BaseProgress.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </BaseProgress.Track>
  </BaseProgress.Root>
));
Progress.displayName = "Progress";

export { Progress };
