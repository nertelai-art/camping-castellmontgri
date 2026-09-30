import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:55621");
const localSupabase = ["127.0.0.1", "localhost"].includes(supabase.hostname);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: supabase.protocol.replace(":", "") as "http" | "https",
        hostname: supabase.hostname,
        port: supabase.port,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Només en local: Next 16 no optimitza imatges d'adreces privades, i el Supabase local és a 127.0.0.1.
    dangerouslyAllowLocalIP: localSupabase,
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "nertel",
  project: "camping-castellmontgri",
  // Els source maps només es pugen si hi ha token (Vercel); en local i a la CI, no.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
