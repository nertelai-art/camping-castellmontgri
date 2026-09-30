// Frontera de Sentry: la configuració comuna de servidor, edge i navegador viu aquí.
// Sense DSN (local, proves) Sentry queda desactivat.

export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  // Pocs usuaris i trànsit estacional: una mostra petita de traces és suficient i no gasta quota.
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
};
