import * as Sentry from "@sentry/node";

export function captureError(e: any) {
  console.error(e);
  Sentry.captureException(e);
}
