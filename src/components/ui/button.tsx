import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer rounded-md";

    const variantStyles = {
      default: "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm",
      secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
      outline:
        "border border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-100",
      ghost: "text-neutral-900 hover:bg-neutral-100",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-sm min-h-[36px]",
      md: "h-11 px-4 py-2 text-sm min-h-[44px]", // Accessible touch target
      lg: "h-12 px-6 text-base min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
