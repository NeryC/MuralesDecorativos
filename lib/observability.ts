type Extras = Record<string, unknown>;

interface Reporter {
  captureException(error: unknown, extras?: Extras): void;
  captureMessage(message: string, extras?: Extras): void;
}

const consoleReporter: Reporter = {
  captureException(error, extras) {
    if (extras) {
      console.error("[error]", error, extras);
    } else {
      console.error("[error]", error);
    }
  },
  captureMessage(message, extras) {
    if (extras) {
      console.warn("[warn]", message, extras);
    } else {
      console.warn("[warn]", message);
    }
  },
};

let reporter: Reporter = consoleReporter;

export function setReporter(custom: Reporter) {
  reporter = custom;
}

export function captureException(error: unknown, extras?: Extras) {
  reporter.captureException(error, extras);
}

export function captureMessage(message: string, extras?: Extras) {
  reporter.captureMessage(message, extras);
}
