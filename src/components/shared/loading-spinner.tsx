import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function LoadingSpinner({
  className,
  size = "md",
  label = "Loading...",
}: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      role="status"
      className={cn("inline-flex items-center justify-center", className)}
    >
      <svg
        className={cn("animate-spin text-neutral-900", sizeStyles[size])}
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
      <span className="sr-only">{label}</span>
    </div>
  );
}
