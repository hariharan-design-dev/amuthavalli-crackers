"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Global Error]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-4 bg-white text-neutral-900 font-sans">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold tracking-tight">Application Error</h1>
          <p className="mt-2 text-sm text-neutral-600">
            A critical error occurred while loading the application.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
