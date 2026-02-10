import * as React from "react";
import { cn } from "../../lib/utils";

/* ------------------------------------------------------------------ */
/*  Lightweight native <select> wrappers (no Radix dependency)        */
/* ------------------------------------------------------------------ */

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

/* Re-export pieces that inbound-webhooks-settings.tsx imports */

const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm",
      "focus:outline-none focus:ring-1 focus:ring-blue-500",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
SelectTrigger.displayName = "SelectTrigger";

function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-zinc-400">{placeholder}</span>;
}

function SelectContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md border border-zinc-700 bg-zinc-900 p-1 shadow-md",
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
