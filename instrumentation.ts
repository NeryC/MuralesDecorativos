import * as Sentry from "@sentry/nextjs";
import { setReporter } from "@/lib/observability";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }

  if (process.env.SENTRY_DSN) {
    setReporter({
      captureException: (error, extras) => {
        Sentry.captureException(error, extras ? { extra: extras } : undefined);
      },
      captureMessage: (message, extras) => {
        Sentry.captureMessage(message, extras ? { extra: extras } : undefined);
      },
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
