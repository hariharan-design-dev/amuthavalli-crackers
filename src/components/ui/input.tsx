import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error = false, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        className={cn(
          "flex h-11 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500",
          "min-h-[44px] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
