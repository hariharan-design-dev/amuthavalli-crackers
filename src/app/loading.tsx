import { LoadingState } from "@/components/shared/loading-state";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <LoadingState message="Loading..." />
    </div>
  );
}
