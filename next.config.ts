import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Imatges del web actual mentre no estiguin migrades a Supabase Storage.
      { protocol: "https", hostname: "www.camping-castellmontgri.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
