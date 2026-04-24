"use client";
import { ErrorView } from "@/components/error-view";
export default function ReportarError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorView onRetry={reset} />;
}
