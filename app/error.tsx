"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/error-view";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error.tsx]", error);
  }, [error]);

  return <ErrorView onRetry={reset} />;
}
