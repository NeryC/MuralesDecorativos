"use client";
import { ErrorView } from "@/components/error-view";
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorView onRetry={reset} />;
}
