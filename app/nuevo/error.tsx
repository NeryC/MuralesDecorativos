"use client";
import { ErrorView } from "@/components/error-view";

export default function NuevoError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorView onRetry={reset} />;
}
