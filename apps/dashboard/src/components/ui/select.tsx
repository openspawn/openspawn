import * as React from "react";
import { cn } from "../../lib/utils";

/* ------------------------------------------------------------------ */
/*  Lightweight native <select> wrappers (semantic theme colors)      */
/* ------------------------------------------------------------------ */

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-input bg-background px-3 pr-8 py-1 text-sm shadow-sm transition-colors",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

/* Re-export pieces for compatibility */

const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
      "focus:outline-none focus:ring-1 focus:ring-ring",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
SelectTrigger.displayName = "SelectTrigger";

function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-muted-foreground">{placeholder}</span>;
}

function SelectContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-popover p-1 shadow-md text-popover-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, children, ...props }, ref) => (
  <option
    ref={ref}
    className={cn("relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm", className)}
    {...props}
  >
    {children}
  </option>
));
SelectItem.displayName = "SelectItem";

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
