import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error = false, disabled, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          className={cn(
            "flex h-11 w-full appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 pr-8 text-sm text-neutral-900",
            "min-h-[44px] transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
    );
  }
);

Select.displayName = "Select";
