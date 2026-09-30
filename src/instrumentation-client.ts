// Sentry al navegador es carrega quan el navegador està ociós, no a la primera pintada: el SDK fa
// ~120 KB comprimit i a mòbil costava més d'un segon de CPU. Contrapartida acceptada: un error que
// passi abans que carregui no es registra. Al servidor (instrumentation.ts) Sentry és immediat.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const load = () => void import("@/lib/monitoring/sentry-client").then((m) => m.initSentryClient());
  if ("requestIdleCallback" in window) window.requestIdleCallback(load, { timeout: 5000 });
  else setTimeout(load, 3000);
}
