import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  className?: string;
  message?: string;
}

export function LoadingState({
  className,
  message = "Loading, please wait...",
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[200px] p-6 text-center",
        className
      )}
    >
      <LoadingSpinner size="lg" label={message} />
      <p className="mt-4 text-sm text-neutral-600 font-medium">{message}</p>
    </div>
  );
}
