"use client";

import * as React from "react";
import { ErrorState } from "@/components/shared/error-state";
import { Container } from "@/components/shared/container";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error to server-side or monitoring if needed
    console.error("[App Error Boundary caught]:", error);
  }, [error]);

  return (
    <Container className="flex min-h-[50vh] items-center justify-center p-4">
      <ErrorState
        title="An unexpected error occurred"
        message="We encountered an issue processing this request. Please try again."
        onRetry={reset}
        retryLabel="Reload"
      />
    </Container>
  );
}
