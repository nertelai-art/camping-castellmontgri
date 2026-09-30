import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry";

/** S'importa de manera diferida des d'instrumentation-client: el SDK del navegador pesa ~120 KB comprimit. */
export function initSentryClient() {
  Sentry.init(sentryOptions);
}
